# Service accounts

An API key acts as the account that issued it, which is fine for a script an engineer runs and wrong for a
machine caller that has to outlive whoever set it up — a realm, a CI pipeline, another service calling into
this workspace. A service account is that missing identity: a machine account with its own role and its own
per-account permission overrides, and no way to sign in.

- API: `api/src/services/ServiceAccountService.ts`, `routers/serviceAccountRouter.ts`, the
  `createServiceAccount` / `listServiceAccounts` / `findServiceAccount` / `deleteServiceAccount` verbs in
  `repositories/users/UserRepository.ts`.
- Web: *Admin → Service accounts* (`web/src/modules/ServiceAccountsAdmin.tsx`,
  `modals/CreateServiceAccountModal.tsx`, `state/serviceAccounts.slice.ts`).
- Permissions: `admin.service.read` (see the list and its keys) and `admin.service.write` (create, edit
  access, issue and revoke keys, delete).

## It is a `users` row

A service account is a row in `users` with `kind = 'service'` (every human account is `kind = 'human'`, the
column default). That is the whole trick: roles, per-user permission deltas, quota overrides, ownership
predicates, audit entries and `resolvePermissions` keep working untouched, because a machine caller is the
same shape as a human one. There is no second authorization path to keep in sync.

Consequences of that choice, all enforced in code:

- **It cannot sign in.** Its email is a synthetic `<id>@service.local`; `AuthService.resolveOAuthUser` and
  `resolveDevUser` reject a `service` row with `service_account_login` before touching a session — this
  covers Google/Discord SSO and dev login (magic links resolve through the same `AuthService` path, so it
  is covered too).
- **It is not in the user directory.** `list-users.sql` and `count-users.sql` filter `kind = 'human'`, so the
  admin *Users* table and the first-user-becomes-owner count (`UserRepository.createWithAutoRole`) both
  ignore it. `UserService.impersonate` and `UserService.update` treat a `service` target as `user_not_found`
  — service accounts are edited through their own routes only.
- **It cannot be the owner.** `ServiceAccountService`'s private `resolveRole` rejects `OWNER_ROLE_ID` with
  `service_account_role_reserved`, and the role picker in `CreateServiceAccountModal` / `ManageAccessModal`
  (`scope: 'service'`) drops that option from the list.

## Managing one

| Route | Permission | Does |
| --- | --- | --- |
| `GET /api/service-accounts` | `admin.service.read` | list, each with `keyCount` and `lastUsedAt` (the newest `last_used_at` across its keys) |
| `POST /api/service-accounts` | `admin.service.write` | create with a name and a role (defaults to the `default` slot's role) |
| `PATCH /api/service-accounts/:id` | `admin.service.write` | rename, change role, enable/disable |
| `DELETE /api/service-accounts/:id` | `admin.service.write` | soft-delete the account and revoke its keys in one CTE (`delete-service-account.sql`) |
| `GET`/`PUT /api/service-accounts/:id/access` | `admin.service.write` | the same `UserAccessOverrides` payload the user access editor uses |
| `GET`/`POST /api/service-accounts/:id/keys` | read / write | list and issue keys owned by the account |
| `DELETE /api/service-accounts/:id/keys/:keyId` | `admin.service.write` | revoke one key |

Permissions are chosen exactly the way a human account's are: `ServiceAccountsAdmin` opens the same
`ManageAccessModal` used by `UsersAdmin`, passing `scope: 'service'` — this renders the same
`tc-module-access` grid over the whole `PERMISSIONS` catalog and posts the same permission/limit delta, only
the endpoint (`ServiceAccountService.saveAccess` vs `AccessPolicyService.saveUserOverrides` through
`accessPolicyRouter`) differs. Disabling an account (`active = false`) resolves it to the empty permission
set through the same "inactive account resolves to nothing" rule every account obeys, so every key it issued
stops working in the same instant.

## Getting a token out

Keys are the ordinary API keys described in [api-keys.md](api-keys.md) — `ak_<prefix>.<secret>`, SHA-256
hashed at rest, plaintext shown once, scopes intersected with the owner's live permission set. The only
difference is the owner: a service account instead of a person. `ApiKeyService` is shared verbatim, and
`ApiKeyModal` takes an optional `{ serviceAccountId }` modal input (`ApiKeyModalInput`) that routes creation
through `serviceAccounts.slice.ts`'s `createServiceKey` instead of the account-scoped `createApiKey`.

So a scope narrows a key *within* what its service account may do — grant `bundle.write` to the account, then
issue one key scoped to `build.run` for the CI runner and another scoped to `config.write` for the ops
console. Widen the account and every unscoped key widens with it; demote the account and every key narrows.

## What is deliberately missing

No client-credentials OAuth flow, no key rotation helper (issue the new key, then revoke the old one), and no
per-service rate limits beyond the shared buckets in [platform-hardening.md](platform-hardening.md). Nothing
prevents several callers sharing one service account — separate accounts are how you get separate audit
trails, so prefer one per caller. A realm's own bearer token (registered by staff, per-realm — see
[realms-and-migrations.md](realms-and-migrations.md)) is a separate mechanism and does not go through this
feature.
