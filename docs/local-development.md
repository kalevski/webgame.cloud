# Local development & environment files

How configuration reaches the API and the migration scripts when running locally.

## The `.env` file

A single `.env` at the repository root is the only environment file. `.env.example` is the committed template; `.env` is gitignored (`.gitignore` keeps `!.env.example`).

```bash
cp .env.example .env      # then edit the DATABASE_* values to match your Postgres
```

There is no `dotenv` dependency. Three loaders read the same file:

- **API** — `api/package.json` passes `--env-file-if-exists=../.env` to `tsx` in both `dev` and `start`. Node loads the file natively (Node 20.12+); if the file is missing, the flag is a no-op and the defaults in `api/src/env.ts` apply.
- **Realm stub** — `realm-stub/src/index.ts` reads the repo-root `.env` itself at boot (`loadEnvFile`, resolved relative to the module, not the cwd) instead of using the Node flag, so `npm run dev -w @webgame-cloud/realm-stub` also works on Node versions older than 22.9 where `--env-file-if-exists` is not a recognised option. A missing file is a no-op and the in-file defaults apply.
- **Migration/backup scripts** — `migrations/env.sh` is sourced by `goose.sh`, `backup.sh`, `restore-test.sh` and `corrupt-drill.sh`. It walks `../.env` and exports each `KEY=value` line. Set `ENV_FILE=/path/to/other.env` to point them elsewhere.

**Precedence: a variable already present in the shell wins.** Node's `--env-file` does not overwrite existing `process.env` entries, the realm stub's `loadEnvFile` skips keys already set, and `env.sh` only exports keys that are unset. So `DATABASE_NAME=scratch npm run migrate` overrides the file, and the `DEV_LOGIN=true` prefix in `dev:api` stays authoritative.

The web workspace reads no environment file — Vite proxies `/api` to `127.0.0.1:6000` (`web/vite.config.ts`), so the SPA is always same-origin locally.

## Variables

`.env.example` lists every variable the API reads; the authoritative list with defaults is `api/src/env.ts` and the table in [deployment.md](deployment.md). The database group is what has to be right before anything boots:

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_HOST` | `localhost` | |
| `DATABASE_PORT` | `5432` | A Docker Postgres published on another port (e.g. `-p 5434:5432`) needs the published port here. |
| `DATABASE_USER` | OS user | |
| `DATABASE_PASS` | none | |
| `DATABASE_NAME` | `starter` | `goose.sh up` runs `createdb` first, so it does not need to exist. |
| `WORKSPACE_NAME` | `WebGame Cloud` | Shown on public invoices and in `/api/public/constants`. |
| `DATABASE_SSLMODE` | `disable` | Read by the shell scripts only; `api/src/env.ts` does not set `ssl` on the pool. |

## Postgres in Docker

```bash
docker run -d --name app-template-pg -p 5434:5432 \
    -e POSTGRES_USER=starter -e POSTGRES_PASSWORD=starter -e POSTGRES_DB=starter \
    postgres:17-alpine
```

Then set `DATABASE_PORT=5434`, `DATABASE_USER=starter`, `DATABASE_PASS=starter` in `.env`.

## The dev realm

No realm is seeded (see [realms-and-migrations.md](realms-and-migrations.md)), so a fresh database hosts no build machine and project creation answers `503 realm_unavailable`. One-time setup after the first sign-in:

1. `/platform/realms` → *Add realm*, any name, base URL `http://127.0.0.1:5100`. A region is optional; add one on the **Regions** tab first if you want the realm to sit in one.
2. Copy the `rlm_…` token from the reveal step — it is shown once and stored only as a SHA-256 hash.
3. Put it in `.env` as `REALM_DEV_TOKEN=rlm_…` and restart `npm run dev:realm`.

*Rotate token* in the realm's danger zone kills the old value the moment the new one appears, so a rotate means repeating steps 2–3.

## Node version

`.nvmrc` pins 24; run `nvm use` before `npm run dev`. Node 18 fails on `--env-file-if-exists` and on `tsx`'s decorator handling with misleading errors.

**The realm stub needs Node 20+ too, and fails silently otherwise.** It has no decorators, so it boots on Node 18 — but its `fetch` (undici without `autoSelectFamily`, added in Node 20) resolves the `localhost` in `API_URL` to `::1` first, while the API binds `0.0.0.0` (IPv4 only). Every stub → API call then dies with `ECONNREFUSED`, and because `heartbeat()` ends in `.catch(() => undefined)` nothing is logged: the realm simply never reports in and the console shows it as *Not connected*. Run the stub under `nvm use`, or set `API_URL=http://127.0.0.1:<port>`.

## Checking it works

```bash
nvm use
npm run migrate                       # goose reports the applied version
npm run dev                           # api :6000 + web :6001
curl localhost:6000/api/health        # {"status":"OK","code":200,"data":{"status":"ok"}}
```

`api/src/index.ts` calls `database.init()` (a `SELECT 1`) before the server listens, so a booted API is proof the credentials resolved. A wrong `DATABASE_*` value fails at boot with a `pg` connection error rather than on the first request.

## Health checks (no test suite)

`tsc --noEmit` is the only build gate, but two profilers are used to keep the two workspaces honest. Neither is a dependency — both run through `npx`, on Node 24 (`nvm use` first).

```bash
npx react-doctor web                  # React/JS/a11y/supply-chain audit of the SPA (--json for a report)
npm run build -w @webgame-cloud/api          # clinic profiles the bundle, not tsx
npx clinic doctor --on-port "npx autocannon -c 20 -d 20 http://localhost:$PORT/api/health" -- node api/dist/index.js
```

`react-doctor` scores the `web` workspace and must stay at 0 diagnostics; `web/doctor.config.json` holds the suppressions, each of which covers a deliberate pattern rather than a bug:

- `js-hoist-intl` in `helpers/money.ts` — the memoised `Intl` cache the rule cannot see through.
- `exhaustive-deps` in `components/AdvancedTable.tsx` and `hooks/useStableValue.ts` — `useStableValue` keys a `useMemo` on the JSON signature of a prop **instead of** the prop itself, on purpose: adding the value to the deps would restore the identity churn the helper exists to absorb (see frontend-architecture.md).
- `no-adjust-state-on-prop-change` in `modules/FileList.tsx` and `modules/ProjectSettingsGeneral.tsx` — the ref-guarded seed-by-identity effects that push values into uncontrolled `tc-*` inputs, the canonical pattern from `docs/known-problems/filter-input-loses-focus.md`.
- `async-await-in-loop` in `state/assets.slice.ts` — uploads run one at a time deliberately (per-file progress, realm batch limits).
- `effect-needs-cleanup` and `deslop/unused-export` in `lib/tc.ts` — the listener effect does return a cleanup (the loop form defeats the analyzer), and the wrapper library exports the full `tc-*` surface as template API whether or not this app imports every piece.
- `deslop/unused-file` on the paywall components (`LimitMeter`, `LockChip`, `LockedAction`, `UpgradeNudge`) and `hooks/useTcEvent.ts`, plus `deslop/unused-export` on `configs/entitlements.ts`, `configs/legal.ts`, `helpers/validation.ts`, `hooks/useLock.ts` and the legal modules — platform-template surface documented in frontend-architecture.md that derived projects wire up even when this app has not yet.
- `no-giant-component` on the large feature modules and `prefer-useReducer` on the two big modals — the repo's one-file-per-feature-module convention; splitting them is a refactor to schedule deliberately, not a lint fix. Run `clinic doctor` with `PORT` set to something other than 5000 so it does not collide with a running dev API, and point the load at a DB-backed authed route (send a `cookie: starter_session=<id>` header) as well as `/api/health` — its verdict covers event-loop delay, CPU and heap growth.
