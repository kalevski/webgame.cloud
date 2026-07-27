---
name: api-patterns
description: Layering and file-shape conventions for api/ in this repo — contracts, routers, services, repositories, SQL files, DI wiring, error encoding, envelope, limits. Use this whenever adding or changing an API endpoint, service, repository, contract type, error code, or permission — even if the user only says "add an endpoint", "expose X", or "make the server do Y". The projects feature is the canonical example; this skill encodes its exact shape.
---

# API patterns

Strict 4-layer flow, one direction only:

```
routers/*Router.ts → services/*Service.ts → repositories/<group>/*Repository.ts → sql/*.sql
contracts/*.ts  = wire types (camelCase, shared with web)
schema/*.ts     = DB row types (snake_case, raw pg types)
domain/errors.ts = AppError hierarchy (status + code)
```

ESM throughout: every relative import ends in `.js` (even for `.ts` source). Runtime symbols import from the barrel `../contracts/index.js`, never a leaf file. `import type { ... }` as separate statements. Style: no semicolons, single quotes, 4-space indent, trailing commas, **no comments**.

## Contracts (`contracts/`)

Mostly `export type` aliases, but contract files also carry runtime consts and pure helpers (`PERMISSIONS`, `SEED_ROLES`, `RESOURCE_LABELS`, `encodeErrorCause`) — anything both sides need at runtime, still dependency-free. Full entity is camelCase with server-computed fields (`taskCount`, ISO-string `createdAt`); a separate `<Noun>Draft` is the writable subset — creation-mandatory fields stay required (`name`), the rest optional. Closed unions: inline union normally; `const` tuple + `typeof X[number]` when values are needed at runtime, spread into JSON Schema as `enum: [...REPORT_TARGET_KINDS]` (the projects router instead repeats its two small enums literally — both shapes exist). A feature doesn't always get its own file: moderation types (`Report`, `AuditEntry`) live in `contracts/notifications.ts`. New contract file → add `export * from './x.js'` to `contracts/index.ts`. New error code → add the literal to `API_ERROR_CODES` in `contracts/errors.ts` (and copy in `web/src/configs/strings.ts` `errors` — the `satisfies Record<ApiErrorCode | 'fallback', ...>` there fails typecheck if you forget). New permission → `PERMISSIONS` in `contracts/permissions.ts`, keyed `<area>.<resource>.<action>` with the read and the write as SEPARATE keys (`invoice.read` / `invoice.write`) — the first dot segment is the group the admin UI renders, so a new feature area gets its own prefix plus a `strings.accessAdmin.groups` label.

## Routers (`routers/<feature>Router.ts`)

Anatomy, in order within the file:

1. **Lazy service accessor** — the container is not ready at module load:
   ```ts
   const projects = () => container.resolve(ProjectService)
   ```
2. **Ownership predicates** — pure module-level `can<Verb><Noun>` functions, never a policy engine:
   ```ts
   const canEditProject = (user: User, project: Project): boolean =>
       user.role === OWNER_ROLE_ID || project.ownerId === user.id
   const canViewProject = (user: User, project: Project): boolean =>
       canEditProject(user, project) || project.visibility === 'shared'
   ```
3. **Inline JSON Schema** — `const <noun>Schema = { ... } as const`, `additionalProperties: false`, explicit `required`, bounds on every field. PATCH reuses it with `{ ...projectSchema, required: [] }`. List endpoints validate querystrings the same way (`schema: { querystring: ... }` with bounded `offset` — see `moderationRouter.ts`).
4. **`<verb><Noun>Endpoint` named async arrows**, typed `FastifyRequest<{ Params; Body; Querystring }>`. Mutating handlers wrap in `try/catch` → `return sendError(reply, error)`. Handlers return **bare** objects (the envelope hook wraps them); set status imperatively with `reply.code(201)`. Deletes: `reply.code(204); return null`.
5. **Read-then-authorize** for owned resources — capability check first (`request.can(...)` / `requirePermission`), then:
   ```ts
   const project = await projects().get(request.params.id)
   if (!project || !canViewProject(request.user!, project)) {
       reply.code(404)
       return { error: encodeErrorCause('project_not_found', request.params.id) }
   }
   if (!canEditProject(request.user!, project)) {
       reply.code(403)
       return { error: encodeErrorCause('forbidden') }
   }
   ```
6. **Exported plugin** registers routes ONLY:
   ```ts
   export const projectRouter: FastifyPluginAsync = async (app) => {
       app.addHook('preHandler', requireAuth)
       app.get('/api/projects', listProjectsEndpoint)
       app.post<{ Body: ProjectDraft }>(
           '/api/projects',
           { schema: { body: projectSchema }, preHandler: [requirePermission('project.write')] },
           createProjectEndpoint
       )
   }
   ```

URLs: `/api/<plural>` collection, `/api/<plural>/:id` item, nested child collection `/api/projects/:id/tasks`, child item addressed top-level (`/api/tasks/:id`).

Handlers surface errors through two channels: inline `reply.code(n)` + `return { error: encodeErrorCause(code, ...params) }`, or a thrown `AppError` from the service caught by `sendError` (which maps `error.status`/`error.code` and rethrows non-AppErrors to the global 500 handler). Three more exist at the framework level and need no per-route work: `requireAuth`/`requirePermission` reply 401/403 directly (`auth.ts`), the global `setErrorHandler` maps Fastify schema-validation failures to `invalid_body` and uncaught errors to `internal_error` (`http.ts`), and the CORS hook rejects cross-origin mutations with `cross_origin_rejected`. `encodeErrorCause` joins code + params with commas (`'limit_reached,projects,3'`) — never put display copy in a cause; the web renders copy from `strings.errors`.

## Request auth context + envelope

`registerAuth` decorates every request on its way in: `request.user` (null when no/invalid session — never rejects by itself), `request.can(permission)`, `request.permissionSet`. Handlers behind `requireAuth` can assume `request.user!`. `resolvePermissions` (`domain/access.ts`) is the ONLY place a role is read for auth: owner → whole catalog minus `ACCOUNT_SHAPED`, inactive account → empty set, otherwise role grants + per-user deltas.

Every JSON response is wrapped by the `preSerialization` hook in `http/envelope.ts` (`@toolcase/base` HTTP shapes): success `{ status: 'OK', data, count? }`, failure `{ status: 'rejected', cause }`. Passthrough (not wrapped): 204s, null bodies, non-JSON, already-enveloped objects. A `curl` shows the envelope — pipe through `jq '.data'`.

## Services (`services/<Noun>Service.ts`)

`@injectable()` class; **every** constructor param carries explicit `@inject(Token)` — esbuild/tsx don't implement `emitDecoratorMetadata`, so an un-`@inject`ed param fails at runtime, not build. Services hold all business logic: validation (`throw new ValidationError('name_required', ...)`), limit enforcement (`await this.access.assertWithinLimit(user, 'projects')` before the write), not-found (`if (!removed) throw new NotFoundError('project_not_found', ..., [id])`), and **row→contract mapping** via `to<Noun>(row)` mappers — usually module-level `const toReport = (row) => ({...})` arrows above the class (`ModerationService`, `NotificationService`); `ProjectService` uses private methods instead (snake_case Date rows → camelCase ISO strings; `Number(row.task_count)` for pg bigint strings). Services never touch Fastify. AppError subclasses fix the status: ValidationError 400, UnauthorizedError 401, ForbiddenError 403, NotFoundError 404, ConflictError 409, UnavailableError 503.

Side effects that must not fail the request (audit entries, notifications) are fire-and-forget: `void this.audit.record(...)` through the swallow-error helpers in `audit.ts`/`notify.ts`. Anything that writes roles, limits, or per-user overrides must invalidate the `AccessPolicyService` TTL caches (`invalidate()`/`invalidateUser()`) — every existing mutation does. Services with `init`/`dispose` lifecycles (`Database`, `Http`, `MaintenanceService` and its hourly sweeps) are started and stopped manually in `index.ts` boot order — the container never auto-runs them.

## Repositories (`repositories/<group>/<Noun>Repository.ts`)

Two shapes coexist. Entity repos (projects, tasks, reports, audit, notifications, push) extend `BaseRepository`:

```ts
import SELECT_PROJECT from './sql/select-project.sql'

@injectable()
export class ProjectRepository extends BaseRepository<ProjectRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'projects', 'id', repositoryOptions)
    }
    async findById(id: string, trx?: QueryRunner): Promise<ProjectRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<ProjectRow>(SELECT_PROJECT, [id])
            return rows[0]
        })
    }
}
```

The other half (access, users, sessions, account, settings) are plain `@injectable` classes — no `BaseRepository`, no `this.time`: they keep `constructor(@inject(Database) private database: Database)`, define their own `private run(trx?: QueryRunner)` returning `trx ?? this.database.pool`, and query directly. Match the group you're editing; new entity repos copy the `BaseRepository` shape.

- SQL lives in co-located `sql/<verb>-<noun>.sql` files (kebab-case, verb-first), imported as `UPPER_SNAKE` string constants.
- Every method: trailing `trx?: QueryRunner`, executes via `this.run(trx)`; `BaseRepository` methods additionally wrap the body in `this.time('name', ...)`.
- Insert: `RETURNING id`, generate `randomUUID()` in the repo, then re-`findById(id, trx)` for the full row. Update: `rowCount === 0 → undefined`, else `findById`. Delete: return `(result.rowCount ?? 0) > 0`.
- **Deletes are soft.** The `delete-*.sql` file is an `UPDATE … SET deleted_at = now(), updated_at = now() … WHERE … AND deleted_at IS NULL`, every read filters `deleted_at IS NULL`, and a delete with dependents soft-deletes them in the same CTE. `rowCount` still answers "did it exist", except for CTE statements that end in a `SELECT count(*)::int AS c` — read `rows[0].c` there. See the migration-patterns skill for the schema side.
- Row types in `schema/<group>.ts` as `<Noun>Row` — snake_case, `Date` objects, counts as `string`.
- **Expected conflicts are sentinel returns, not exceptions**: return `Result<Row, 'exists'>` (`ok`/`err` from `@toolcase/base`), catching pg error code `23505` for unique violations. Export the conflict literal type from the repo file and re-export it from `conflicts.ts`. The service translates: `if (result.isErr()) throw new ConflictError(...)`.
- Multi-step atomic mutations: `this.database.transaction(cb)`, opened **inside a repository method** (never a service — the repo needs the retained `database` reference for this); the callback runs raw SQL via `trx.query(...)` (see `UserRepository.create`, `AccessPolicyRepository`). **Inside the callback a `return` COMMITs — only a throw rolls back**; a conflict sentinel returned after a write commits that write.

## Wiring a new feature — checklist (mirror `projects`)

1. `contracts/widgets.ts` — `Widget`, `WidgetDraft`; barrel export in `contracts/index.ts`; new codes in `contracts/errors.ts`; new permissions in `contracts/permissions.ts` (grant via `SEED_ROLES` in `contracts/roles.ts` + seed SQL — see the migration-patterns skill).
2. `schema/widgets.ts` — `WidgetRow`.
3. `repositories/widgets/sql/*.sql` + `repositories/widgets/WidgetRepository.ts`.
4. `conflicts.ts` — only if a conflict literal was introduced.
5. `services/WidgetService.ts` — mapper, validation, `assertWithinLimit` if quota'd (also `LIMITABLE_RESOURCES` + `COUNT_SQL` — migration-patterns skill has the three-way lockstep).
6. `routers/widgetRouter.ts` — full anatomy above.
7. `container.ts` — `registerSingleton(WidgetRepository, WidgetRepository)` + service, grouped with blank lines by feature.
8. `http.ts` — add `widgetRouter` to `ROUTE_PLUGINS`.
9. DB table: `migrations/sql/00001_schema.sql` (migration-patterns skill) — then rebuild the DB.

Verify: `npm run typecheck`, then `curl localhost:5000/api/widgets` — remember every JSON response is enveloped, pipe through `jq '.data'`.
