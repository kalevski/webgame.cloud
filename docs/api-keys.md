# API keys

Cookie sessions are the only way a browser authenticates, which leaves scripts and integrations with no
way in. API keys close that: a bearer token that acts as one account, optionally narrowed to a subset of
that account's permissions.

- API: `api/src/services/ApiKeyService.ts`, the bearer branch in `api/src/auth.ts`,
  `repositories/auth/AuthTokenRepository.ts`, routes in `routers/accountRouter.ts`.
- Web: *Admin → API keys* (`web/src/modules/ApiKeysAdmin.tsx`, `modals/ApiKeyModal.tsx`).

## Issuing

`POST /api/account/api-keys` with a name, optional `scopes` and optional `expiresAt`. The token is
`ak_<8 chars>.<secret>` — the prefix is stored in the clear so a key is identifiable in a list, the whole
token is stored **only** as a SHA-256 hash. The plaintext is returned once, by that response, and never
again; the admin screen makes that explicit and offers a copy button.

Keys belong to the account that created them (`/api/account/…`, not an admin route). `GET` lists them with
`lastUsedAt`, `expiresAt` and scopes; `DELETE /api/account/api-keys/:keyId` revokes.

## Authenticating

`registerAuth` checks `Authorization: Bearer …` **before** the session cookie. A resolved key populates
`request.user` exactly as a session would, so every downstream `requireAuth` / `requirePermission` /
ownership predicate works unchanged — there is no second authorization path to keep in sync.

Two properties are worth stating explicitly, because they are what makes keys safe to hand out:

- **A key can never exceed its owner.** Scopes are intersected with the account's live permission set
  (`scopes.filter((scope) => full.has(scope))`). Demote the role or revoke a per-user permission and every
  key that account issued narrows in the same instant — no key rotation needed.
- **An empty scope list means "everything this account can do"**, not "nothing". That is the convenient
  default, and the reason the UI nudges toward picking scopes.

`ApiKeyService.resolve` also refuses keys belonging to a deactivated account, and touches `last_used_at`
fire-and-forget so listing a key shows whether it is actually in use.

`ApiKeyModal` picks scopes through a **`tc-extended-select multiple`** over the whole `PERMISSIONS` catalog —
searchable, and the menu stays open so a key can be narrowed to several permissions in one pass. It is a
controlled field (`value={scopes.join(',')}`), so reopening the modal resets it with `setScopes([])`. See
frontend-architecture.md.

## What is deliberately missing

No per-key rate limits (the shared `rateLimit` preHandler is per user or IP — see platform-hardening.md),
no IP allow-list, and no automatic expiry sweep: an expired key stops resolving, but the row stays until
retention purges it. Keys are also not scoped to an organization, because the template is single-workspace.
