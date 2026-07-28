---
name: implementation-spec
description: Turn a feature requirement into a written implementation specification for this repo — data model, contracts, API surface, web UI plan, permission/quota/paywall wiring, side effects, and a file-by-file manifest. UI elements must be mapped to tc-* components from the web-components skill catalog first; a new component in web/src/components/ is the fallback only when no tc-* fits. Use whenever the user asks to "spec", "spec out", "write a specification", "plan a feature", "design how X would work", or hands over a requirement, user story, or feature idea and wants an implementation plan rather than immediate code.
---

# Implementation spec

Turns a requirement into `specs/<feature-slug>.md` — a specification another session (or person) can implement without re-deriving any decision. The spec is the contract for the implementation: every table, endpoint, file, and component named concretely, every convention already resolved against this repo's pattern skills. Write the spec; do not implement the feature unless asked. If `specs/<feature-slug>.md` already exists for this feature, revise it in place rather than writing a second file.

`specs/` is a working directory at the repo root, not `docs/` — the implementing change still owes `docs/` updates per CLAUDE.md, so the docs files belong in the file manifest like any other edit.

## Process

1. **Digest the requirement.** Extract: entities (what gets stored), actions (who does what), screens/surfaces (where it shows), access rules (which role/permission), quotas (is "how many" limited), paid gates (is any part an upsell), and side effects (does an action notify someone, leave an audit trail, or deserve an analytics event). A requirement rarely states all seven — infer the missing ones from how the existing features (projects/tasks) resolve them, pick a sensible default, and record every guess in the spec's **Open questions** section rather than blocking. Watch for requirement words that collide with repo vocabulary — "owner" is both a platform role (`OWNER_ROLE_ID`) and a per-resource concept (`ownerId`), "member" is both a seed role and any signed-in user; pin down which is meant in the Requirement section and flag the guess in Open questions.

2. **Load the pattern skills before planning layers.** They encode the exact file shapes the manifest must match:
   - `migration-patterns` — schema/seed conventions, the rebuild rule, the seed↔contract lockstep couplings.
   - `api-patterns` — contracts → router → service → repository shapes, error encoding, guards, envelope.
   - `web-patterns` — pages/modules/slices/services layering, modals, strings, entitlements, tc-* quirks.
   Do not restate their content in the spec — cite the convention and apply it (the implementer loads the same skills). When the plan needs a helper (data structure, async utility, validation), check the `base`/`node`/`logging` skills before speccing a hand-rolled one.

3. **Map the UI to the component catalog.** Read the component index in `.claude/skills/web-components/SKILL.md` — it is long enough to need more than one paginated read; read all of it before picking. For every UI element in every screen, find a `tc-*` component that covers it; prefer composing several existing components over inventing one. Before committing a component to the spec, read its spec file (`.claude/skills/web-components/specs/tc-<name>.md`) and confirm its attributes/events actually cover the interaction — a component chosen from its one-line index description is a guess, not a plan. Cite the spec file path next to each pick so the implementer reads the same source.

   Only when no tc-* component (or composition) covers the need, plan a new React component in `web/src/components/` — generic, prop-driven, store-agnostic per web-patterns — with a name, a props sketch, and one sentence on why the catalog has no fit. A spec that invents `tc-*` names is broken; verify every cited tag has a file in `.claude/skills/web-components/specs/`.

4. **Write the spec** using the template below. Sketches, not production code: DDL close to final (conventions are cheap to apply now), contract types as TypeScript sketches, endpoints as a table, component usage as prop lists. The one thing to be exhaustive about is the **file manifest** — an implementer should be able to work top-to-bottom without discovering surprise files.

5. **Sanity pass before saving.** Four checks catch most broken specs: (a) every lockstep coupling closed — a new permission appears in `PERMISSIONS` + `SEED_ROLES` + seed SQL; a new quota appears in `LIMITABLE_RESOURCES` + `RESOURCE_LABELS` + `COUNT_SQL`/`count-*.sql` + `role_limits` seed rows; a new error code appears in `API_ERROR_CODES` + web `ERROR_MESSAGES`; a new notification kind appears in `NOTIFICATION_KINDS` + the `notifications.kind` CHECK in `00001_schema.sql` (contract-union ↔ CHECK pairs like this exist wherever a CHECK mirrors a contract enum); a new contract file appears in `contracts/index.ts` + a `web/src/types/` re-export; (b) every manifest file maps to a template section that justifies it, and the registration edits are present — `container.ts`, `ROUTE_PLUGINS` in `http.ts`, `state/index.ts` (intersection + spread), `modals/index.tsx`, `types/index.ts`, `styles/modules/_index.scss`, the `docs/` file; (c) every tc-* tag cited has a spec file in the web-components catalog; (d) every Open question is phrased so a yes/no answer resolves it.

## Spec template

```markdown
# <Feature name>

## Requirement
<2–5 sentences restating the requirement in this repo's vocabulary. Link/quote the original if given.>

## Scope
<What ships. Bullet list.>

## Non-goals
<What deliberately does not ship, so the implementer doesn't gold-plate.>

## Data model
<DDL sketch per migration-patterns: table(s), owner_id FK if owned, CHECK enums,
indexes. State where each lands in 00001_schema.sql Up/Down and what 00002_seed.sql
gains. End with the rebuild reminder: dropdb + npm run migrate.>

## Contracts
<New/changed files under api/src/contracts/: entity + Draft type sketches, new
API_ERROR_CODES literals, new PERMISSIONS keys, LIMITABLE_RESOURCES entries,
NOTIFICATION_KINDS literals if the feature notifies.>

## API surface
| Method | Path | Guard | Body/Query schema | Errors |
|--------|------|-------|-------------------|--------|
<One row per endpoint. Guard = requireAuth / requirePermission('...') + ownership
predicate name. Errors = encodeErrorCause codes this endpoint can return.>

<Below the table: service responsibilities (validation, limits, mapping); repository
verbs (which need trx, which return conflict sentinels); side effects — which actions
fire notify(userId, kind, title, link) or recordAudit(actor, action, targetId), both
fire-and-forget per api-patterns. "No side effects" is a decision — state it.>

## Web
<Page, module(s), slice (state fields + actions with return types — and which actions
must refreshSession because they affect entitlements/limits), service methods,
modals (key/component/result type), strings sections, entitlements/paywall wiring,
analytics events added to the EVENT catalog, routing + nav changes. A quota lock UI
(useLimitLock/LimitMeter) needs a client-observable used count — name its source
(local list length, or session.usage surfaced through the auth slice); if neither
is worth wiring, spec server-side rejection only and say so.>

## UI component map
| UI element | Component | Source | Key props/events |
|------------|-----------|--------|------------------|
<Source = path to .claude/skills/web-components/specs/tc-<name>.md, or
"NEW — web/src/components/<Name>.tsx" with a props sketch below the table
and one sentence on why no tc-* fits.>

## Access policy
<Who can do what, stated as: permission keys, which SEED_ROLES gain them, ownership
predicate shapes, quota ceilings per role, paid entitlement mapping if any.>

## File manifest
<Ordered list of every file created (C) or edited (E), grouped by workspace, in
implementation order: migrations → contracts (+ barrel) → schema → repository (+ sql/)
→ conflicts.ts if a sentinel was introduced → service → router → container.ts +
http.ts ROUTE_PLUGINS → web types (+ types/index.ts) → service → slice (+
state/index.ts) → strings → modals (keys + component + index.tsx) → entitlements/
analytics configs → module → page → Router.tsx + nav (strings.nav + SidebarMenu) →
styles (_<foo>.scss + _index.scss) → docs/<area>.md (+ docs/index.md row if new area).
This is the implementer's checklist — the files most often forgotten are the
registration edits, listed in sanity check (b). The order is a superset, not a
quota: a feature extending an existing stack skips stages that don't apply — write
"untouched — <why>" only where the reader would otherwise expect an edit.>

## Verification
<Concrete steps: npm run typecheck; dropdb + npm run migrate; curl calls with
expected enveloped responses (jq '.data'); browser walkthrough at localhost:6001,
including the failure paths (limit hit, paywall, forbidden) — not just the happy path.>

## Open questions
<Every assumption made while writing the spec, phrased so a yes/no answer
resolves it. Empty section is fine if the requirement was complete.>
```

## Judgement calls

- **Right-size the plan to the requirement.** A read-only screen over existing data needs no migration section and maybe no new permission — write "none" under a heading rather than inventing scope. Conversely, anything user-created almost always wants ownership, a permission key, and a quota decision (even if the decision is "unlimited — no role_limits rows").
- **Mirror the worked example.** Projects/tasks is the template's canonical feature; when the requirement resembles an owned parent/child resource, the spec should read like a rename of that feature, not a novel architecture. Deviations from the example are the parts to justify in prose.
- **The spec is repo-specific on purpose.** Generic advice ("add tests", "consider caching") is noise here — this repo has no test suite by policy, and its caching/invalidation rules are fixed by the pattern skills. Every sentence should either decide something or point at the convention that already decided it.
