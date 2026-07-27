# Projects & Tasks — the worked example

The one domain feature the template ships. It exists to be **copied**: it touches every layer and demonstrates ownership, capability gating, quota gating, a parent/child relation, and a paid capability. Delete it and follow the same shape for your own feature.

## Full stack, layer by layer

| Layer | File(s) |
| --- | --- |
| Contract | `api/src/contracts/projects.ts` (`Project`, `Task`, drafts) |
| Row types | `api/src/schema/projects.ts` |
| SQL | `api/src/repositories/projects/sql/*.sql` |
| Repositories | `ProjectRepository.ts`, `TaskRepository.ts` (one per table) |
| Service | `api/src/services/ProjectService.ts` (DTO mapping, quota enforcement, parent/child glue) |
| Router | `api/src/routers/projectRouter.ts` (REST + ownership predicate) |
| DI | registered in `api/src/container.ts` |
| Web service | `web/src/services/ProjectService.ts` |
| Web slice | `web/src/state/projects.slice.ts` |
| Web modules | `web/src/modules/{ProjectList,ProjectDetail}.tsx`, `web/src/modals/CreateProjectModal.tsx` |
| Web pages | `web/src/pages/{ProjectsPage,ProjectDetailPage}.tsx` |

## What each pattern looks like

- **Ownership**: `canEditProject(user, project)` in `projectRouter.ts` — `user.role === OWNER_ROLE_ID || project.ownerId === user.id`. Capability check first (`requirePermission('project.write')`), ownership check second. `canViewProject` also allows `visibility === 'shared'`.
- **Parent/child**: a project has many tasks; `tasks.owner_id` is copied from the parent so ownership/quota checks never join back. Deleting a project soft-deletes its tasks in the same statement (`delete-project.sql`) — the `ON DELETE CASCADE` clause stays as a backstop but never fires, because nothing is hard-deleted. See database-conventions.md.
- **Capability gating**: `project.write` / `task.write` guard the mutating routes; the UI hides the buttons with `useCan(...)`.
- **Quota gating**: `ProjectService.create` calls `assertWithinLimit(user, 'projects')`. The seed caps a free member at 3 projects; `member_plus` is unlimited. `ProjectList` shows a `LimitMeter` + `useLimitLock(PROJECT_LIMIT_ENTITLEMENT)`.
- **Paid capability**: `project.export` is held by `member_plus` only; the roadmap's export action swaps to a lock icon that opens the upgrade modal (`useLock('project.export')` in `ProjectRoadmap`), and an `UpgradeNudge` strip above the board sells it while locked. The quota shows the same pattern: at the project cap, the list's "New project" control is wrapped in `LockedAction` with `useLimitLock`, so clicking it opens the upgrade modal instead of a create form the server would reject.
- **Envelope + layering**: the router returns bare objects (the envelope hook wraps them); the web calls slice → service → `apiFetch` → `.data`.
- **Best-effort side effects**: mutations fire `recordAudit(...)` and, where relevant, `notify(...)` as detached `void` calls — never awaited, never able to fail the request. `announceShared` / `announceActivity` in `projectRouter.ts` are the copyable shape for "tell someone this happened"; the per-project `notifyOnActivity` switch is what gates the second one. See notifications-and-moderation.md.

## Moving a task

`tc-roadmap` renders the three status columns but has no drag-and-drop — it only emits `tc-select`. So `ProjectRoadmap` keeps the **selected task id** (not the task object, which would go stale the moment the status changed) and offers *Move back* / *Move forward* actions in the `tc-action-header`, each disabled at the ends of `STATUS_ORDER`. They call the `moveTask` slice action, which `PATCH`es `/api/tasks/:id`.

Selection is derived (`tasks.find(...)`) rather than stored, so after a move the label, the enabled/disabled state and the board all follow from one source. If you replace the board with a drag-and-drop component, keep `moveTask` and delete the header actions — the slice action is the seam.

## Endpoints

`GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id`, `GET/POST /api/projects/:id/tasks`, `PATCH/DELETE /api/tasks/:id`, `GET /api/projects/:id/export`.
