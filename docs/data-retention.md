# Data retention & the purge worker

Nothing in this codebase issues a `DELETE` — a delete stamps `deleted_at` and every read filters it out
(database-conventions.md). That leaves one question this slice answers: when do those rows actually leave
the disk? Per table, the admin sets a number of days; a background worker hard-deletes soft-deleted rows
older than that, in small batches, on a configurable interval.

- API: `api/src/services/RetentionService.ts` (policy, settings, one purge pass),
  `api/src/services/PurgeWorker.ts` (the loop), `api/src/repositories/retention/RetentionRepository.ts`
  (+ its three `.sql` files), `api/src/contracts/retention.ts`, routes in `api/src/routers/platformRouter.ts`.
- Web: *Admin → Data retention* (`web/src/modules/RetentionAdmin.tsx`), state in
  `web/src/state/platform.slice.ts`, calls in `web/src/services/PlatformService.ts`.

## Tables are discovered, not listed

`RetentionRepository.listTables()` asks Postgres for every ordinary table in the `public` schema that has a
`deleted_at` column. Because the schema rule is that *every* table carries `deleted_at`, that query is
effectively "every table in the app" — and a table added in a later migration shows up in the admin screen
with no code change. There is no hand-maintained table list to keep in sync.

The table name cannot be a bind parameter, so `count-table.sql` and `purge-table.sql` carry a `{{table}}`
token that the repository substitutes. Substitution happens **only** after the name passes a strict
identifier regex *and* is confirmed present in the set returned by `listTables()`, so nothing that did not
come out of `pg_class` can ever reach the SQL string.

## The policy

Days per table live in `settings` rows keyed `retention_<table>`; `0` means keep forever. A table with no
row falls back to `DEFAULT_RETENTION_DAYS` in `contracts/retention.ts`, which covers only the noisy
operational tables (`notifications`, `email_messages`, `jobs`, `webhook_deliveries`, `sessions` at 30–90
days; `audit_log` deliberately at `0`). **Everything else defaults to `0`.** That default is the safety
property of the whole feature: turning it on cannot start deleting user-owned data — an admin has to opt
each table in.

`GET /api/retention` returns a `RetentionReport`: every discovered table with its days, total row count,
soft-deleted count and how many rows are due for purge right now, plus the worker settings and the last
run. The counts are `count(*)` per table (one query each), which is fine at template scale but is the first
thing to make cheaper if a derived project grows a very large table.

## The worker

`PurgeWorker` runs in the API process alongside `JobWorker`/`EmailWorker`, registers a heartbeat so
`/api/ready` reports on it, and `unref()`s its timer so it never holds the process open. Each tick calls
`RetentionService.purgeOnce()`, which is deliberately bounded so it can never become the bottleneck:

- **`batchSize`** caps rows deleted from one table in one pass. The statement is
  `DELETE … WHERE ctid IN (SELECT ctid … LIMIT $2)` — `ctid` is used rather than a primary key because join
  tables have composite keys and some tables key on a natural column.
- **`tablesPerTick`** caps how many tables one pass touches. Tables are walked round-robin from a cursor
  that persists across ticks, so load spreads out instead of hammering one table. A table whose retention
  is `0` is skipped **without consuming the budget** — otherwise a workspace with 37 mostly-disabled tables
  would spend most ticks doing nothing.
- **`intervalSeconds`** is how often the worker wakes. It is read from settings at boot and re-checked at
  the end of every tick, so changing it in the admin screen reschedules the timer on the next run rather
  than needing a restart.

All three live in `settings` (`purge_interval_seconds`, `purge_batch_size`, `purge_tables_per_tick`) and are
clamped to the bounds in `contracts/retention.ts` on both write and read. A per-table failure — an FK
`ON DELETE RESTRICT` still pointing at a row, say — is caught, logged and skipped, so one bad table cannot
stall the rest of the sweep.

Because deletes are hard here, `ON DELETE CASCADE` clauses **do** fire during a purge, unlike during the
app's own soft deletes. A parent purged this pass takes its children with it.

## Admin surface

*Admin → Data retention* (`admin.settings.read` to view, `admin.settings.write` to change) is two cards:
the worker settings plus a *Run once now* button and the last-run summary, and a searchable table of every
discovered table with its counts and a days input. Saving audits `update_retention` /
`update_purge_settings` / `run_purge`.

One implementation note, and it applies to both the day inputs and the search box: **nothing on a typing
path may call `setState`**. The days inputs live inside a `tc-advanced-table`, whose rows are a trusted
HTML string — re-assigning `rows` rebuilds the `<tbody>` and destroys the input being typed in. The search
box has the same problem one level worse: feeding its value back through React state rebuilds the input
from a stale value and reorders characters. So the day edits go into a `ref` and are read back on save, and
the search query lives in a `ref` with the filtered `rows`/`total`/`filterValues` assigned directly on the
element inside `onFilterChange`. Full explanation:
[known-problems/filter-input-loses-focus.md](known-problems/filter-input-loses-focus.md).

## Relationship to the job queue

Purging used to be a `retention_purge` job enqueued hourly (`jobs.ts`). That handler is gone — a dedicated
worker replaced it so the cadence and batch size are tunable independently of the generic job queue. The
job queue still owns session purging, subscription expiry and webhook delivery.
