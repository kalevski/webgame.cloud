# Platform hardening

The cross-cutting protections that sit in front of every route, plus the endpoints an orchestrator needs.
None of these belong to a feature; they are properties of the server. All of them are registered in
`api/src/http.ts`, in the order listed there.

## Security headers

`api/src/http/headers.ts` sets, on every response: `content-security-policy`, `x-content-type-options`,
`x-frame-options: DENY`, `referrer-policy: no-referrer`, `cross-origin-opener-policy`,
`cross-origin-resource-policy`, `permissions-policy` (camera/microphone/geolocation/FLoC off) and
`x-request-id`. `strict-transport-security` is added only when the request arrived over HTTPS, so it never
poisons a local HTTP session.

The CSP has two forms. Production is `default-src 'none'` — correct for an API that only ever returns JSON.
Development relaxes it (`'unsafe-inline'`, `'unsafe-eval'`, `ws:`, `localhost:*`) so Vite's HMR works, and
is selected by `DEV_LOGIN`. The web build is served separately and carries its own policy from whatever
hosts it.

`cross-origin-resource-policy` follows `CORS_ORIGIN`: `same-origin` when the API and SPA share a host,
`cross-origin` when they do not.

## CSRF

Cookie sessions mean a cross-site form could otherwise ride along. `http.ts` rejects any mutating request
(`POST`/`PUT`/`PATCH`/`DELETE`) whose `Origin` is neither the server's own origin, nor `CORS_ORIGIN`, nor —
in dev only — localhost, with `cross_origin_rejected`. Bearer-token callers are unaffected in practice
because browsers do not attach an `Origin` for them, and scripts are not the attack this defends against.

## Rate limiting

`api/src/http/rateLimit.ts` is a `preHandler` factory backed by the `rate_limits` table, so the budget is
shared across instances rather than per-process. `rateLimit({ name, max, windowSeconds, by? })` keys on the
user id, falling back to the IP; `emailKey` keys on `ip + body.email` instead, which is what you want for
"stop guessing addresses" flows. Over budget returns `429` with `retry-after` and a `rate_limited` cause
carrying the seconds — `strings.errors.rate_limited` renders it.

It is applied where abuse is cheap and costly, not globally:

| Route | Budget |
| --- | --- |
| `POST /api/auth/magic-link` | 5 per 15 min, per IP + email |
| `GET /api/auth/magic-link/:token` | 20 per 15 min |
| `POST /api/auth/dev` | 10 per 5 min, per IP + email |
| `POST /api/moderation/reports` | 10 per hour |
| `POST /api/billing/enquiries` | 5 per hour |
| `POST /api/email/compose` | 30 per hour |

## Idempotency keys

`api/src/http/idempotency.ts` gives retried mutations a safe outcome. Send `Idempotency-Key: <value>` on a
`POST`/`PUT`/`PATCH`; the first successful response is stored in `idempotency_keys` and any later request
with the same key replays it verbatim, with `idempotent-replay: true` and the original status. Failures
(`>= 400`) are not stored, so a retry after an error genuinely retries.

The header is optional and unused by the SPA today — it exists for API clients, and is the mechanism a
derived project should reach for before making `apiFetch` retry mutations (frontend-architecture.md).

## Health, readiness and version

Three unauthenticated endpoints in `routers/healthRouter.ts`:

- `GET /api/health` — liveness. Runs `SELECT 1`; proves the process answers and the pool works.
- `GET /api/ready` — readiness for an orchestrator. Reports the applied goose migration version and every
  registered worker's last heartbeat, and answers **503** unless the database is reachable, migrations have
  run, and no worker is stale. Workers register themselves through `api/src/health.ts` with their tick
  interval; "stale" is three missed intervals.
- `GET /api/version` — name, version, `BUILD_SHA` and process start time, so a deploy can be identified.

## Request IDs

Fastify generates a `reqId` per request. `x-request-id` returns it to the client, and `recordAudit` stamps
it on the audit row, so a user-reported failure can be traced from the response header to the exact audited
action. There is no client-side surfacing of it yet — the error boundary shows a stack, not the id.

## Multi-instance cache invalidation

`AccessPolicyService` caches the access policy, role rows and per-user overrides in process with a 30s TTL.
With two instances that would mean up to 30s of stale authorization after a role change. Postgres
`LISTEN`/`NOTIFY` closes it: any write calls `invalidate()`/`invalidateUser(id)`, which clears the local
cache and publishes on the `access_policy_changed` channel (`Database.notify`); every instance subscribes on
boot (`Database.listen`) and clears the same entry. Payload `*` means the whole policy, anything else is a
user id. No Redis involved.
