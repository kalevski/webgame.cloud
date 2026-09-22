# Operations — health, alarms and the control CLI

"Is it up" is not one boolean. A mail outage and a dead database are both "unhealthy", but only one of them
should take the site out of a load balancer. This slice splits that apart: six named components each report
their own state, only three of them block readiness, and four alarms turn the noisy ones into a sentence
somebody can act on.

- API: `api/src/contracts/health.ts`, `services/HealthService.ts`, `services/AlarmService.ts`,
  `routers/healthRouter.ts`, `routers/controlRouter.ts`, `domain/production.ts`, `domain/observability.ts`.
- CLI: `api/src/cli/` (`npm run cli -w @webgame-cloud/api`, or `dist/cli.js` in the image).

## Components

`HEALTH_COMPONENTS` names six, each resolving to `ok | degraded | down` plus a sentence of detail:

| Component | What it checks |
| --- | --- |
| `database` | the pool answers `SELECT 1` inside the slow budget (`DATABASE_SLOW_MS`) |
| `migrations` | the applied goose version is at least the highest migration shipped |
| `storage` | every source bound to an `ASSET_TYPES` entry answers a cheap probe |
| `signingKeys` | a readable key pair in `SIGNING_KEYS_DIR` |
| `jobQueue` | the age of the oldest due queued job |
| `mail` | the configured email provider port's own readiness |

`READINESS_BLOCKING` is only `database`, `migrations` and `storage`. A mail outage or a stalled queue shows
up in the report and fires an alarm, but never makes `/api/ready` answer 503 — a mail outage is not a site
outage.

## Endpoints

| Route | Guard | What it returns |
| --- | --- | --- |
| `GET /api/health` | public | liveness |
| `GET /api/ready` | public | `{ ready }` only, unless the caller holds `admin.overview.read` — an unauthenticated prober learns whether to route traffic here and nothing else |
| `GET /api/version` | public | build identity, cached 60s |
| `GET /api/ops/status` | `admin.overview.read` | the full report — every component, every alarm |

## Alarms

`ALARM_KEYS` defines four, with thresholds in `ALARM_THRESHOLDS` and a plain-English cause in
`ALARM_SENTENCES`:

- `queue_stalled` — a job has been due for over 15 minutes. Scheduled work, webhook delivery and mail all
  ride on the job worker, so this one is upstream of most other symptoms.
- `mail_backlog` — queued mail is not leaving, or a message exhausted its retries (30 minutes).
- `mail_down` — the provider port has failed readiness for 10 minutes.
- `database_degraded` — `SELECT 1` is slow or failing.

The `health_sweep` job (`jobs.ts`, every 5 minutes) evaluates them, logs each firing one through the
observability sink, and digests it to the owners at most once per hour per alarm
(`digestThrottleSeconds`) — a wedged queue mails once, not twelve times an hour.

## Production config guard

`assertProductionConfig()` (`domain/production.ts`) refuses to boot under `APP_ENV=production` with any of:
`DEV_LOGIN` on, no SSO provider configured, `WEBHOOK_ALLOW_PRIVATE` on, an unencrypted database connection
(`DATABASE_SSLMODE=disable`), or a missing `WEB_URL`/`API_URL`. Each is a misconfiguration that is invisible
until it is exploited, so it fails at boot instead.

## The control API and CLI

Each service serves a **second Fastify instance bound to 127.0.0.1 only** — the API's is on `CONTROL_PORT`
(default `6010`). It carries no session auth because it is not reachable off-box; reaching it means you are
already inside the container.

`CONTROL_PLUGINS` in `http.ts` registers `controlRouter`:

| Route | What it does |
| --- | --- |
| `GET /control/status` | the same report as `/api/ops/status` |
| `GET /control/jobs` | the registered schedules and their next run |
| `POST /control/jobs/run` | run one job now |
| `POST /control/seed-demo` | write the demo dataset |

`api/src/cli/` is a thin client for it, built to `dist/cli.js` beside `dist/index.js`. Locally:
`npm run cli -w @webgame-cloud/api -- status`. In a container: `docker exec <container> node /app/dist/cli.js
status`.

See [demo-data.md](demo-data.md) for what `seed-demo` writes, and [background-jobs.md](background-jobs.md)
for the queue the `jobs` commands drive.
