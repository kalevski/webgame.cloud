# Landing page and waitlist

> Source: `proposal/08-landing-page.md`. Shared decisions: [`README.md`](README.md).
> Independent of the console specs — buildable at any point.

## Requirement

A public marketing page at `/`, served by the same SPA as the console, with eight bands (nav, hero,
stats, how it works, features, pricing, early access, footer) and exactly two jobs: explain the product
in fifteen seconds and capture an email. The email lands in a waitlist that carries a real promise —
**250 MB free forever** — which the billing system must honour when that address first signs in. The
page ships while the product is in alpha, so the `alpha` badge, the CTA target and one stat are
launch-day switches rather than a redesign.

## Scope

- `waitlist_signups` table + the grandfathered storage grant applied at first sign-in.
- `POST /api/public/waitlist` (unauthenticated, rate-limited, honeypot, duplicate-safe) and a staff list
  endpoint behind `waitlist.read`.
- The public `/` route in the SPA: eight band modules, strings, styles, meta tags.
- `/terms`, `/privacy`, `/dmca` as static public routes.

## Non-goals

- No CMS, no MDX, no blog. Copy is `configs/strings.ts` like the rest of the app.
- No analytics tag, chat widget, font CDN or any other third-party request — the page promises "no
  tracking" and must not contradict itself in its own network tab.
- No separate marketing site or static-site generator. One SPA, one deploy.
- No email verification loop — the address is confirmed by the launch mail itself.

## Data model

```sql
CREATE TABLE waitlist_signups (
    id             text PRIMARY KEY,
    email          text NOT NULL,
    marketing_opt_in boolean NOT NULL DEFAULT false,
    consent_version text NOT NULL DEFAULT '',
    source         text NOT NULL DEFAULT 'landing',
    granted_bytes  bigint NOT NULL DEFAULT 262144000,        -- 250 MB, the promise
    claimed_by     text REFERENCES users(id) ON DELETE SET NULL,
    claimed_at     timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);
CREATE UNIQUE INDEX waitlist_signups_email_idx ON waitlist_signups (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX waitlist_signups_created_idx ON waitlist_signups (created_at DESC, id DESC) WHERE deleted_at IS NULL;
```

The insert is `ON CONFLICT (lower(email)) WHERE deleted_at IS NULL DO UPDATE SET updated_at = now(),
deleted_at = NULL` — a returning visitor revives their row and sees the same confirmation, because
telling them "already registered" leaks who is on the list.

`granted_bytes` is stored per row rather than read from a constant so the promise cannot be changed
retroactively for people who already signed up. `consent_version` is the identifier of the opt-in
sentence shown at the time (`waitlist-2026-07`, a constant in `configs/strings.ts`) — an opt-in
boolean with no record of what was agreed to is not a consent record, and the string will be reworded.

`TABLE_LABELS` gains `waitlist_signups: 'Waitlist signups'`, default retention 0 (D10).

## Contracts

`contracts/waitlist.ts`:

```ts
export type WaitlistSignupDraft = { email: string; marketingOptIn?: boolean; source?: string; website?: string }  // `website` is the honeypot
export type WaitlistSignup = { id: string; email: string; marketingOptIn: boolean; source: string; claimedAt: string | null; createdAt: string }
export type WaitlistStats = { total: number; claimed: number }
```

`contracts/permissions.ts` adds `waitlist.read` (declared in the shared decisions, seeded to no role —
staff reach it through the owner role).

`contracts/errors.ts` reuses `email_invalid` and `rate_limited`; no new codes.

## API surface

| Method | Path | Guard | Body/Query | Errors |
|--------|------|-------|-----------|--------|
| POST | `/api/public/waitlist` | none — public | `{ email, marketingOptIn?, source?, website? }` | `email_invalid`, `rate_limited` |
| GET | `/api/admin/waitlist` | `requirePermission('waitlist.read')` | `?limit&offset&cursor` | — |
| POST | `/api/admin/waitlist/:id/grant` | `requirePermission('waitlist.read')` | `{ userId }` | `user_not_found` |

`WaitlistService`

- `signup(draft, ip)` — order matters: **honeypot first** (a non-empty `website` returns the same 204
  and writes nothing), then format validation, then the DB-backed per-IP rate limit (reuse the existing
  `rate_limits` mechanism — 5 per hour per IP), then the revive-upsert. Always 204, never a body that
  distinguishes new from returning.
- `claimGrant(user)` — called from `AuthService` on **every** sign-in, fire-and-forget: if a live
  `waitlist_signups` row matches the account's email, set `claimed_by`/`claimed_at` and write a
  `user_limit_overrides` row raising `storage_mb` to `max(planLimit, granted_bytes / 1MB)`. That is the
  whole "250 MB forever" mechanism — an existing per-user override, not a new subsystem.
  Every sign-in, not the first, because the address that joined the waitlist is often not the address
  the SSO provider returns (a personal Gmail on the list, a Workspace address at sign-in), and a
  first-sign-in-only check would silently drop the grant with no way back. The call is idempotent and
  cheap; a linked identity or a changed email picks the grant up on the next visit. Staff can also
  apply a grant by hand from the waitlist row (`POST /api/admin/waitlist/:id/grant`) for the case where
  the addresses never match.
- Because an override is absolute, `claimGrant` **recomputes it on plan change** too — the
  subscription-change path re-runs it, so an upgrade to a 1 GB plan is not capped back down to 250 MB
  by a stale override row. That keeps override semantics unchanged everywhere else (an override always
  wins) instead of special-casing one resource into a `max()` at resolve time.

`WaitlistRepository` (BaseRepository): `upsert` (returns the row), `list` (keyset paging on
`(created_at, id)` via `repositories/pagination.ts`, because the table is unbounded), `findByEmail`,
`markClaimed`.

The public route carries `config: { envelope: false }` (D6 — per route, never a `/api/public` prefix
rule, which would strip the envelope off the existing `/api/public/constants` the console reads) and is
exempt from the CSRF origin guard — it is a cross-origin form post from a marketing page, and it
carries no cookie. It is the only public *write* in the codebase, so it keeps the **DB-backed**
limiter (5/hour/IP): a write surface can afford a write, and unlike the game-runtime reads (spec 06)
it must hold across instances.

Side effects: `recordAudit(null, 'waitlist.signup', signupId)` — actor-less, since there is no session,
which is why `recordAudit` takes `User | null` and records the synthetic `system` actor (D8).
No notification, no email until launch; the launch mail is a bulk campaign through the existing email
worker when the flag flips.

## Web

- **Routing.** `/` renders `LandingPage` for a signed-out visitor and redirects to the dashboard when a
  session exists — in **every** deployment, with no `LANDING_PAGE` env switch: this repo is WebGame
  Cloud now (`README.md`, D1), not a template whose `/` might want to be a console. `Router.tsx` grows
  a small public branch alongside `/terms`, `/privacy`, `/dmca`. `Init.tsx` must not block the landing
  render on the session probe — the page is static and should paint before auth resolves.
- **These files already exist and are rewritten in place**, keeping their routes:
  `pages/LandingPage.tsx`, `pages/TermsPage.tsx`, `pages/PrivacyPage.tsx`, `modules/Landing.tsx`,
  `modules/LegalTerms.tsx`, `modules/LegalPrivacy.tsx`. The three legal routes collapse onto one
  `pages/LegalPage.tsx` rendering a document picked from `strings.legal`, and `/dmca` is the new third.
  The legal copy itself ships as clearly-marked placeholder text pending review — a marketing page may
  not, and this one does not, imply that a lawyer has seen it.
- **No slice.** Seven of the eight bands are static; the eighth calls
  `services/WaitlistService.ts` directly. A zustand slice for one fire-and-forget POST is ceremony
  without payoff (stated in the proposal, restated here so nobody "fixes" it).
- **Strings.** A `landing` section carrying every band's copy verbatim from `proposal/08-landing-page.md`
  — headline, six step titles, nine feature names, three pricing tiers, the three signup benefits, the
  footer links and the legal line. Pricing figures come from `GET /api/public/constants` (the existing
  plans endpoint) where they are numbers, and from strings where they are marketing words, so the
  displayed limits cannot drift from the seeded `role_limits`.
- **Styles.** `styles/modules/_landing.scss` — band rhythm (alternating surface / muted, hero on the
  blueprint grid, signup on ink), the four-appearance colour budget, `@include down($bp-md)` stacking
  rules. No new tokens; the page uses the existing palette.
- **Meta.** `usePageContext` sets title/description; `index.html` gains the OG/Twitter card tags,
  canonical URL and `theme-color`. The card image is a static asset in `web/public/`.

## UI component map

| Band | Component | Source | Key props/events |
|---|---|---|---|
| Nav | `tc-cool-nav` | `specs/tc-cool-nav.md` | `sticky`; `items` JS prop (three anchors); `login-label="Get early access"`; `scroll-offset` drives the condense; `tc-login` scrolls to the signup band |
| Alpha badge | `tc-badge` | `specs/tc-badge.md` | In the nav's `brand` slot |
| Hero | `tc-hero` | `specs/tc-hero.md` | `preview` + `backdrop="grid"` for the blueprint split; `primaryAction`/`secondaryAction` JS props; `tc-action` → `{ which }` |
| Stats | `tc-hero-stats-bar` | `specs/tc-hero-stats-bar.md` | `stats` JS prop (`{label, value, unit}`); **one stat only** — the live rounded waitlist count. `99.99%` and `< 5s` have no source in this repo and are dropped, not written as strings; the component self-mutes on an empty set, so a single figure reads fine |
| Band headings | `tc-section-flag` | `specs/tc-section-flag.md` | `title`/`subtitle`, `align="center"` |
| How it works | `tc-phase-grid` | `specs/tc-phase-grid.md` | `columns="3"`, `phases` JS prop; status `complete` for shipped steps — never `upcoming` on a marketing page |
| Step 03 visual | `tc-pipeline` | `specs/tc-pipeline.md` | `steps` JS prop: upload → filter → build → deploy → rollback |
| Step 06 visual | `tc-cdn-map` | `specs/tc-cdn-map.md` | `nodes` JS prop; exactly one `accent` node — one of the page's four colour appearances |
| Features | `tc-pinned-feature-showcase` | `specs/tc-pinned-feature-showcase.md` | `eyebrow`/`title`/`description` attributes, `items` JS prop, screenshot via the `media` slot |
| Pricing | `tc-pricing-card` ×3 | `specs/tc-pricing-card.md` | `features`/`action` JS props; `highlight` + `badge-text="POPULAR"` on Indie+; absent lines use `{ label, included: false }` so rows align |
| Early access | `tc-early-signup-form` | `specs/tc-early-signup-form.md` | `variant="dark"`, `benefits` JS prop, `cta-label="Reserve my spot"`; `tc-submit` → `{ email }`; the component owns validation and the success state |
| Footer | `tc-page-footer` | `specs/tc-page-footer.md` | `menus`/`socialLinks`/`legalLinks` JS props, `legal-text` |

The marketing opt-in checkbox is **not** part of `tc-early-signup-form` (it exposes only an email field
and benefits). Add it as a `tc-check` (`specs/tc-check.md`) rendered directly under the form and read
imperatively on `tc-submit` — the alternative, forking the component, is worse. Its label is the
consent sentence, and the request sends the matching `consentVersion`. The honeypot is a plain hidden
`<input name="website">` in the same wrapper.

No new React component.

## Access policy

The landing page has **no permission gating of any kind** — the whole surface is public, and
correspondingly it must never render a row of real project, user or build data. The waitlist list is
staff-only (`waitlist.read`). The signup write is guarded by rate limit and honeypot, not by identity.

## File manifest

**migrations** — `sql/00001_schema.sql` (E: `waitlist_signups` + two indexes + Down entry).

**api** — `contracts/waitlist.ts` (C) + `contracts/index.ts` (E), `contracts/permissions.ts` (E),
`contracts/retention.ts` (E: the label), `schema/waitlist.ts` (C),
`repositories/waitlist/sql/*.sql` (C: upsert-signup, select-signups, select-signup-by-email,
mark-claimed), `repositories/waitlist/WaitlistRepository.ts` (C),
`services/WaitlistService.ts` (C), `services/AuthService.ts` (E: `void waitlist.claimGrant(user)` on
every sign-in), `services/BillingService.ts` (E: re-run `claimGrant` on plan change),
`routers/publicRouter.ts` (C — or extend `publicGameRouter` from spec 06 if built),
`routers/adminWaitlistRouter.ts` (C), `http/envelope.ts` (E: honour `config.envelope === false` —
shared with spec 06), `http.ts` (E: `ROUTE_PLUGINS` + CSRF skip), `container.ts` (E).

**web** — `types/waitlist.ts` (C) + `types/index.ts` (E), `services/WaitlistService.ts` (C),
`configs/strings.ts` (E: the `landing` + `legal` sections, the consent-version constant),
`pages/LandingPage.tsx` (E, rewrite), `pages/TermsPage.tsx` + `pages/PrivacyPage.tsx` (D — replaced by
the shared page), `modules/Landing.tsx` + `modules/LegalTerms.tsx` + `modules/LegalPrivacy.tsx` (D),
`pages/LegalPage.tsx` (C — one component, three routes incl. `/dmca`),
`modules/LandingNav.tsx`, `LandingHero.tsx`, `LandingHowItWorks.tsx`, `LandingFeatures.tsx`,
`LandingPricing.tsx`, `LandingSignup.tsx`, `LandingFooter.tsx` (C),
`Router.tsx` (E: public branch), `modules/Init.tsx` (E: do not block the public render),
`index.html` (E: meta/OG/canonical), `public/og-card.png` (C),
`styles/modules/_landing.scss` (C) + `styles/modules/_index.scss` (E).

**docs** — `docs/landing-and-waitlist.md` (C) + `docs/index.md` (E),
`docs/platform-hardening.md` (E: the public write, its limiter and the CSRF exemption).

## Verification

1. `npm run typecheck`; `dropdb starter && npm run migrate`.
2. `curl -si -X POST localhost:6000/api/public/waitlist -H 'content-type: application/json' -d '{"email":"a@b.c"}'`
   → 204, no envelope. Repeat → 204 again, still one row.
3. Honeypot: same call with `"website":"x"` → 204 and **no** row written.
4. Six calls in an hour from one IP → `429 rate_limited`.
5. Sign in as `a@b.c` for the first time → a `user_limit_overrides` row raises `storage_mb`, and
   `/api/account/usage` shows 250 MB rather than the plan's 100 MB. Upgrade that account to a 1 GB
   plan → usage shows 1 GB, not 250 MB (the override is recomputed, not left to cap the plan).
6. `curl -s 'localhost:6000/api/admin/waitlist?limit=2' -b cookie | jq '.data'` (enveloped — it is an
   admin route) and a paging pass proving the cursor does not drift.
7. Browser at `localhost:6001/`: headline + one body line + primary button visible at 360×640 without
   scrolling; network tab shows zero third-party hosts; JS disabled still renders headline through
   pricing; a signed-in visitor hitting `/` is redirected to the dashboard.
8. The stats bar shows exactly one figure, and it matches `SELECT count(*) FROM waitlist_signups`.
9. `/terms`, `/privacy` and `/dmca` all render through one `LegalPage`, each with its own document.
