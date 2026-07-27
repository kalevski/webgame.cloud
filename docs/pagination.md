# Pagination

Two modes, both live on the same endpoints. Offset is what the admin tables use, because they want page
numbers. Cursor (keyset) is what anything walking an unbounded table should use, because offset drifts and
gets slower the deeper you go.

- Shared helper: `api/src/repositories/pagination.ts` (`encodeCursor`, `decodeCursor`, `takePage`).
- Supported on: `GET /api/moderation/audit-log`, `GET /api/email/messages`, `GET /api/jobs`,
  `GET /api/webhooks/deliveries` — the four tables that grow without bound.
- Worked example in the UI: *Admin → Scheduled jobs → Recent runs* ("Load more").

## Why offset is not enough

Offset counts rows from the start of the result set, so anything inserted while a user is paging shifts
every later page. On an append-heavy table — an audit log, an outbox — that is not an edge case, it is the
normal case. Measured on this codebase with 5 rows inserted between two reads:

```
OFFSET  page1: tie-030,tie-029,tie-028,tie-027,tie-026
OFFSET  page2: tie-030,tie-029,tie-028,tie-027,tie-026   ← all 5 repeated
CURSOR  page1: intruder-5,…,intruder-1
CURSOR  page2: tie-030,…,tie-026                          ← no repeats
```

The second cost is speed: `OFFSET 100000` makes Postgres walk and discard 100 000 rows. A keyset predicate
seeks straight to the position in the index.

## How the cursor works

A cursor is `base64url("<createdAt ISO>|<id>")` — opaque to the client, but deliberately not encrypted;
it carries no privileges and only names a position in a sort. Pass it back as `?cursor=…` and the endpoint
returns the next slice plus a fresh `nextCursor`, which is `null` on the last page.

The SQL uses a row-value comparison, which Postgres can push straight into the index:

```sql
AND ($8::timestamptz IS NULL OR (created_at, id) < ($8, $9::text))
ORDER BY created_at DESC, id DESC
```

Three things make that correct, and all three matter:

1. **The sort must be a total order.** `ORDER BY created_at DESC` alone is not: rows sharing a timestamp
   can come back in any order, so a page boundary can repeat or skip them. Every one of the four queries now
   sorts by `(created_at DESC, id DESC)` — the same pair the cursor carries. Three of them previously sorted
   on `created_at` alone, which was a latent paging bug independent of this feature.
2. **The comparison is a row value, not two ANDed columns.** `(created_at, id) < ($ts, $id)` is one
   lexicographic comparison; hand-writing it as `created_at < $ts OR (created_at = $ts AND id < $id)` is
   easy to get subtly wrong and harder for the planner.
3. **There is an index in the same shape.** `audit_log_created_idx`, `email_messages_created_idx`,
   `jobs_created_idx` and `webhook_deliveries_created_idx` are all `(created_at DESC, id DESC)` partial on
   `deleted_at IS NULL`. `EXPLAIN` shows `Index Only Scan … Index Cond: (ROW(created_at, id) < ROW(…))`.

Services fetch `limit + 1` rows and hand them to `takePage`, which trims the extra row and turns it into
the `nextCursor`. That is how "is there another page?" is answered without a second count query.

## Choosing a mode

| Use | When |
| --- | --- |
| `offset` (+ `total`) | Admin tables where the user expects page numbers and a total: the audit log table, outbox, deliveries, users. Fine because a human is looking at page 3, not walking 50 000 rows. |
| `cursor` | Anything that walks a whole table: exports, API clients, infinite scroll / "Load more", background sync. Also correct under concurrent writes. |

Passing `cursor` wins: the endpoint ignores `offset` for that request. Omit it and behaviour is exactly what
it was before, which is why the existing admin screens needed no changes.

`total` is still returned in cursor mode (it is a separate count query) — handy for "16 of 400", but note it
is a snapshot and can move between pages. If a derived project doesn't need it, dropping the count is the
cheapest win available on these endpoints.
