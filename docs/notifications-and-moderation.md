# Notifications & moderation

Two generic admin/engagement surfaces, both kept because they exercise reusable patterns (best-effort side effects; a denormalized queue; an append-only trail).

## Notifications & web push

- API: `api/src/notify.ts` (the one emission point — `notify(userId, kind, title, link)`), `api/src/services/{NotificationService,PushService}.ts`, `api/src/routers/notificationRouter.ts`, repositories under `repositories/{notifications,push}/`.
- Web: `web/src/services/NotificationService.ts`, `web/src/state/notifications.slice.ts`, `web/src/modules/NotificationsBell.tsx`.

The in-app bell inbox (`notifications` table) is the source of truth; web push mirrors it best-effort. `notify(...)` writes the row and fires push detached, catching every error — a failed notification must never fail the action that caused it — but it **logs a warning** on the `notify` scope rather than swallowing silently, because an emission that never lands is otherwise invisible. `NOTIFICATION_KINDS` is a token vocabulary; the human title is built at emission and stored on the row.

**Who emits.** Each kind has a producer, so the inbox is populated on a fresh clone rather than being scaffolding waiting for a caller:

| Kind | Emitted by | When |
|------|-----------|------|
| `welcome` | `AuthService` (both the OAuth and dev-login account-creation paths) | a new account is created |
| `project_shared` | `announceShared` in `routers/projectRouter.ts` | a project is created as, or flipped to, `shared` — fans out to every other active account |
| `task_activity` | `announceActivity` in `routers/projectRouter.ts` | someone **other than the project owner** adds a task or changes its status, and the project has `notifyOnActivity` on. Sent with `collapse: true`, so a burst of edits keeps one row per project |
| `system` | `UserService.update` | an admin changes an account's role |

`notifyOnActivity` (a per-project switch in the project's Settings tab) is read only by `announceActivity` — that is the whole of its meaning.

**`NOTIFICATION_KINDS` and the `notifications.kind` CHECK constraint must change in lockstep.** The database rejects an unknown kind, and because `notify()` catches, a mismatch shows up only as a warning in the log and a notification that never arrives — not as a failed request. Adding a kind means editing `contracts/notifications.ts` *and* the `CHECK` in `migrations/sql/00001_schema.sql`, then rebuilding the local database.

Web push VAPID keys are self-provisioned on first use and stored in `settings` (`PushService.ensureKeys`) — no push configuration needed to run. Set the `mailto:` VAPID subject in `PushService` to your own contact.

## Moderation & audit

- API: `api/src/services/ModerationService.ts`, `api/src/routers/moderationRouter.ts`, `repositories/moderation/{ReportRepository,AuditRepository}.ts`, `schema/moderation.ts`.
- Web: `web/src/services/ModerationService.ts`, `web/src/state/moderation.slice.ts`, `web/src/modules/Moderation.tsx`, `web/src/modals/ReportModal.tsx`.

**Reports** (`reports` table): any signed-in user reports a target — `REPORT_TARGET_KINDS = ['project', 'user']`. The `target_label` is denormalized at insert so the queue survives the target's deletion. A partial unique index enforces one open report per (reporter, target); the repo returns an `'exists'` sentinel the router maps to 409. `moderation.report.resolve` closes a report.

**Audit log** (`audit_log` table): append-only, no update/delete route anywhere. `recordAudit(actor, action, targetId, detail)` — or `recordRequestAudit(request, …)`, which additionally stamps the request id and the `impersonated` flag when the session was opened by an administrator (auth-and-sessions.md) — is called `void`-style (it swallows its own errors — an audit write must never fail the request) after every consequential action **by any account, not just admins**:

- Auth: `sign_in` (with the provider or `dev`), `sign_out`, `link_identity`.
- Account: `accept_consent`, `rename_account`, `unlink_identity`, `revoke_session`, `export_account`, `delete_account`.
- Example feature: `create_project`, `delete_project`, `export_project`, `create_task`, `delete_task`.
- Billing self-serve: `start_checkout` (records the outcome), `cancel_subscription`, `submit_enquiry`.
- Admin: `create_user`, `update_user`, `impersonate_user`, `update_settings`, `update_feature_flags`, role writes, plan/invoice writes, `sales_enquiry_action`, `resolve_report`.

`actor_name` is denormalized so the row reads correctly even when the actor is gone. Deletion is soft (database-conventions.md), so `actor_id` in practice still points at the soft-deleted account rather than decaying to `NULL`.

When the `email` flag is on, `recordAudit` also evaluates the email triggers bound to that action and queues transactional mail — see email.md. That call is wrapped in try/catch, so a mail failure never fails the action.

Reading it is gated by `audit.read`: `GET /api/moderation/audit-log` takes `actorId`, `action`, `q` (matches actor name, action, target, detail or the actor's email), `from`, `to`, `limit`, `offset`, and returns `{ entries, total, actions }` — `actions` is the distinct action vocabulary actually present, so the filter dropdown builds itself.

The web view is the *Audit log* tab of `/moderation` — a `tc-advanced-table` with search, an action filter, date pickers and pagination. The admin user directory has a per-row **Activity** icon button (`audit.read` only) that links to `/moderation/audit?actor=<id>`, which pre-filters the table to that one account.
