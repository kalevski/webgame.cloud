# Background jobs & scheduling

One durable queue (`jobs` table) plus a worker that claims batches with `FOR UPDATE SKIP LOCKED`. Work
arrives two ways: **event-driven** (something enqueues a job — a webhook delivery) or **scheduled** (a cron
expression declared next to the handler). Both end up as rows in the same table and run through the same
worker.

- API: `api/src/domain/jobs.ts` (the registry + cron helpers), `api/src/jobs.ts` (handler registration and
  the schedule sweep), `api/src/services/JobWorker.ts` (claims and runs), `api/src/services/JobService.ts`,
  `api/src/services/MaintenanceService.ts` (the scheduler tick), `repositories/jobs/`.
- Web: *Admin → Scheduled jobs* (`web/src/modules/JobsAdmin.tsx`).

## Registering a job

A handler and its schedule are declared in one place, in `registerJobHandlers()` (`api/src/jobs.ts`):

```ts
registerJobHandler(
    JOB_SESSION_PURGE,
    async () => { await container.resolve(SessionRepository).deleteExpired() },
    { cron: '0 * * * *', description: 'Delete expired sessions.' }
)
```

`cron` is optional. Omit it and the job is event-driven: it has a handler and can be triggered, but the
scheduler never enqueues it (`JOB_WEBHOOK_DELIVERY` is the shipped example — it is queued by the audit
trail). The expression is validated at registration time via `cron-parser`, so a typo fails fast at boot
rather than silently never running. Standard five-field cron; the parser is the only place cron semantics
live, so day-of-week/day-of-month and DST behave the way crontab does.

**There is no schedules table and no UI for editing them.** Schedules are code, next to the behaviour they
run — the admin screen is a read-only view. A derived project that wants runtime-editable schedules adds a
table and reads the cron from it; nothing else in the design changes.

## How the sweep works

`MaintenanceService` ticks every 60 seconds (cron needs minute resolution) and calls `enqueueDueSchedules()`.
For each scheduled registration it asks the parser for the **most recent occurrence at or before now**
(`previousRun`) and enqueues a job whose `uniqueKey` is `<kind>:<occurrenceISO>`.

Keying on the occurrence rather than on "now" is what makes the sweep idempotent: every tick between 14:00
and 15:00 computes the same `session_purge:2026-07-26T14:00:00.000Z`, so only the first one inserts. Two
guards back this up — an in-process `lastEnqueued` map that skips the insert entirely, and the partial
unique index `jobs_unique_key_idx` in the database.

Two consequences worth knowing:

- **The index only covers `queued` and `running` rows.** Once a job finishes, its key is free again, so the
  in-memory map is what prevents a re-enqueue later in the same window. After a process restart that map is
  empty, so the current occurrence can be enqueued a second time. Every shipped scheduled job is idempotent,
  which is why this is acceptable — keep new scheduled jobs idempotent too, or add a persistent check.
- **A missed window is not backfilled.** If the process is down from 14:00 to 16:00, the sweep at 16:01 sees
  only the 16:00 occurrence. Cron semantics, not a queue replay.

Boot order matters: `registerJobHandlers()` must run **before** `maintenance.init()`, because the first
sweep happens immediately on init and reads the registry.

## Running the worker

`JobWorker` ticks every 5s, resets stuck rows, claims up to 10 due jobs and runs each handler. Success marks
`done`; a throw marks `failed`, records the error and re-schedules with a 30s backoff until `max_attempts`
(default 5). A kind with no registered handler fails the job rather than crashing the worker.

## Admin surface

*Admin → Scheduled jobs* (`job.read`; actions need `job.write`):

- **Schedules** — one row per scheduled registration: kind, its cron expression, description, the next run
  the parser computes, and the status of the most recent run. Read-only.
- **Run now** (per row) and **Run all now** (header) enqueue an immediate job with a
  `manual:<kind>:<uuid>` unique key. The random key is deliberate: it never collides with the occurrence
  key, so a manual run is always accepted even if the scheduled one for this window has already gone
  through. Both are audited as `run_jobs`.
- **Recent runs** — the last ten jobs the worker touched, newest first, plus queued/failed counts. Manual
  runs appear here alongside scheduled ones.

`POST /api/jobs/schedules/run` with `{"kinds": []}` (or no body) triggers every scheduled job; passing
`kinds` triggers exactly those. Any registered kind is accepted, including event-driven ones, which makes
the endpoint useful for smoke-testing a handler. An unregistered kind is rejected with
`job_kind_unknown` (400) rather than queueing a job that could never run.


## Jobs this workspace adds

| Kind | Cron | What it does |
| --- | --- | --- |
| `assets.reap_orphans` | `*/5 * * * *` | Soft-deletes `pending_upload` assets older than 20 minutes. |
| `builds.reap_stale` | `*/5 * * * *` | Fails builds a realm claimed and never reported on (`build_timeout_minutes`, default 30). |
| `realms.reap_stale_migrations` | `*/5 * * * *` | Fails migrations stuck in a non-terminal state, releasing the project lock. |
| `realms.prune_samples` | `30 2 * * *` | Soft-deletes realm heartbeat samples older than `REALM_SAMPLE_RETENTION_DAYS` (7 days). |
| `realm.migrate` | — | Drives one project migration between realms. Queued by a staff move, re-enqueued at boot. |
| `realm.purge` | — | Deletes files on a realm after the rows they belong to were deleted. |

Build work is deliberately **not** a `jobs` row: the realm long-polls and claims from the `builds` table
directly, because the claim, the status and the result all belong to the build row the user is watching.
