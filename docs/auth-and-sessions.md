# Auth & sessions

Opaque cookie-session auth (not JWT). The cookie is `starter_session` (HttpOnly) and carries a random token; the `sessions` table stores only **`sha256(token)`** in `token_hash`, so a database dump, replica or backup cannot be replayed as a live session. `sessions.id` is an ordinary UUID and doubles as the client-facing handle.

## Key files

- `api/src/auth.ts` — `registerAuth` (onRequest hook), `requireAuth`, `requirePermission`, cookie helpers, `SESSION_COOKIE`.
- `api/src/routers/authRouter.ts` — OAuth redirect flow (`/api/auth/:provider` + callback, sign-in and link modes), dev login, `/api/config`, `/api/auth/me`, logout.
- `api/src/services/AuthService.ts` — the provider registry (Google, Discord), code exchange + profile fetch (`authenticate`), `resolveOAuthUser`/`resolveDevUser`, `linkIdentity`, session open/close, the `/me` envelope.
- `api/src/repositories/users/UserRepository.ts` — user CRUD (`createWithAutoRole` holds the first-user advisory lock).
- `api/src/repositories/users/IdentityRepository.ts` — the `user_identities` table: `findUserByIdentity`, `link` (transactional upsert returning a `linked_elsewhere` sentinel), `unlink`.
- `api/src/repositories/users/SessionRepository.ts` — session CRUD (`create`, `findSessionUser`, `listForUser`, `touch`, `deleteOneForUser`, `deleteExpired`), the token→user cache and its invalidation. `hashSessionToken` is the one place the cookie value is hashed.
- `api/src/domain/userAgent.ts` — `describeUserAgent`: a dependency-free regex table turning a raw `User-Agent` into `{ browser, os }`.
- Web: `web/src/services/AuthService.ts`, `web/src/state/auth.slice.ts`, `web/src/modules/{LoginPanel,AuthGuard,ConsentGate,Init}.tsx`.

## Request flow

`registerAuth` runs on every request: reads the cookie, loads `request.user` (null when absent/invalid — it never rejects by itself), and resolves the caller's permission set once so `request.can(key)` stays a synchronous set lookup. It also stamps the user's `last_seen_at` (throttled ~hourly) for the WAU/D30 metrics, and the session row's own `last_seen_at` (throttled to once a minute) that powers the device list. Guards `requireAuth` / `requirePermission(...keys)` are `preHandler`s routes opt into.

## Sign-in

- **OAuth SSO** (any of `GOOGLE_SSO` / `DISCORD_SSO` configured): `/api/auth/:provider` → provider consent → `/api/auth/:provider/callback` verifies the identity (Google: id_token via tokeninfo; Discord: `users/@me` with the access token, requiring a verified email), resolves/creates the user, opens a session, redirects to `WEB_URL/dashboard` (`DashboardPage` consumes any stored post-login redirect from there). Built on the `@toolcase/node` OAuth2 helpers: S256 **PKCE** (`generatePKCE`), a 256-bit CSRF `state` (`generateState`) checked constant-time in the callback (`verifyCallback`), and `exchangeCode` with a 5s timeout. State + PKCE verifier (+ a `link` flag) round-trip through one HttpOnly cookie (`starter_oauth_state`, base64url JSON, 10 min). Providers are lazily built `defineOAuth2Provider` configs in `AuthService` — static endpoints, no boot-time discovery fetch. `GET /api/config` reports the configured providers (`AuthConfig.providers`); the login panel renders one button per provider.
- **Dev login** (`DEV_LOGIN=true`, never in prod — auto-disabled when any OAuth provider is configured): `POST /api/auth/dev` with an email — email-only, for local development.
- **Magic link** (behind the `magic_link` product flag, which itself requires `email` — `FEATURE_FLAG_REQUIRES` in `contracts/features.ts`): `POST /api/auth/magic-link` mails a one-time link through the configured `EmailPort`; `GET /api/auth/magic-link/:token` consumes it and opens a session. Tokens live in `login_tokens`, are **stored as a SHA-256 hash** (the plaintext exists only in the mail), expire after 15 minutes, are single-use (`consumed_at`), and both routes are rate limited — 5 requests per 15 min per IP+email, 20 consumptions per 15 min (platform-hardening.md). Sign-in resolves through the same `AuthService` path as SSO, so the first account created is still the `owner`. The dependency is real, not cosmetic: with `email` off there is no way to deliver the link, so the flag resolves to `false` and the login panel hides the field.

Every path above refuses a `kind = 'service'` row with `service_account_login`: a service account
authenticates only with a bearer key (service-accounts.md), never with a session.

## Sign-out

`POST /api/auth/logout` deletes the session row and clears the cookie. The web side (`auth.slice.ts` `logout`) drops the `has-session` hint and does a full page load to `/` — the **landing page**, not `/login`. Account deletion ends the same way. Routing rules are in frontend-architecture.md.

## Active devices

Each session row records the `User-Agent` and IP it was opened with (`sessionContext(request)` in `auth.ts`, threaded into `AuthService.createSession` and `UserService.impersonate`). The cookie token itself is never stored and never leaves the client; `sessions.id` is the handle sent to a client, and `token_hash` is what the server matches on.

- `GET /api/account/sessions` → `UserSession[]`: `{ id, current, browser, os, ip, createdAt, lastSeenAt, expiresAt }`, unexpired only, most recently active first, with the current device sorted to the top. `browser`/`os` come from `describeUserAgent`; the raw UA string is not exposed.
- `DELETE /api/account/sessions/:id` deletes one session by id, scoped to the caller's own user. Revoking the session backing the current request is refused with `current_session` (409) — signing yourself out is what `POST /api/auth/logout` is for. An unknown handle yields `session_not_found` (404).

`AccountService.listSessions`/`revokeSession` hold the rules; the current-device comparison hashes the caller's cookie and compares `row.token_hash`, so it never needs the plaintext of any other session. On the web this is the **Devices** tab of `/profile` (`modules/DeviceSessions.tsx`, `/profile/devices`) — the current device renders as a card at the top with a "Current" badge and no sign-out control, every other device gets a row with a Sign out button. Revocation takes effect on the revoked device's next request (its cookie no longer resolves to a session, so `request.user` is null → 401).

## The OAuth flow cookie

State + PKCE verifier (+ the `link` flag) round-trip through one HttpOnly cookie, and that cookie is
**HMAC-signed** with a workspace secret before it is written (`createHmac('sha256', flowSecret())` in
`routers/authRouter.ts`). The secret is created once and kept in settings
(`SettingsService.getOrCreateSecret`, key `oauth_flow_secret`), loaded at boot.

Without the signature an attacker could plant a flow cookie in a victim's browser and drive the victim's
callback — including setting the privileged `link` flag, which binds an identity to the *current session's*
account. The signature makes a planted cookie unverifiable, so the callback rejects it.

## Impersonation

Impersonation is visible, not just audited. `sessions.impersonated_by` records the administrator who opened
the session; `request.impersonatedBy` carries it per request, `AuthSession.impersonatedBy` reports it to the
client as an `Impersonator` (`id`, `name`, `email`), and `recordRequestAudit` stamps `audit_log.impersonated`
on every action taken while impersonating.

`POST /api/auth/impersonation/end` returns the administrator to their own account in one step — it refuses
with `not_impersonating` on an ordinary session.

The consent gate is **skipped** while impersonating, and `POST /api/account/consent` refuses with
`consent_while_impersonating` (`routers/accountRouter.ts`). An administrator must never be able to accept
Terms or Privacy on someone else's behalf and have it recorded as that person's own consent.

The web surface for this — the persistent banner and the one-click return — lands with the frontend work;
the API contract above is what it reads.

## Linked identities

External logins live in `user_identities` (`provider` + `subject` PK, one row per provider per user), not on the `users` row. `resolveOAuthUser` looks up by identity first, then by email (linking the identity to the matched account), and only then creates a new user. A signed-in user can connect more providers from the Profile page: `/api/auth/:provider?link=1` runs the same OAuth flow but, on callback, binds the identity to the **current session's** user and redirects to `/profile?linked=<provider>` (or `?link_error=<code>`; a subject already bound to a different user yields `identity_linked_elsewhere`). Account endpoints: `GET /api/account/identities` lists connections, `DELETE /api/account/identities/:provider` disconnects one — refused with `last_identity` when it is the only sign-in method left (dev-login accounts have zero identity rows and simply have nothing to unlink). Identities are included in the account export.

**First user is owner**: `UserRepository.createWithAutoRole` takes a transaction advisory lock, and if the `users` table is empty the new account gets role `owner`; everyone after gets the role bound to the `default` slot. This is hard-coded on purpose — it guarantees every deployment has one undeletable administrator.

## Session envelope

`GET /api/auth/me` returns `AuthSession`: the `User`, the advisory `permissions` array, resolved `limits`/`resourceLimits`/`usage`, the `slots` map, and `paidRoleNames`. The web app re-fetches it on window focus and after any unexpected 403 (`Init.tsx` + `helpers/api.ts`), which self-heals a stale client without polling or forcing a re-login — so a role grant never logs anyone out.

## Consent gate

A brand-new account has `consentedAt === null`. `AuthGuard` renders `ConsentGate` instead of the page until `POST /api/account/consent` stamps it. It is the one client-side signal distinguishing a sign-up from a returning login (used for the `sign_up` vs `login` analytics event).

The gate is a countersign sheet, not a modal-style card: each legal document is its own row with a
one-line summary, an `Effective <date>` stamp, a *Read* link that opens the public `/privacy` / `/terms`
page in a new tab (`target="_blank"` + `rel="noopener noreferrer"`, with an "opens in a new tab" aria
label) so the gate stays where it is, and its own *I have read and accept this* checkbox. *Accept and
continue* enables only when every row is checked; a mono `N of M accepted` counter (`aria-live`) tracks
progress. The waitlist principle from landing-and-waitlist.md — an opt-in boolean with no record of what
was agreed to is not a consent record — is why the rows name each document and its effective date instead
of one "I accept both documents" checkbox. Document metadata (key, route, effective date) lives in
`web/src/configs/legal.ts`, shared by the gate and the legal pages; `LegalPrivacy.tsx` / `LegalTerms.tsx`
read their `updated` date from it, so bumping a document's date is a one-place change.
