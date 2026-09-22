# Email delivery

Templates, audit-driven transactional mail, scheduled campaigns and a queue worker — all behind the `email` product flag, **seeded on**. With the flag off nothing is exposed and the worker idles; with it on and no provider configured, mail is still queued and "sent" through the `log` provider so the whole path is exercisable in development.

## Key files

- Contracts: `api/src/contracts/email.ts` (`EmailConfig`, `EmailTemplate`, `EmailTrigger`, `EmailMessage`, compose/filter shapes).
- API: `api/src/domain/email.ts` (the provider port + `log`/`smtp`/`mailchimp` adapters + `renderTemplate`), `api/src/services/EmailService.ts`, `api/src/services/EmailWorker.ts`, `api/src/repositories/email/EmailRepository.ts`, `api/src/routers/emailRouter.ts`.
- Schema: `email_templates`, `email_triggers`, `email_messages` (`api/migrations/sql/00001_schema.sql`); two seeded templates + `feature_email=true` and `email_provider=log` (`00002_seed.sql`).
- Web: `web/src/services/EmailService.ts`, `web/src/state/email.slice.ts`, `web/src/modules/{EmailSettingsPanel,EmailOutbox,EmailTemplatesAdmin,EmailTriggersAdmin}.tsx`, `web/src/modals/{EmailTemplateModal,EmailComposeModal}.tsx`, `web/src/pages/EmailPage.tsx`.

Permissions: every route sits behind `requireFeature('email')` + `requireAuth`, then one of five keys — `email.outbox.read` (outbox, templates and triggers reads, plus the audit-action and recipient lookups), `email.send` (compose, retry, cancel), `email.template.write`, `email.trigger.write`, `email.config.write` (provider credentials and the test send). See access-and-feature-flags.md.

## Providers

`EmailPort` is the whole provider contract:

```ts
export type EmailPort = {
    id: EmailProvider
    batchSize: number
    ready(sender: EmailSender): boolean
    send(messages: OutgoingEmail[], sender: EmailSender): Promise<SendResult[]>
}
```

Three adapters register themselves at import time:

- **`log`** — writes each message to the app logger and reports success. The default, so a fresh clone can exercise templates, triggers and the outbox with no credentials.
- **`smtp`** — `nodemailer` transport built per batch from host/port/user/password/TLS.
- **`mailchimp`** — Mandrill `messages/send` over HTTPS with the API key; per-message result mapping so a rejection becomes a failed row rather than a silent drop.

Configuration lives in `settings` rows (`email_provider`, `email_from_*`, `email_smtp_*`, `email_mailchimp_key`, `email_batch_size`). **Secrets are never returned** — `GET /api/email/config` reports `smtpPasswordSet` / `mailchimpKeySet` booleans instead, and a blank field on save keeps the stored value. If the selected provider is not `ready()` the service falls back to `log` and says so in the logs, so a misconfiguration never wedges the queue.

Adding a provider: implement `EmailPort`, call `registerEmailPort(yourPort)`, add its id to `EMAIL_PROVIDERS`.

## Queue & worker

`email_messages` is the queue: recipient, rendered subject/body, optional `template_key`, `status` (`queued`/`sending`/`sent`/`failed`/`canceled`), `attempts`, `error`, `scheduled_at`, `sent_at`.

`EmailWorker` starts at boot (`index.ts`) and ticks every 10s. Each tick:

1. no-ops when the `email` flag is off — so flipping the flag on at runtime starts delivery without a restart;
2. re-queues anything stuck in `sending` for more than 10 minutes (crash recovery);
3. claims up to `batchSize` due rows with `UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED) RETURNING *` — safe with multiple API instances;
4. hands the batch to the provider (`batchSize` is clamped to the port's own limit);
5. marks each row `sent`, or increments `attempts` and re-queues with a 60s backoff until 5 attempts, then `failed`.

Composing or retrying also kicks a tick immediately so nothing waits for the interval in the UI.

## Templates

`email_templates` rows: `key` (slugged from the name), `name`, `description`, `subject`, `body`, `active`. Placeholders are `{{name}}` and rendered by `renderTemplate` with: `workspace`, `recipientName`, `recipientEmail`, `actorName`, `actorEmail`, `date`, and for triggers also `action`, `targetId`, `detail`. Unknown placeholders render as empty strings.

The editor (`EmailTemplateModal`, from the *Templates* tab) has a live preview pane with sample values so the body can be checked without sending.

## Audit-driven transactional mail

`email_triggers` bind an **audit action** to a template: `{ action, templateKey, recipient, roleId, userIds, customEmail, active }` with `recipient` one of:

- `actor` — the account that performed the action;
- `role` — every active account holding `roleId` (roles are runtime rows, so the select is populated from the live role list);
- `members` — the explicit accounts listed in `userIds`;
- `custom` — a comma-separated address list in `customEmail`.

`recordAudit(...)` — which already fires after every consequential action by any account (see notifications-and-moderation.md) — calls `EmailService.handleAuditEvent` when the flag is on. That looks up active triggers for the action, resolves recipients through `resolveTriggerRecipients`, renders the template per recipient and queues the result. It is wrapped in try/catch: **a mail failure never fails the action or the audit write**.

The *Triggers* tab builds its action dropdown from `GET /api/email/audit-actions` — the audit log's own distinct-action list — so anything the app audits can be wired to a mail with no code, and role/member pickers come from `GET /api/email/recipients`.

## Composing and scheduling

`POST /api/email/messages` takes `{ audience, roleId?, userIds?, emails?, templateKey?, subject?, body?, variables?, scheduledAt? }`. Audiences: `self`, `custom` (explicit addresses), `all_users` (every active account), `role` (every active account holding a role), `members` (explicitly selected accounts). Template + overrides compose: pick a template and still override the subject or body. `variables` is merged into the render context on top of the built-ins, so a template's own placeholders can be filled at send time. `scheduledAt` in the future leaves the rows `queued` until the worker's clock catches up.

The **Compose** modal (`EmailComposeModal`, opened from the Outbox card action) drives all of this: pick a template or write a custom subject/body, and every `{{placeholder}}` in the composed text that is not a built-in becomes a *Template fields* input feeding `variables`.

## Endpoints

All under `requireFeature('email')` + the key listed above for their area, all writes audited:

- `GET`/`PUT /api/email/config`, `POST /api/email/config/test` (queues a test mail to the caller).
- `GET`/`POST /api/email/templates`, `PATCH`/`DELETE /api/email/templates/:key`.
- `GET`/`POST /api/email/triggers`, `DELETE /api/email/triggers/:id`.
- `GET /api/email/audit-actions` — distinct actions present in the audit log, for the trigger dropdown.
- `GET /api/email/recipients` — active accounts (`id`, `name`, `email`, role) plus the role list, for the role/member pickers.
- `GET /api/email/messages` — filters `status`, `templateKey`, `q`, `from`, `to`, `limit`, `offset`; returns `{ messages, total, stats }` where `stats` is a per-status count for the outbox tiles.
- `POST /api/email/messages` — compose/schedule. `PATCH /api/email/messages/:id` — `queued` (retry) or `canceled`.

## Web surface

`/platform/email` (nav group *Platform*, visible with the flag on and `email.outbox.read`) opens with a `tc-rich-page-header` (*Email*, `Mail`/blue) above up to four route tabs — *Delivery* appears only with `email.config.write`, and each tab's card action and row actions are hidden without the matching write key (read-only viewers get a plain `tc-data-list` instead of the actionable `tc-action-row-list`). Each tab's action sits in its section card's `action` slot, so the card title is written once:

- **Outbox** (`/platform/email`) — per-status metric tiles, a `tc-advanced-table` with search/status/template filters and per-row retry / cancel icon buttons. Card action: **Compose**.
- **Templates** (`/platform/email/templates`) — list plus the editor modal with preview. Card action: **New template**.
- **Triggers** (`/platform/email/triggers`) — the existing bindings, plus card action **Add trigger** which opens `EmailTriggerModal` ("action → template → send to", with a role select or member multi-select appearing for the `role` / `members` recipient modes).
- **Delivery** (`/platform/email/settings`) — provider credentials and batch size. **Send test email** is the card action; **Save** lives in the floating action bar and appears only once a field is touched (`dirty`), matching project settings. Re-seeding from the server clears the flag, and the secret refs reset so a saved password is not re-sent.

The `members` audience in both `EmailComposeModal` and `EmailTriggerModal` is a **`tc-extended-select multiple`** over `GET /api/email/recipients` — searchable by name or address, and the menu stays open so a handful of recipients is one pass rather than one reopen each. See frontend-architecture.md for the rules that come with `multiple`.

## Verifying locally

```bash
curl -s -b admin.txt -X PUT localhost:6000/api/settings/features \
    -H 'Content-Type: application/json' -H 'Origin: http://localhost:6000' -d '{"email":true}'
curl -s -b admin.txt -X POST localhost:6000/api/email/config/test -H 'Origin: http://localhost:6000' | jq '.data'
curl -s -b admin.txt localhost:6000/api/email/messages | jq '.data.stats'
```

With the default `log` provider the API log prints one `email (log provider)` line per message and the rows flip to `sent` on the next tick.
