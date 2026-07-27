# Database conventions

Two rules apply to **every** table in `migrations/sql/00001_schema.sql`, entity tables and join/log
tables alike. They are not per-feature decisions — a new table that skips them is a bug.

## 1. Every table carries three timestamps

```sql
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now(),
deleted_at timestamptz
```

`created_at` and `updated_at` are never null; `deleted_at IS NULL` is what "this row exists" means.
Every `UPDATE` in the repository layer sets `updated_at = now()` alongside whatever it changes, so
"when did this last move" is answerable for any row in the database without an audit join.

## 2. Nothing is hard-deleted

There is no `DELETE` statement anywhere in `api/src/repositories/*/sql/`. A delete is:

```sql
UPDATE projects SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
```

and every read filters the flag — in the `WHERE`, in joins, and in subquery counts:

```sql
SELECT p.*, (SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL) AS task_count
FROM projects p
WHERE p.id = $1 AND p.deleted_at IS NULL
```

Routers and services are unchanged by this: `DELETE /api/projects/:id` still answers `204`, the row
is simply still on disk. Nothing in the API exposes soft-deleted rows, and no "restore" endpoint
exists yet — recovery today is a `psql` update.

### Cascades are manual now

`ON DELETE CASCADE` clauses are still in the schema, but they never fire, because no row is ever
deleted. A delete with dependents must soft-delete them itself, atomically, in one data-modifying
CTE. Two worked examples:

- `projects/sql/delete-project.sql` — the project and its tasks.
- `account/sql/delete-user.sql` — the account plus its sessions, identities, permission and limit
  overrides, push subscriptions, notifications, reports, projects, tasks, subscription, invoices and
  sales enquiries. It ends in `SELECT count(*)::int AS c FROM deleted_user` because a CTE statement
  has no meaningful `rowCount`; `AccountRepository.deleteUser` reads `rows[0].c`.

The audit log keeps its `actor_id` pointing at the soft-deleted account, so history survives a
deletion instead of decaying to `NULL`.

### Indexes are partial

Every index — plain and unique — carries `WHERE deleted_at IS NULL`, so it stays small and, more
importantly, so a soft-deleted row never blocks re-creating the same key. Concretely:

- `users_email_lower_idx` — a deleted account frees its email for re-registration.
- `sessions_public_id_idx`, `invoices_number_idx`, `invoices_public_token_idx`.
- Conditions compose: `reports_open_unique_idx ... WHERE status = 'pending' AND deleted_at IS NULL`,
  `sales_enquiries_open_unique_idx ... WHERE status IN ('new','contacted') AND deleted_at IS NULL`.

The exception is a primary key, or a column an FK points at (`roles.id`, `email_templates.key`,
`users.id`): those stay globally unique. Ids are never recycled — which is exactly why the next rule
exists.

### Rows with a natural key are revived, not re-inserted

A table keyed by a slug, a natural pair or an upsert target would raise a unique violation when the
"same" row is created after a soft delete. Those inserts end with a revive clause:

```sql
INSERT INTO role_permissions (role_id, permission) VALUES ($1, $2)
ON CONFLICT (role_id, permission) DO UPDATE SET deleted_at = NULL, updated_at = now()
```

Same shape in `insert-role.sql`, `insert-user-permission.sql`, `insert-role-limit.sql`,
`insert-user-limit.sql`, `insert-identity.sql`, `insert-template.sql`, `upsert-setting.sql`,
`upsert-push-subscription.sql` and `upsert-subscription.sql`. Where the intent is *only if absent*
(`insert-setting-if-absent.sql`), the update is guarded so it revives without overwriting a live
value:

```sql
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, deleted_at = NULL, updated_at = now()
WHERE settings.deleted_at IS NOT NULL
```

Two Postgres details that bite: `ON CONFLICT` against a **partial** unique index must repeat the
predicate (`ON CONFLICT (action, template_key) WHERE deleted_at IS NULL DO UPDATE …`), and a
`DO UPDATE … WHERE` clause qualifies the existing row by table name (`settings.deleted_at`), not by
`EXCLUDED`.

## What this costs

- Tables grow until an admin opts them into retention. Every table is listed in *Admin → Data retention*
  with a per-table "keep soft-deleted rows for N days", enforced by a batched background worker — but the
  default for everything except the noisy operational tables is `0` (keep forever). See
  [data-retention.md](data-retention.md). There is still no restore/trash path for a soft-deleted row.
- A unique key held by a soft-deleted row is only free where the index is partial — deliberately not
  the case for ids and FK targets.
- Any new query must remember the filter. The rule is mechanical precisely so it can be reviewed at
  a glance: if a `.sql` file mentions a table and not `deleted_at`, look twice.

## Adding a table

1. Include the three timestamp columns.
2. Make every index partial on `deleted_at IS NULL`.
3. Write reads with the filter, deletes as updates, and inserts with a revive clause if the key is
   natural.
4. If other rows depend on it, extend the parent's delete CTE.
5. `dropdb starter && npm run migrate` — goose tracks migrations by filename, so an in-place edit is
   otherwise silently skipped.

The `migration-patterns` skill holds the full checklist; `api-patterns` covers the repository side.
