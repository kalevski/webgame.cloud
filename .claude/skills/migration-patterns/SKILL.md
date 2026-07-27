---
name: migration-patterns
description: Schema and seed conventions for migrations/ in this repo — goose two-file edit-in-place model, table/column/index naming, owner_id FK shape, seed↔contract lockstep (SEED_ROLES, PERMISSIONS, LIMITABLE_RESOURCES↔COUNT_SQL), and the mandatory DB rebuild workflow. Use this whenever a change touches migrations/sql/, adds or alters a table, adds a permission, quota/limit, role, or seeded setting — even if the user only says "add a field" or "store X in the database".
---

# Migration patterns

Two goose SQL files, edited **in place** — `migrations/sql/00001_schema.sql` (all tables) and `migrations/sql/00002_seed.sql` (roles, permissions, limits, slot bindings). The app is not in production, every environment rebuilds from scratch, so the schema stays one readable file. Never add a new numbered migration here; that rule flips only once a derived project ships to production (`npm run create --name=...` exists for that day).

## The rebuild rule (why your edit "didn't work")

Goose tracks migrations by **filename** in `goose_db_version`. An in-place edit to an already-applied file is silently NOT re-run. After any edit:

```bash
dropdb starter        # DATABASE_NAME, default "starter"
npm run migrate       # from repo root: createdb (idempotent) + goose up
npm run status -w @appkit/migrations   # confirm both applied
```

Skipping the drop is the #1 way schema edits appear to have no effect.

## Schema conventions (00001_schema.sql)

Single `-- +goose Up` block, single `-- +goose Down` block, no StatementBegin/End (no `$$` bodies). Down drops tables in **reverse dependency order** — children first. Every new table needs its `DROP TABLE` added to the Down block *above* any parent it references.

- **Naming**: snake_case, plural entity tables (`projects`, `tasks`); join/aux tables `<owner>_<thing>` (`role_permissions`, `user_limit_overrides`). Plain indexes are `<table>_<cols>_idx`; partial/conditional indexes get a semantic name derived from their predicate instead (`reports_open_unique_idx`, `projects_shared_idx`).
- **FK column names are not uniform** — the FK to `roles` is `role_id` in `role_permissions` but `role` in `role_limits` and `users`. Check the real column list before writing seed INSERTs.
- **Primary keys**: `id text PRIMARY KEY` — application-generated string IDs. No uuid, no serial. Join tables use composite PKs (`PRIMARY KEY (role_id, permission)`), natural keys where they exist (`settings (key text PRIMARY KEY)`, `push_subscriptions (endpoint ...)`).
- **Every table carries the same three columns — no exceptions, including join and log tables:**
  ```sql
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
  ```
  `deleted_at IS NULL` means live. Nothing is ever hard-deleted; see *Soft delete* below.
- **Other timestamps**: `timestamptz`. Nullable event times omit the default (`read_at`, `resolved_at`, `sent_at`).
- **Optional text** is `NOT NULL DEFAULT ''`, not nullable. One deliberate exception: nullable-UNIQUE external-identity columns (`users.google_sub text UNIQUE`) — a UNIQUE column can't default to `''` for more than one row. Booleans `NOT NULL DEFAULT true/false`.
- **Enums** are inline CHECKs: `status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'shipped'))`. Numeric bounds too: `CHECK (priority BETWEEN 1 AND 5)`.
- **Owned resources** carry exactly `owner_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE` plus `CREATE INDEX <table>_owner_idx ON <table> (owner_id);`. This column name is load-bearing — quota count queries filter `WHERE owner_id = $1`.
- **ON DELETE is a decision, not a default**: CASCADE for owned/dependent rows; `RESTRICT` + `ON UPDATE CASCADE` for `users.role` (can't delete a role in use; renames propagate); `SET NULL` for soft actor refs on logs/moderation (`audit_log.actor_id`, `reports.resolved_by`).
- **Every index is partial on `WHERE deleted_at IS NULL`** — plain indexes so they stay small, unique
  indexes so a soft-deleted row never blocks re-creating the same key
  (`users_email_lower_idx`, `email_triggers_action_template_idx`). Conditions compose:
  `WHERE status = 'pending' AND deleted_at IS NULL`. The exception is a PK or a column an FK points
  at (`roles.id`, `email_templates.key`) — those stay globally unique because ids are never recycled.
- Index variants in use: functional unique (`ON users (lower(email))`); UNIQUE + partial to enforce "one open X per target" (`reports_open_unique_idx ... WHERE status = 'pending'`); composite ordered (`ON tasks (project_id, position)`); recency indexes order `created_at DESC` / `updated_at DESC` (`notifications_user_idx (user_id, created_at DESC)`).

Canonical owned-resource shape (minimal copyable subset — the real `projects` table adds more columns like `description`, `priority`, `due_date`, plus a second partial index `projects_shared_idx`; read the actual DDL before extending it):

```sql
CREATE TABLE projects (
    id         text PRIMARY KEY,
    owner_id   text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       text NOT NULL,
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_idx ON projects (owner_id);
```

**Formatting**: UPPERCASE SQL keywords, lowercase type names (`text`, `timestamptz`) and functions (`now()`, `lower()`), 4-space indent, column names padded so types align per-table, indexes immediately after their table, blank line between entity groups, single-quoted strings.

## Soft delete (the delete rule)

**No statement in this repository issues `DELETE`.** A delete is:

```sql
UPDATE <table> SET deleted_at = now(), updated_at = now()
WHERE id = $1 AND deleted_at IS NULL
```

and every read adds `deleted_at IS NULL` — including inside joins
(`JOIN users u ON u.id = e.user_id AND u.deleted_at IS NULL`) and inside subquery counts. Every
`UPDATE` that changes a row also sets `updated_at = now()`.

Three consequences worth internalising:

1. **FK `ON DELETE CASCADE` no longer fires**, because nothing is deleted. A delete that used to
   cascade must soft-delete its children in the same statement — a data-modifying CTE keeps it
   atomic. `projects/sql/delete-project.sql` (project + its tasks) and
   `account/sql/delete-user.sql` (the account plus its sessions, identities, overrides, push
   subscriptions, notifications, reports, projects, tasks, subscription, invoices and enquiries) are
   the two worked examples. The FK clauses stay in the schema as a backstop.
2. **Rows with a natural key are revived, not re-inserted.** Inserting into a table whose PK is a
   slug, a natural pair or an upsert target ends with
   `ON CONFLICT (...) DO UPDATE SET ..., deleted_at = NULL, updated_at = now()` so a soft-deleted
   row comes back to life instead of raising a unique violation. See `insert-role.sql`,
   `insert-role-permission.sql`, `insert-template.sql`, `upsert-setting.sql`. Where the intent is
   "only if absent", guard the update: `... WHERE settings.deleted_at IS NOT NULL`.
3. **`ON CONFLICT` against a partial unique index must repeat the predicate** —
   `ON CONFLICT (action, template_key) WHERE deleted_at IS NULL DO UPDATE ...` — or Postgres cannot
   infer the index.

A statement that returns a count instead of touching rows (the CTE deletes above) breaks
`rowCount`-based repository verbs: return `count(*)::int AS c` and read `rows[0].c` instead.

## Seed conventions (00002_seed.sql)

One `INSERT` per row (no multi-row VALUES), grouped by table. Only list columns being set — rely on defaults otherwise. `NULL` max_count = unlimited.

```sql
INSERT INTO roles (id, name, position) VALUES ('member', 'Member', 10);
INSERT INTO role_permissions (role_id, permission) VALUES ('member', 'project.write');
INSERT INTO role_limits (role, resource, max_count) VALUES ('member', 'projects', 3);
INSERT INTO settings (key, value) VALUES ('role_slot_default', 'member');
```

`owner` role is seeded `builtin=true` and is NOT in `SEED_ROLES` — it exists only as `OWNER_ROLE_ID` in the contract. Slot bindings are `settings` rows keyed `role_slot_<slot>` for each key of `ROLE_SLOTS`; other seeded settings are plain keys (`signups_open`). Per-user overrides (`user_permissions` with its `granted boolean`, `user_limit_overrides`) are schema-only — never seeded. The seed Down block is `DELETE FROM` per table (including `users`), reverse order, mirroring the Up groups.

## Lockstep couplings — the part that silently breaks

The seed SQL is an untyped, hand-maintained mirror of typed contracts. The TypeScript side catches its own inconsistencies at compile time; the SQL side is caught by nothing but you. Whenever one side changes, change the other in the same edit:

1. **Roles**: each seed `roles` row must match one `SEED_ROLES` entry in `api/src/contracts/roles.ts` on `id`, `name`, `position`, AND full permission set (its `role_permissions` rows). Slot settings rows mirror `SEED_ROLE_BINDINGS`.
2. **Permissions**: every `role_permissions.permission` literal must be a member of `PERMISSIONS` in `api/src/contracts/permissions.ts`. A typo in the contract array is a compile error; a typo in the seed SQL is a silent dead grant.
3. **Quotas — three-way**: `LIMITABLE_RESOURCES` (`api/src/contracts/limits.ts`, plus a `RESOURCE_LABELS` entry) ↔ `COUNT_SQL` map in `api/src/repositories/access/AccessPolicyRepository.ts` (typed `Record<LimitableResource, string>`, so the compiler forces one `count-<resource>.sql` per resource) ↔ `role_limits` seed rows (the actual ceilings — untyped, forget them and the resource is unlimited for everyone). The live seed demonstrates the trap: `tasks` is in `LIMITABLE_RESOURCES` with counting wired, but has zero `role_limits` rows — silently unlimited for every role.

## Checklist: new owned resource (e.g. `widgets`, quota'd + permissioned)

1. `00001_schema.sql` Up: `CREATE TABLE widgets (...owner_id FK..., created_at, updated_at, deleted_at)` + `widgets_owner_idx ... WHERE deleted_at IS NULL`. Down: `DROP TABLE widgets;` in reverse-dependency position.
2. `api/src/contracts/permissions.ts`: add `'widget.write'` to `PERMISSIONS`.
3. `api/src/contracts/limits.ts`: add `'widgets'` to `LIMITABLE_RESOURCES` + `RESOURCE_LABELS` entry.
4. `api/src/repositories/access/sql/count-widgets.sql`: `SELECT count(*) AS c FROM widgets WHERE owner_id = $1`; add `widgets: COUNT_WIDGETS` to `COUNT_SQL`.
5. `api/src/contracts/roles.ts`: add `'widget.write'` to appropriate `SEED_ROLES[].permissions`.
6. `00002_seed.sql`: matching `role_permissions` rows + `role_limits` rows (mirror step 5 exactly).
7. `dropdb starter && npm run migrate`.
8. `npm run typecheck` — steps 2–5 inconsistencies fail here; step 6 inconsistencies don't, so re-read the seed diff against `roles.ts`.

## Other files in migrations/

`goose.sh` builds the DSN from `DATABASE_*` env vars and runs `createdb` before `up` (never drops). `backup.sh` / `restore-test.sh` / `corrupt-drill.sh` are pg_dump backup + restore-drill scripts (`npm run backup|restore-test|corrupt-drill -w @appkit/migrations`); note they still reference cookbook-era table names (`recipes`, `diets`, `ingredients`, dump files named `cookbook-*`) and need updating in a derived project. `source/` holds raw reference data not consumed by goose.
