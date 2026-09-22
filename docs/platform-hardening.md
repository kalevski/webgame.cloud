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

The key is **reserved before the handler runs**, not written after it. Writing it afterwards left a window
in which eight concurrent `POST`s sharing one key all passed the check and all created a row. The reservation
is a single `INSERT … ON CONFLICT` (`reserve-idempotency-key.sql`) that also stores a **fingerprint** of the
route plus body:

- A second request arriving while the first is still in flight gets `idempotency_in_flight`.
- A request reusing a key with a *different* body gets `idempotency_key_reused`, rather than silently
  replaying an unrelated response.
- A handler that fails releases the reservation (`release-idempotency-key.sql`), so the retry is real.
- A reservation older than five minutes is taken over, so a crashed process cannot wedge a key forever.

Keys are scoped per user and per route, so two accounts cannot collide on the same key value.

The header is optional and unused by the SPA today — it exists for API clients, and is the mechanism a
derived project should reach for before making `apiFetch` retry mutations (frontend-architecture.md).

## Health, readiness and version

Three unauthenticated endpoints in `routers/healthRouter.ts`:

- `GET /api/health` — liveness. Runs `SELECT 1`; proves the process answers and the pool works.
- `GET /api/ready` — readiness for an orchestrator. Answers **503** unless every `READINESS_BLOCKING`
  component is healthy. It returns only `{ ready }` to an anonymous caller; the full component report is
  behind `admin.overview.read`, so a public prober learns whether to route traffic here and nothing more.
  The component model, the alarms and `GET /api/ops/status` are in [operations.md](operations.md).
- `GET /api/version` — name, version, `BUILD_SHA` and process start time, so a deploy can be identified.

## Error responses

`http.ts`'s `errorHandler` is the single place a thrown error becomes a response. It recognises `AppError`
(`domain/errors.ts`) and renders `{ error: encodeErrorCause(code, ...params) }` at the error's own status, so
handlers **throw** rather than hand-building an envelope, and routers carry no pure-passthrough `try`/`catch`.

Three other cases it separates:

- Fastify validation errors become `400 invalid_body` naming the offending field.
- Any other **4xx** Fastify raises — `415`, `413`, its own `400` — is honoured as a 4xx and logged at `warn`.
  It used to be flattened into a logged `internal_error`, which meant a client looping on a bad content-type
  read as a server incident and reached the observability sink.
- Only genuine **5xx** is logged at `error` and reported through `reportError`.

## Production config guard

`assertProductionConfig()` (`domain/production.ts`) refuses to boot under `APP_ENV=production` with
`DEV_LOGIN` on, no SSO provider, `WEBHOOK_ALLOW_PRIVATE` on, `DATABASE_SSLMODE=disable`, or a missing
`WEB_URL`/`API_URL`. See [operations.md](operations.md).

## Database connection

`DATABASE_SSLMODE` is honoured by the pool (`env.ts`), not only by goose. It was previously read by the
migration scripts alone, so migrations ran over TLS while the application connected in clear text to the same
managed Postgres — silently. The pool also sets `DATABASE_POOL_MAX`, a connection timeout and
`DATABASE_STATEMENT_TIMEOUT_MS`, so one pathological query cannot hold a connection open indefinitely.

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


## Realm and public route exemptions

`/api/realm/*` and `/api/internal/*` authenticate with a per-realm bearer token and carry no cookie, so
they are skipped by the CSRF origin guard. `/api/public/*` writes are cross-origin form posts and are
skipped too — the waitlist POST is protected by the DB-backed limiter (5/hour/IP) and a honeypot instead.

Public **reads** (the game runtime API) do not use the DB-backed limiter at all: they get an in-process
token bucket (20 rps, burst 100, per IP) plus a short response cache, because a `rate_limits` upsert per
request would mean a Postgres write per player per fetch. See [game-runtime-api.md](game-runtime-api.md).
