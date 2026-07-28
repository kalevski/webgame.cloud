# Documentation

One file per feature area. Jump to the focused doc instead of re-reading the codebase. When you change a feature's behaviour, update its doc in the same change (see the Documentation policy in `CLAUDE.md`).

| Doc | What it covers |
| --- | --- |
| [access-and-feature-flags.md](access-and-feature-flags.md) | Roles, permissions, per-user overrides, quotas/limits, behavioural slots and the entitlement/paywall system — the authorization core. |
| [auth-and-sessions.md](auth-and-sessions.md) | Cookie sessions, Google SSO, dev login, the first-user-is-owner rule, consent gate. |
| [users-and-settings.md](users-and-settings.md) | Admin user directory (create/impersonate/patch), self-serve account (rename/export/delete), platform settings, admin overview. |
| [subscriptions-and-billing.md](subscriptions-and-billing.md) | Feature flags, plans, subscriptions and the provider port — a full billing surface with no payment gateway attached. |
| [email.md](email.md) | Email delivery — provider port (log/SMTP/Mailchimp), templates, audit-driven transactional mail, scheduled campaigns and the queue worker. |
| [notifications-and-moderation.md](notifications-and-moderation.md) | Bell inbox + web push; the reports queue and the append-only audit log. |
| [file-storage.md](file-storage.md) | Pluggable upload sources (disk/S3), the file-type → source binding, and the upload API — behind the `files` flag. |
| [projects-and-members.md](projects-and-members.md) | Projects, the second (per-project) permission plane, membership, invitations, vocabularies, ownership transfer, archive and delete. |
| [realms-and-migrations.md](realms-and-migrations.md) | Build machines, realm selection, the per-realm bearer token, the project lock and the migration state machine. |
| [asset-files.md](asset-files.md) | Game assets — the direct-to-realm upload protocol, tags and categories, the orphan reaper. |
| [bundles.md](bundles.md) | A bundle is a saved file query — the shared preview/build predicate and the parent/child relations array. |
| [builds.md](builds.md) | Triggering, the realm claim/report/result protocol, build tags, purge and stale reaping. |
| [config-data.md](config-data.md) | Schemas, configs and per-build-tag versions — changing a shipped game without rebuilding it. |
| [game-runtime-api.md](game-runtime-api.md) | The public, unenveloped surface a shipped game reads, its caching and its in-process rate limiter. |
| [landing-and-waitlist.md](landing-and-waitlist.md) | The public marketing route, the waitlist write and the 250 MB grant applied at sign-in. |
| [frontend-architecture.md](frontend-architecture.md) | Web SPA layering, store/slices, modal registry, layouts, the theme. |
| [deployment.md](deployment.md) | Docker image, entrypoint, env vars, same-origin vs cross-origin. |
| [pagination.md](pagination.md) | Offset vs cursor (keyset) paging, the `(created_at, id)` total order, and which endpoints support which. |
| [database-conventions.md](database-conventions.md) | The rules every table obeys — `created_at`/`updated_at`/`deleted_at`, soft delete instead of `DELETE`, partial indexes, revive-on-conflict inserts. |
| [api-keys.md](api-keys.md) | Bearer tokens for scripts and integrations — scopes intersected with the owner's live permissions. |
| [signing-keys.md](signing-keys.md) | The other direction — RSA key pairs this workspace signs outbound JWTs with, auto-generated at boot, rotatable from the admin UI. |
| [webhooks.md](webhooks.md) | Outbound HMAC-signed delivery of audited actions, retried on the job queue. |
| [platform-hardening.md](platform-hardening.md) | Security headers, CSRF origin guard, rate limits, idempotency keys, health/ready/version and cross-instance cache invalidation. |
| [background-jobs.md](background-jobs.md) | The durable job queue, cron-scheduled work declared next to its handler, the worker, and the run-now admin screen. |
| [data-retention.md](data-retention.md) | Per-table retention days for soft-deleted rows, and the batched purge worker that finally hard-deletes them. |
| [local-development.md](local-development.md) | The root `.env` file, how the API and the migration scripts load it, and the local Postgres setup. |

Known bugs and sharp edges live in [known-problems/](known-problems/README.md) — one file per problem, each
with the cause and a proposed fix. Start there when something behaves oddly before assuming it is new.

Every file above documents something that ships.

Cross-cutting types are NOT duplicated here — they live in `api/src/contracts/` and are imported by both sides.
