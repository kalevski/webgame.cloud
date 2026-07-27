# @appkit/migrations

Postgres schema and data migrations for the app starter template, managed with [goose](https://github.com/pressly/goose) (`brew install goose`).

Two files, edited in place (the app is not in production — see CLAUDE.md):

- `sql/00001_schema.sql` — the generic platform tables plus the `projects`/`tasks` example.
- `sql/00002_seed.sql` — seed roles, permissions, limits and slot bindings (mirroring `SEED_ROLES` / `SEED_ROLE_BINDINGS` in `api/src/contracts/roles.ts`).

```bash
npm run up       # createdb (idempotent) + apply pending
npm run down     # roll back the latest migration
npm run status   # applied / pending
npm run create --name=add_thing   # scaffold a new migration (only once in production)
```

`goose.sh` builds the DSN from the same `DATABASE_*` env vars the API uses (`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASS`, `DATABASE_NAME` — default `starter`, `DATABASE_SSLMODE`).

Because goose tracks migrations by filename, an in-place edit to an already-applied file is NOT re-run. Rebuild the local database to pick it up, then `npm run up`.
