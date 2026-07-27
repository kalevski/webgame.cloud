# Outbound webhooks

The mirror image of the audit log: every consequential action the app records can also be POSTed to a URL
you control, signed so the receiver can trust it.

- API: `api/src/services/WebhookService.ts`, `repositories/webhooks/`, fan-out in `api/src/audit.ts`,
  routes in `routers/platformRouter.ts`.
- Web: *Admin → Webhooks* (`web/src/modules/WebhooksAdmin.tsx`, `modals/WebhookModal.tsx`).

## The audit log IS the event catalog

There is no second registry of event names to maintain. An endpoint subscribes to `events`, which are
audit **action** strings (`create_project`, `update_user`, `run_jobs`, …), and the endpoint editor fills its
picker from `GET /api/webhooks/events` — the distinct actions actually present in `audit_log`. Anything the
app starts auditing becomes subscribable with no code change.

The consequence to keep in mind: an action nobody has performed yet does not appear in the picker.

## Delivery

`recordAudit` fans out (`api/src/audit.ts`): it writes the audit row, then queues one `webhook_deliveries`
row per matching active endpoint and enqueues a `webhook_delivery` job for each. Both the email-trigger and
webhook fan-outs are wrapped in `try/catch` and never block or fail the request that caused them.

The actual HTTP call happens in the job worker, which is what gives retries with backoff for free
(background-jobs.md). `WebhookService.deliver` re-throws on failure so the job is marked failed and retried;
`markFailed` records the response status and error on the delivery row either way.

Payload is the audit entry — `deliveryId`, `action`, `actorId`, `actorName`, `targetId`, `detail`,
`occurredAt` — so every event has the same shape regardless of what happened.

## Signing

Three headers travel with each POST:

```
x-appkit-event: create_project
x-appkit-timestamp: 1785083541
x-appkit-signature: sha256=<hex>
```

The signature is `HMAC-SHA256(secret, "<timestamp>.<body>")`. Receivers should recompute it over the **raw**
body and compare in constant time, and reject a timestamp outside their tolerance — that is what stops a
captured payload being replayed. The secret is generated on create if you do not supply one, is never
returned by the API (`secretSet: boolean` is all the contract exposes), and a blank value on update keeps
the existing one.

Requests time out after 10s (`TIMEOUT_MS`), so one hung endpoint cannot occupy a worker slot indefinitely.

## Admin surface

*Admin → Webhooks* (`webhook.read` to view, `webhook.write` to change) lists endpoints with their event
count and paused state, and below that a filtered, paginated delivery log — status, attempts, response code
or error. Deliveries also accept cursor pagination (pagination.md). Deleting an endpoint soft-deletes its
deliveries in the same statement.

`WebhookModal` subscribes an endpoint through a **`tc-extended-select multiple`** over `GET
/api/webhooks/events` — a searchable checklist, so a long action catalog stays workable. It is a controlled
field, so editing an existing endpoint prefills it with `setSelected(endpoint.events)`. See
frontend-architecture.md for the rules that come with `multiple`.

## What is deliberately missing

No per-endpoint secret rotation window (one secret at a time), no delivery replay button, no circuit
breaker that auto-pauses a permanently failing endpoint, and no `Idempotency-Key` on the outbound request —
receivers should dedupe on `deliveryId`, which is stable across retries.
