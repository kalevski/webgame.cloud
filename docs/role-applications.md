# Role applications

Some roles are bought (the Indie / Indie Plus / Studio ladder is a quota ladder attached to billing plans) and
some are granted. Role applications are the path for the second kind: a role marked **applicable** shows up as
something an account can ask for, the account writes a sentence saying why, and a staff member approves or
rejects it from a queue. Approving swaps the applicant's role.

Nothing is applicable out of the box — every role in `SEED_ROLES` ships `applicable: false`, because the
seeded ladder is sold rather than requested. Mark a role applicable from *Platform → Roles* when you want a
request path for it.

- API: `api/src/contracts/roles.ts` (the application types), `services/RoleApplicationService.ts`,
  `routers/roleApplicationRouter.ts`, `repositories/access/RoleApplicationRepository.ts` and its
  `sql/*application*.sql`.
- Permissions: `role.application.read` (see the queue), `role.application.write` (approve/reject). Both are
  seeded onto `maintainer`. Applying needs no permission — any active human account may apply for an open
  role.

## Data model

One table, `role_applications`, in `api/migrations/sql/00001_schema.sql`:

`user_id` (the applicant, `ON DELETE CASCADE`), `role_id` (`ON UPDATE CASCADE ON DELETE CASCADE` — renaming a
role id follows), `status`, `message` (the applicant's words), `decision_note` (the reviewer's), `decided_by`
(`ON DELETE SET NULL`) and `decided_at`.

`status` is one of `pending | approved | rejected | withdrawn` (`ROLE_APPLICATION_STATUSES`). A partial unique
index, `role_applications_open_unique_idx`, allows **one pending application per account** across all roles —
a second attempt rejects with `role_application_exists` rather than queueing behind the first.

The `roles` table carries the other half: `applicable` and `application_prompt` (the sentence shown to the
applicant, e.g. "Tell us how you plan to use the higher quotas"). `roles_applicable_idx` is the partial index
the open-roles list reads.

## Endpoints

| Route | Guard | What it does |
| --- | --- | --- |
| `GET /api/role-applications/open-roles` | signed in | Applicable roles minus the one the caller already holds (`OpenRole`: `id`, `name`, `applicationPrompt`). |
| `GET /api/role-applications/mine` | signed in | The caller's own applications, newest first. |
| `POST /api/role-applications` | signed in | Apply. Body `{ roleId, message? }`; the message is trimmed to 2000 characters. |
| `POST /api/role-applications/:applicationId/withdraw` | signed in | Withdraw the caller's own pending application. |
| `GET /api/role-applications` | `role.application.read` | The staff queue — filter by `status`, `roleId`, free-text `q`; paged with `limit`/`offset`. |
| `POST /api/role-applications/:applicationId/decision` | `role.application.write` | Body `{ approve, note? }`. |

Applying refuses with `role_not_applicable` when the role is not open **or the caller is a service account**,
`role_already_held` when the caller holds it, `role_application_exists` when one is already pending, and
`role_application_owner` for the reserved owner role — the owner is not replaceable this way.

Deciding refuses with `role_application_not_pending` when it was already decided, `self_role_change` when a
reviewer tries to decide their own application, and `role_application_owner` when approving would overwrite an
owner's role.

## What approval does

`RoleApplicationService.decide` writes the decision first, then — only on approval — sets the applicant's
`users.role` and calls `AccessPolicyService.invalidateUser`, so the new grants are live on the applicant's
next request rather than at their next sign-in.

Either outcome notifies the applicant (`role_application` in `NOTIFICATION_KINDS`, linking to
`/profile/roles`). The decision route records an audit entry, so approvals are traceable back to the reviewer.

## Interaction with roles and plans

A role cannot be deleted while applications for it are still pending — `role_has_applications` names the
count, the same shape as the existing `role_plan_bound` guard. Decide or withdraw them first.

Plans and applications are independent: a plan can grant a role at checkout while that same role is also open
to application. What they share is the invalidation path — both write `users.role` and then go through
`AccessPolicyService.invalidateUser`.
