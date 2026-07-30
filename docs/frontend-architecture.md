# Frontend architecture

The web app follows the `react-spa-app` skill. Read that skill for the full contract; this is the app-specific map.

## Layering (never skip a layer)

```
pages → modules → components / state (slices) → services → helpers/api (apiFetch)
```

- **pages** (`pages/*.tsx`) wrap one module in a layout HOC (`wrapInMainLayout` / `wrapInBaseLayout`) + `AuthGuard` (+ optional `permission`) and set the page title/description via `usePageContext`.
- **modules** (`modules/*.tsx`) are feature screens; they read the store and open modals.
- **components** (`components/*.tsx`) are reusable, store-agnostic (`AdvancedTable`, `PageToolbar`, `RouteTabs`, `LimitMeter`, `LockChip`, `LockedAction`, `UpgradeNudge`, `Loading`, `Icon`, `EarlyAccessPanel`).
- **services** (`services/*Service.ts`) are singletons wrapping `apiFetch` per domain. Modules never call `apiFetch` directly.
- **state** (`state/*.slice.ts`) are zustand slices; `state/index.ts` assembles them. Read one field per selector — never `useStore(s => s)`.

## Routing & redirects

`Router.tsx` holds a flat route table; `AuthGuard` enforces access per page. Routing is `react-router` **v8**, imported from `react-router` (never `react-router-dom`); the whole app uses the component API (`BrowserRouter`/`Routes`/`Route`) plus the `useNavigate`/`useParams`/`useLocation` hooks — no data routers, loaders or RSC entry points.

- `/` (`LandingPage`) is **public and stays reachable while signed in** — it never bounces an authenticated visitor. `Landing.tsx` reads `useAuth()` and swaps every sign-in entry point (nav button, hero primary action, footer link, footer CTA) from `/login` to `/dashboard`, relabelling with `strings.landing.ctaDashboard` / `footerDashboard`. Those entry points leave the page with a full load (`window.location.assign`, matching the footer's plain anchors) rather than a client-side `navigate()` — the landing page is built from `tc-*` elements that rearrange their own light DOM, and unmounting them mid-SPA-transition makes React throw `NotFoundError: Failed to execute 'removeChild'`.
- `/login` is guarded by `<AuthGuard>` without `secured`: an already-authenticated visitor is sent to the stored post-login redirect, else `/dashboard`.
- A `secured` page without a session saves the current path (`helpers/postLoginRedirect`) and redirects to `/login`; a `secured` page whose `permission` fails redirects to `/dashboard`.
- Signing out, deleting the account and starting an impersonation all do a full page load: logout/delete land on `/` (landing), impersonation on `/dashboard`.
- Unknown paths fall back to `/`.

## Store slices

`alerts`, `auth`, `accessPolicy`, `notifications`, `moderation`, `users`, `projects`. Add a feature's slice to both the `AppStore` type and the `create` spread in `state/index.ts`.

## Money formatting

`helpers/money.ts` exposes `formatMoney(amountCents, currency)` over a module-level `Map` of `Intl.NumberFormat` instances keyed by currency — building one is expensive, so nothing constructs a formatter per render or per table row. Every price, invoice amount and plan card goes through it.

## REST envelope

Every JSON response is `{ status: 'OK', data }` or `{ status: 'rejected', cause }` (server hook `api/src/http/envelope.ts`). `cause` is a machine code plus comma-joined params (`"limit_reached,projects,3"` — catalog in `api/src/contracts/errors.ts`), never display copy; `helpers/api.ts` parses it, renders the sentence from `strings.errors` (typed total over the catalog, so a new code without a template is a build error), and throws that as a readable `Error` on non-2xx. A stray 403 triggers a session re-fetch (self-heal). A `curl` shows the envelope — reach into `.data`.

## Modals

`modals/keys.ts` holds the `MODAL` key map (its own file so the component-bearing registry stays a clean Fast Refresh boundary); `modals/registry.tsx` holds the context/hooks (`useModalOpen`, `useModalClose`, `useModalInput`, `ModalWindow`); `modals/index.tsx` (`ModalRender`) mounts each modal once. Add a key + a `<ModalWindow>`. Modal bodies stay mounted while hidden and reset on open. `title` accepts a
function of the modal's input when the heading depends on it (the bundle wizard reads *New bundle* vs *Edit
bundle* from whether an existing bundle was passed), and `staticBackdrop` stops a stray click outside the
dialog from discarding a half-filled wizard — set it on multi-step modals.

**`ModalWindow` restores focus to the opener.** It captures `document.activeElement` when the modal opens and re-focuses it on close (falling back to a `blur()` if the opener has since unmounted). Without this, `tc-modal` sets `aria-hidden` on a subtree that still holds focus — Chrome logs *"Blocked aria-hidden on an element because its descendant retained focus"* and, more practically, focus falls back to `<body>`, so the next Tab restarts from the top of the page instead of returning to the button that opened the dialog. Keep this if you swap the modal component.

**Escape closes one layer at a time.** `tc-modal` and `tc-extended-select` both listen for Escape on `document` in the bubble phase, and only the modal consults the overlay stack — so with a select menu open inside a modal, both handlers fire and Escape discards the whole form the user was half-way through filling in. `ModalWindow` adds a capture-phase Escape listener that, when the open modal contains an expanded `.tc-extended-select__menu--open`, stops propagation and dispatches a `mousedown` on `document` — the select's own outside-click handler closes just the menu. A second Escape then closes the modal, and a modal with no open menu is untouched. The same guard covers `.tc-tag-input-menu--open` — the tag input's suggestion list has the identical problem, and Escape used to throw away a whole bundle wizard. Drop this once the library gives dropdowns a place on the overlay stack.

## Dates

Never call `toLocaleDateString()` / `toLocaleString()` inline. `helpers/dates.ts` exposes `formatDate` (e.g. *Jul 27, 2026*) and `formatDateTime`, both null-safe with an em-dash fallback. One place to change the convention, and no drift between screens — which is how the app ended up mixing `7/26/2026` with `1 min ago`. Relative "x min ago" labels go through `hooks/useWhen.ts`, which reads `strings.notifications.justNow` / `minutesAgo` / `hoursAgo` / `daysAgo` and falls back to `formatDate` past a week — so the copy stays translatable and no module invents its own wording. `Dashboard` and `NotificationsBell` still carry their own inline variants; migrate them when you touch them. `helpers/format.ts` holds `formatBytes` for sizes.

## Layouts

`MainLayout` = the `tc-dashboard-layout` shell (brand, `SidebarMenu`, `UserPanel`, `PageHeader`, `CommandPalette`, `UsageSummary`, `NotificationsBell`, `AlertPanel`). `BaseLayout` = chrome-free (login, legal). Both are HOCs.

**Three navigation surfaces, one rule.** `SidebarMenu` (Project / Workspace / Platform sections), the `UserPanel` avatar menu (Profile, Billing, Admin, Moderation), and the ⌘K palette's *Go to* group each list routes, and each gates them on the same `useCan` / `useFeature` checks. When you add a route, add it to all three or deliberately decide not to: a route that exists in one surface and not the others is how the palette ended up missing half the app.

**Live is deliberately not in the sidebar either.** `/projects/:id/live` is reached from the `Live` step of
`ProjectPipeline` (see live-builds.md); it is a per-project destination, not a platform one, so it belongs to
the pipeline rather than the nav.

**Shared project surfaces.** `components/ChoiceCards.tsx` (the landing engine-card visual, reused for app
types and bundle engines), `components/ProjectPreview.tsx` and `components/ProjectIconTile.tsx` are shared by
the create-project page, project settings and the switcher, so those screens cannot drift apart.

**Admin and Moderation are deliberately not in the sidebar.** They are staff destinations rather than everyday workspace ones, so they are reached from the `UserPanel` avatar menu and the ⌘K palette only. The sidebar carries Project, Workspace and Platform. If you re-add an Administration section, add it to all three surfaces and update this paragraph.

## Console page shape

Every console screen opens the same way, so the three product pages (`/projects/new`, project settings)
and the platform pages read as one app:

1. **A `tc-rich-page-header`** — `title-text`, `description`, `icon-name` (Lucide, PascalCase) and
   `icon-color`, taking its copy from `strings.pages.*` so the header, the document title and the shell's
   `PageHeader` all say the same thing. It sits either directly in the page (`CreateProjectPage`,
   `RealmsAdminPage`, `InvoicesPage`, `EnquiriesPage`, `PlatformUsersPage`) or at the top of the one module
   that owns the screen (`AdminWorkspace`, `Moderation`, `Profile`, `Dashboard`, `BillingPage`). Project
   screens get theirs from `ProjectPageShell` instead.
2. **`RouteTabs`** when the screen has several independent forms, so each is linkable.
3. **`tc-section-card`s** for the content — each with a `title`, an `icon`, and its action in the card's
   `action` slot.

**The card title is written once.** Screens used to render a `tc-action-header` carrying the same words
directly above a `tc-section-card` with the same `title`, which showed the heading twice and needed an
effect that poked `.tc-action-header-content.textContent` on every render (the element relocates its own
light-DOM children, so React children could not be used). Putting the action in the card's `action` slot
removes both. `tc-action-header` is no longer used anywhere in `web/src`.

**Slot children need the same wrapper as body children.** `tc-section-card` collects `[slot="action"]` at
connect time and moves those nodes into its header, so a conditional straight under the card is the trap
described in *Never conditionally swap a direct child of a `tc-*` element*. Render one stable
`<span slot="action" className="section-card-actions">` (it is present from the first render, so it is
relocated once) and put the permission check inside it. Do not repeat `slot="action"` on the buttons
within — the card would collect them too and move them out of the span React owns.

## The floating action bar

`components/FloatingActionBar.tsx` is the console's commit surface: a card pinned to the bottom of the
viewport carrying the actions that finish what the page is for — *Save* on both project settings tabs,
on the profile's display name, on platform settings and on email delivery, and
*Back / Next / Create project / Cancel* in the project wizard. Copy on the left, buttons on the right.
A single-form settings screen commits this way; a *Save* button parked under the last field is the shape
being replaced. The exception is a screen carrying two independent forms — *Data retention* saves the purge
worker and the per-table policy separately, so each keeps its own inline button rather than sharing one bar
whose target would be ambiguous.

```tsx
<FloatingActionBar label={p.unsavedHint} visible={dirty}>
    {canWrite && <tc-button key="save" variant="primary" onClick={save}>{p.save}</tc-button>}
</FloatingActionBar>
```

**On settings it is gated on a dirty flag**, so the bar is absent until the form is actually touched and
slides away again once the save succeeds. The flag is set by the field handlers rather than derived by
diffing the draft against the project: General keeps its markdown description in a `useRef` (so a
description edit re-renders nothing and a computed diff would miss it), and Categories & tags re-seeds its
three lists from the store in an effect (so a diff would fire on load). Both clear the flag when the
seeding effect runs and when a save returns `true` — a failed save leaves the bar up with the edits intact.
The wizard passes no `visible`, because its Cancel action is always available.

Three things are load-bearing:

- **It hides itself when it has nothing to offer.** `React.Children.toArray(children).filter(Boolean)`
  drops `false` and `null`, so a bar whose every action is gated behind a permission renders as an empty
  strip — which would be worse than no bar at all. Callers must therefore **conditionally render** their
  buttons (`{canWrite && <tc-button…>}`), never `hidden={…}`: a hidden button is still a child, so the bar
  would stay visible around an invisible action. The wizard's step buttons were converted from `hidden` to
  conditional rendering for exactly this reason.
- **Its width is measured, not guessed.** The component renders a zero-height anchor in normal flow, reads
  that anchor's `left`/`width` through a `ResizeObserver`, and applies them to the `position: fixed` bar.
  So the bar tracks whatever column its caller sits in — `.console-page`, `.project-page`, a narrower form
  — with no knowledge of the sidebar width or the page's `max-width`, and it follows a layout change
  automatically.
- **Clearance is a page concern, not a spacer.** While visible the bar writes `--fab-clearance`
  (its height plus a gap) onto `document.documentElement`, and `.project-page` / `.console-page` add that
  to their `padding-bottom`. An in-flow spacer was the first attempt and it is wrong: on a page that renders
  more content *after* the component (settings General puts the danger zone below the form) the spacer
  opens a gap mid-page while the real last element still slides under the bar.

Fade in/out is `opacity` + a small `translateY`, with `visibility` and `pointer-events` toggled so a hidden
bar cannot be clicked or tabbed into; the `visibility` transition is delayed by the fade duration on the way
out so the element stays hittable until it has finished fading. `prefers-reduced-motion` drops both the
transition and the transform.

## `tc-input-group` needs two shims

`tc-input-group` renders a Bootstrap `.input-group` and moves its slotted children into it, but the
package's rules target **direct** children — `.input-group > .form-control` for the flex sizing,
`.input-group > .btn` for the seam. Put `tc-*` elements in the group and the control is a *grandchild*, so
neither rule lands: the field collapses to its intrinsic width instead of filling the row. Any group built
this way needs `> tc-input { flex: 1 1 auto; min-width: 0 }` plus `.form-control { width: 100% }`.
(`.form-control` has `border-radius: 0` in this theme, so there is no corner-joining to redo.)

The second shim is less obvious: **`tc-input` always reserves a validation slot.** `TextFieldBase` renders
a `.tc-field-message` div with a `min-height` even when there is no help, error or state — 19 px of empty
space below the control. On its own that is the point (messages appear without shifting the layout), but
inside an `align-items: stretch` input group it makes the host 66 px against a 42 px control, and any
button beside it stretches to match and towers over the field. Hide it where the group supplies its own
hint: `.input-group > tc-input .tc-field-message:empty { display: none }`. The project wizard's name field
(`styles/modules/_project-wizard.scss`, `&__name-group`) is the worked example.

## Never conditionally swap a direct child of a `tc-*` element

Many `tc-*` elements relocate their light-DOM children into an internal body container. React does not know that, so when it later removes or replaces a node it believes is a child of the custom element, `removeChild` throws `NotFoundError: Failed to execute 'removeChild' on 'Node'` — an uncaught render error that unmounts the WHOLE root and leaves a blank white page with no visible component stack (the same failure the landing page's full-page-load links avoid, see *Routing & redirects*).

**Rule: put a plain wrapper element you own inside the custom element, and do the conditional inside that wrapper.**

```tsx
<tc-panel bordered>
    <div className="module-x__panel-body">
        {loaded && rows.length === 0 ? <tc-empty-state /> : <div className="rows">{rows.map(...)}</div>}
    </div>
</tc-panel>
```

The same relocation is why a child mounted *after* the custom element connects can render outside its body — a stable wrapper (`tc-stack` or a `div`) that exists from the first render fixes that too (`DeviceSessions.tsx`, `AccountSettings.tsx`). A conditional whose value never flips at runtime is safe, but wrapping is cheap and removes the trap.

## `FilterBar` — one filter surface for every list

`components/FilterBar.tsx` is the console's filter chrome: an instrument-style strip with a mono legend
gutter down the left, one row per filter, and a **readout** column on the right that reports the filter's
*effect* rather than its settings — `33 files` when nothing is filtering, `16 of 33 files` with the match
count in accent plus a `Clear` control once something is. The readout is the reason the component exists as
a shared piece: every list had its own way of saying how much was showing (or no way at all), and the count
belongs beside the controls that changed it, not buried in a footer.

```tsx
<FilterBar
    rows={[
        { key: 'category', legend: a.filterCategoryLabel, chips, value: category, onChange: pick },
        { key: 'tags', legend: a.filterTagLabel, control: <tc-tag-input ref={tagFilterInput} /> },
    ]}
    total={assets.length}
    matches={filtered.length}
    unit={assets.length === 1 ? a.fileWord : a.filesWord}
    active={filtersActive}
    onClear={clearFilters}
/>
```

A row is either **chips** (`chips` + `value` + `onChange`, optional `toggle` so clicking the active chip
clears it) or an arbitrary **control** node — that split is what lets one component carry the assets screen's
category chips *and* its `tc-tag-input` in the same frame. Chips are `tc-badge` inside a real `<button>`
(`aria-pressed`), each with an optional count; `unit` should agree with `total`, not with `matches`, or a
single match reads "1 of 33 file".

Consumers: `FileList` (category + tags) and `BuildList` (status, replacing a bare `tc-chip` row — the old
`.console-filters` helper had no callers left and is gone). Add filters to a list by adding a row here rather than
by hand-rolling another chip strip.

**Two specificity notes**, both learned the hard way. The chips keep `variant="secondary"` fixed and are
styled through their own `data-active` attribute — swapping the badge's `variant` would re-render the custom
element and relocate its slotted text (see `docs/known-problems/tc-elements-rebuild-their-children.md`). And
the selected fill has to out-specify **two** `!important` rules: Bootstrap's `.text-bg-secondary` and the
blueprint theme's `tc-theme[name=blueprint] .badge.text-bg-secondary`. Hence
`.filter-bar__chip[data-active='true'] .badge.text-bg-secondary { background-color: … !important }` — four
class-level selectors, which is what it takes to win. Note the painted node is `.badge`, not `.tc-badge`.

## A table rebuild destroys the controls inside its rows

`tc-advanced-table` takes its rows as an **HTML string**, so every re-render of the table replaces the row
markup wholesale — and any custom element living in a cell (the permission multi-selects on Members and
Invites) is destroyed and rebuilt with it. An open dropdown vanishes mid-pick, focus is lost, and a typed
search query goes with it.

`useTc` only assigns a property when the value's **identity** changed, which is the whole defence — so
`components/AdvancedTable.tsx` runs `columns`, `filters`, `filterValues`, `sortableColumns` and `sort`
through `useStableValue` (a `useMemo` keyed on the JSON of the value) before handing them to `useTc`. Without
that, a caller passing `columns={[…]}` inline — the natural way to write it, and what every caller does —
hands the element a fresh array on every render, so any unrelated state change rebuilt the table. That is
what closed the permission dropdown on every pick: `tc-change` → `setPending` → re-render → new `columns`
identity → `el.columns = …` → rows re-rendered → dropdown gone. The same bug is invisible in a modal
(`InviteMemberModal`), because there is no table to rebuild.

The matching rule for the imperative side: **wire each in-row element once.** `ProjectMembers` marks a
select with `data-wired` after assigning `items` and only writes `values` when the set actually differs
(`wireSelect`), because the `items` setter clears the search box and re-renders the option list — so an
effect that reassigns `items` on every keystroke of state is its own version of the same failure.

## Multi-select (`tc-extended-select multiple`)

`tc-extended-select` picks one option by default. Add the `multiple` attribute and it becomes a checklist:
the menu stays open across picks and `value` becomes the comma-separated key list. Requires
`@toolcase/web-components` **>= 5.0.14** — on older versions the attribute is ignored and the field silently
stays single-select, which is the failure mode to watch for after a downgrade.

Drive it as a **controlled** field: state in, `tc-change` out. Same shape as every other `tc-*` field in
`modals/` (`CreateProjectModal`, `ConsentGate`), so there is nothing new to learn.

```tsx
const [selected, setSelected] = useState<string[]>([])

const eventItems = useMemo(() => events.map((event) => ({ key: event, label: event })), [events])

const eventSelect = useTc<HTMLElement>(
    { items: eventItems },
    { 'tc-change': (event: Event) => setSelected(selectedKeys(event)) }
)

<tc-extended-select
    ref={eventSelect}
    multiple
    value={toKeyList(selected)}
    placeholder={t.common.selectMultiple}
    search-placeholder={t.common.search}
    no-results-text={t.common.noResults}
></tc-extended-select>
```

`selectedKeys` / `toKeyList` are `helpers/select.ts`. Use them rather than reading `detail.value` and calling
`.join(',')` inline — see the degradation note at the end of this section for why.

Rules, all of them things that bite:

- **`items` must be memoised** — same trap as the command palette above, and worse here. The `items` setter
  clears the search box and re-renders the option list; because a pick fires `tc-change` *while the menu is
  still open*, an unmemoised array means every pick wipes what the user typed to find the next one.
- **`items` only goes through the JS property**, never an attribute — hence the `useTc` first argument.
- **`detail.value` is a `string[]`** under `multiple` and a **`string`** without it. `selectedKeys` normalises
  both shapes to an array, so the state stays an array whichever mode the element ends up in.
- **Controlled `value` covers prefill and reset.** `value={selected.join(',')}` means an edit form prefills by
  setting state (`setSelected(endpoint.events)`) and a reopened modal resets with `setSelected([])` — no
  imperative `el.values = [...]` in a `requestAnimationFrame`. This matters because modal bodies stay mounted:
  a reset that only cleared a `useRef` would leave the old selection showing in the trigger.
- **Keys must not contain commas** — `value` is comma-delimited, so a key with one splits into two.
- **Declare `multiple` in JSX, not through `useTc`.** React sets the attribute before the element connects,
  so the first render is already multi-mode; a `useTc` prop lands one tick later and forces a re-render.

Cosmetic, but surprising the first time: past **3** picks the trigger collapses from the label list to
"N selected" (`SUMMARY_THRESHOLD`), and drops back to labels when the count falls to 3 or fewer.

**Selected rows need a colour override under the `blueprint` theme** (`styles/components/_extended-select.scss`).
The library paints a selected option accent-on-contrast — white text on the accent fill — and blueprint
restates that as `tc-theme[name=blueprint] .…__option--selected .…__option-label { color: var(--bp-pink-ink) }`.
Under `multiple` the library deliberately makes the selected row's background **transparent** (the checkbox
carries the state), and blueprint has no `[multiple]` exception, so the white label and description landed on
white paper — invisible, selected-but-unreadable options. The override re-points `__option-label` and
`__option-desc` at `--bs-extended-select-option-color` / `--…-desc-color` for `[multiple]` only, leaving
single-select's white-on-accent row alone. It matters that the partial is `@use`d from
`styles/components/_index.scss`: it sat unimported for a while, so the fix existed in the tree and shipped
nothing — when a style override appears to do nothing, check the index first.

**Degrade, don't crash.** If `multiple` is not in effect — an older `@toolcase/web-components`, a stale Vite
dep cache, a browser tab left open across an upgrade — the element runs in single mode and emits a bare
`string`. Assigning that straight to the state and rendering `value={selected.join(',')}` throws
`selected.join is not a function`, which is a *render* error: it unmounts the whole root and leaves a blank
page, far worse than the field quietly being single-select. `selectedKeys` (event in) and `toKeyList` (render
out) keep both ends total, so a version skew shows up as one-at-a-time picking instead of a white screen.

`el.values` (parsed `string[]`) and `el.value` (raw comma string) exist for imperative access, and a `name`
submits each key as its own `FormData` entry (`fd.getAll(name)`) — neither is needed in the controlled shape
above. Live in `ApiKeyModal` (scopes), `WebhookModal` (events), `EmailComposeModal` / `EmailTriggerModal`
(members).

## tc-* copy

All built-in `tc-*` strings (validation, pagination, select placeholders) come from `configs/toolcaseMessages.ts`, applied once in `main.tsx` via `configureMessages`. English only — the file is the single place to translate them.

## Identity vs capability

`useAuth()` exposes `isOwner` / `isMember` / `isPaid` from server-provided SLOTS (roles are runtime data — the client never learns role names). Use it for IDENTITY (badges). Use `useCan(permission)` for gating ACTIONS. See access-and-feature-flags.md.

## Theme

The tc-* library ships Bootstrap-derived themes; the app is wrapped in `<tc-theme name="blueprint" variant="sunset">` in `Router.tsx`, which is the colour source of truth for the console and the landing alike. Recolouring means changing that wrapper or remapping `--bp-*` tokens on a subtree — see `docs/landing-and-waitlist.md` for how the landing does it. `$brand` in `styles/_abstracts.scss` (also set on `AppBrand.tsx`) is the app-owned focus-ring accent. The console is light-only — neither the tc theme nor `styles/` carries a `prefers-color-scheme` branch, so adding dark mode means adding one (and dropping the `#fff` on `.layout-base`). Design tokens live in `_abstracts.scss`: the 4px spacing scale (`$space-1`…`$space-8`), radii, breakpoints, and the theme-derived console tokens `$line` / `$text-muted` / `$surface` / `$accent`. Per-module styles in `styles/modules/`, per-component in `styles/components/`, each with an `_index.scss` manifest. Layout utilities (`container`, `row`/`col-*`/`g-*`, `d-flex`, `gap-*`, `py-*`, `bg-light`) come from the package stylesheet; `styles/_utilities.scss` supplements only what it lacks (`py-md-7`, `fw-*`, `small`, `lead`, `display-*`, `text-uppercase`, `list-unstyled`, `border`, `rounded-3`, `bg-white`, `min-vh-100`, `font-monospace`). There is no app-owned grid sheet — one existed and its `[class^='col-'] { width: 100% }` rule defeated the package's responsive columns. See *Page rhythm* for the console spacing vocabulary.

## The metric grid, restyled (`styles/components/_metric-grid.scss`)

`tc-metric-grid` is the console's readout — it opens the dashboard, the admin overview, live builds, a
build's detail and a project's admin page. The package renders it as four flat bordered boxes with a
leading icon and a `1.5rem` value, which is the anonymous stat-tile row every dashboard ships. The app
overrides it into one **instrument**: a tinted chassis (`--bp-paper-tint-2`) framing white readout cells
on `1px` seams, values in JetBrains Mono at `clamp(1.9rem, 3.2vw, 2.6rem)` with `tabular-nums` and
`-0.04em` tracking, labels tracked out to `0.16em`, and each cell's icon demoted to a watermark bled off
the bottom-right corner at 7 % opacity so the number is what the eye lands on.

The signature is the **drafting scale** along the top edge: minor ticks every 9 px in muted violet, major
ticks every 45 px in the app accent, drawn as two `repeating-linear-gradient`s on `.tc-metric-grid::before`
over a bezel band created by `padding-top`. It plots itself left-to-right once on load (`mg-plot`, 620 ms,
`clip-path: inset()`), and the animation is dropped under `prefers-reduced-motion`. The theme is named
*blueprint*; this is the one surface that behaves like drafting instrumentation rather than paper.

Two things make this override fiddly, and both are load-bearing:

- **The grid takes two different shapes.** `Dashboard`/`EmailOutbox` set the `items` property and the
  component generates `div.tc-metric-tile` children; `AdminOverview`, `LiveBuilds`, `LiveBuildDetail`,
  `ProjectAdminDetail` and `UserProfileAdmin` slot `<tc-metric-tile>` **elements**, each of which wraps its
  own inner `div.tc-metric-tile`. Styling only the grid's direct children gives the slotted pages a
  box-in-a-box. The sheet therefore neutralises the `tc-metric-tile` wrapper (`display: block`, no padding,
  no border) and puts the cell treatment on `.tc-metric-tile` as a descendant, which is the innermost node
  in both shapes.
- **Specificity.** The package's blueprint theme styles these at
  `tc-theme[name=blueprint] .tc-metric-grid > .tc-metric-tile .tc-metric-tile-value` (0,3,1). The override
  doubles the grid class — `tc-theme[name='blueprint'] .tc-metric-grid.tc-metric-grid` — to clear it. Same
  trap as the usage panel in [access-and-feature-flags.md](access-and-feature-flags.md).

**Verifying it needs a foreground tab.** The plot-in animation is frame-driven, so in a hidden or
automated tab (`document.visibilityState === 'hidden'`) the `clip-path` freezes wherever it started and
the scale renders truncated — it looks exactly like a broken gradient. Bring the tab forward, or set
`animation: none` before judging the rule.

## Failure handling: crashes, offline, network retries

Three separate failure modes, three separate mechanisms.

**A thrown render error no longer blanks the SPA.** `components/ErrorBoundary.tsx` wraps the whole `<Routes>` tree (`RouteErrorBoundary` in `Router.tsx` supplies the reset key and the back action). React requires a class here — `getDerivedStateFromError` / `componentDidCatch` have no hook equivalent — so the class is kept as thin as possible and renders a normal function component (`ErrorFallback`) for the UI, which is what gets to use `useStrings`. The fallback offers *Reload the page*, *Go back*, and a collapsed stack trace.

The important detail is the reset: the boundary takes a `resetKey` (the current pathname) and clears its error in `componentDidUpdate` when that key changes. Without it the fallback would stay on screen after navigating away, because a boundary that has caught never re-renders its children on its own. `componentDidCatch` currently just `console.error`s — if a monitoring port is ever added, that is the one place to report from, and the fallback is where a "report this error" action would go.

**Offline** is `modules/OfflineBanner.tsx`: `navigator.onLine` seeded on mount plus `online` / `offline` window listeners, rendered next to `AlertPanel` in both `MainLayout` and `BaseLayout` so it shows in the dashboard shell and on public pages. It renders nothing while online.

**`apiFetch` retries network failures, never HTTP failures.** A rejected `fetch` (DNS failure, connection refused, offline) is retried; any *response* — 4xx, 5xx — is returned and handled as before, because the server answered and retrying would not change the outcome. Retries are `[300ms, 900ms]`, so a request makes at most three attempts, and exhausting them throws `strings.network.unreachable` rather than a raw `TypeError`.

**Only `GET` and `HEAD` are retried.** A network failure on a mutation is ambiguous — the request may well have reached the server and committed — so auto-retrying a `POST` risks a duplicate charge, invite or row. Mutations fail once and surface the error. A derived project that wants retryable mutations should send the `Idempotency-Key` header the API already understands (`api/src/http/idempotency.ts`) and widen `SAFE_METHODS`.

One testing note: behind the Vite dev proxy a stopped API returns a 5xx *response*, not a network rejection, so stopping the API does not exercise the retry path — stub `window.fetch` to reject instead. Timer-based backoff also can't be measured in a background tab: Chrome clamps `setTimeout` to ~1s when the tab is hidden.

## Command palette (⌘K)

`modules/CommandPalette.tsx` wires `tc-command-palette` to a ⌘K / Ctrl+K binding and renders the trigger
hint in the dashboard navbar (`MainLayout`'s `navbar-right` slot, beside the usage gauge and the
notification bell — see the usage panel in
[access-and-feature-flags.md](access-and-feature-flags.md)). One module
owns both the hint button and the overlay, so there is no cross-component state to plumb — the palette is
just local `open` state.

The shipped command set covers the console — jump to a project, its assets, bundles, builds and configs — and is what you copy
for a real one:

- **Go to** — static routes. `/admin` only appears when the caller holds `admin.overview.read`, so the
  palette never offers a destination the user would be bounced from.
- **Actions** — *New project* (needs `project.write`; when the quota is used up it opens the upgrade modal
  through `useLimitLock` instead of the create modal, exactly like the button on `/projects`), and
  *New task in "<project>"*, which appears **only** on a `/projects/:id` route. That one is the interesting
  case: commands can be contextual to the current route, read straight from `useLocation()`.
- **Projects** — one entry per project, jumping to its detail page. The task count rides along in the
  `shortcut` slot and the description is pushed into `keywords`, so it is searchable without being shown.

Three things to preserve when extending it:

**The search input is re-focused after every `items` assignment.** `tc-command-palette` focuses its input
once, in a `requestAnimationFrame` when `open` flips — but its `items` setter re-renders the whole overlay,
replacing that input node without restoring focus. Opening the palette fetches projects, so the store update
lands right after the focus call and typing goes nowhere until the user clicks the field; arrow keys and
Enter keep working from the document-level handler, so the palette silently acts on the wrong row. The
effect after `useTc` in `CommandPalette.tsx` re-focuses the input whenever `items` changes while open. It is
declared after `useTc` on purpose: effects run in declaration order, so it fires after the props are applied.
It never steals the caret — typing filters through the element's own `_patchList`, which leaves `items` alone.

**`items` must be memoised.** `tc-command-palette` re-renders on every `items` assignment, and `useTc`
re-applies props on every React render — so an unmemoised array would rebuild the overlay (and blow away
the search input the user is typing in) whenever any unrelated store update landed. The `useMemo` deps are
the things that genuinely change the command set: projects, the current project, and the permission flags.
See `known-problems/filter-input-loses-focus.md` for the general rule.

**It is a controlled component.** It does not self-close: `onClose` must set `open` to `false`, or Escape
and backdrop clicks appear to do nothing. Selecting an item fires `tc-select` *and then* `tc-close`.

**The overlay is portalled out of the navbar.** The hint button lives in the navbar slot, but the palette
itself is rendered through `createPortal` into the `tc-theme` element. It has to be: the palette's backdrop
is `position: fixed; inset: 0`, and `tc-dashboard-layout`'s navbar sets `backdrop-filter: blur(8px)` — a
non-`none` `backdrop-filter` makes an element a **containing block for fixed-position descendants**, so a
backdrop rendered inside the navbar resolves `inset: 0` against the 80px navbar strip instead of the
viewport and only dims that band. No CSS override can fix it; nothing escapes a containing block, so the
element has to move in the DOM. The portal target is `tc-theme` rather than `document.body` so the palette
stays inside the theme scope and keeps its custom properties.

The same trap applies to any fixed-position overlay mounted inside the dashboard chrome. If a new one only
dims part of the screen, walk its ancestors for `transform`, `filter`, `backdrop-filter`, `perspective`,
`contain` or `will-change` before touching its CSS.

The modifier symbol is picked once at module scope (`⌘` on Mac, `Ctrl` elsewhere) and shown in the hint via
`tc-kbd`, so the affordance matches the platform the user is actually on.


## `lib/tc.ts` — the custom-element wrapper layer

Console UI is built from typed React wrappers in `lib/tc.ts` (`TcActionHeader`, `TcGroup`, `TcFile`,
`TcAssetBundle`, `TcBuild`, `TcVerticalItemList`, `TcJSONEditor`, `TcJSONSchemaDef`, …) rather than
raw `tc-*` elements. The wrapper assigns every element-specific value as a **property** (not an
attribute), bridges `CustomEvent`s to `onX` callback props, and projects composed children into the
right slot. Render `<TcFile … />`, not `<tc-file>` with a ref.

Five rules the wrapper exists to enforce, and which still bite anything rendered outside it:

1. **JS list properties are named per component** — `tc-stepper.steps`, `tc-card-options.options`,
   `tc-badge-row.badges` (items carry `label`, not `key`), `tc-tag-input.recommendations`,
   `tc-icon-picker.icons` (kebab-case lucide names), `tc-state-machine.states` (items carry
   `status`), `tc-extended-select.items`. A wrong name renders an empty component with no error.
2. **Never conditionally mount a slotted child.** Custom elements relocate slotted nodes, so React
   loses track and throws `NotFoundError: insertBefore`. Render every slotted element (modal footer
   buttons especially) and toggle `hidden` instead.
3. **Several elements capture their children once and move them into an internal pane** —
   `tc-vertical-item-list` in `connectedCallback`, `tc-modal` and `tc-group` on every render of their
   observed attributes. A child that mounts later lands outside that pane and is destroyed by the next
   rebuild. `lib/tc.ts` therefore always renders one stable `display: contents` wrapper for unslotted
   children, even when there are none — see
   [known-problems/tc-elements-rebuild-their-children.md](known-problems/tc-elements-rebuild-their-children.md).
4. **Bind custom events, not callback properties.** `tc-action-row-list` dispatches
   `tc-action-click` on its row button and never calls `onActionClick`; it has no row-click event at
   all. `hooks/useTcEvent.ts` attaches the listener to the element ref. The same applies to
   `tc-tag-input`, which has **no `onChange` property** — only a `tc-change` event. And an inline array
   in a `useTc` props object is re-assigned every render, which resets the element's internal state:
   hoist or `useMemo` it. Both traps are written up in
   [known-problems/usetc-property-assignment.md](known-problems/usetc-property-assignment.md).
5. **A disabled `tc-button` still fires its React `onClick`.** The package sets `pointer-events: none`
   on the inner `.btn.disabled`, so the click lands on the host instead and React's handler on the host
   runs — disabled wizard steps advanced, and a saving button could be clicked twice. `styles/app.scss`
   puts `pointer-events: none` on the host for `[disabled]` and `[loading]`.

Registration happens once, in `main.tsx` (`register()` plus the package stylesheet). `lib/tc.ts`
deliberately does not register again — a second call reloads the package's own theme over the app's.

## Project screens

Each project screen is its own route and page — `/projects/:id/{assets,bundles,builds,configs,members,settings}` —
not tabs on one detail page. Where a single screen genuinely has several independent forms, those become
routed sub-tabs rather than sections stacked down the page: Settings is `/settings`, `/settings/categories-and-tags`
and `/settings/danger` via a `:tab` param and `RouteTabs`, so each form is linkable and the danger zone is
not something you scroll past. Every page is the same shape: `usePageContext` sets the title and
description, `AuthGuard secured` wraps it, and `components/ProjectPageShell.tsx` resolves the project
from the route, syncs `activeProjectId`, and renders — in order — the lock banner, `ProjectHeader`,
`ProjectPipeline`, then `.console-section` around a single list module (`FileList`, `BundleList`,
`BuildList`, `ConfigEditor`/`SchemaEditor`).

**`ProjectPipeline` fetches the slices it counts.** It shows Assets / Bundles / Builds / Live on every
project screen, but those counts come from the `bundles` and `builds` slices, which only the matching page
would otherwise load — so the strip read `Bundles 0 · Builds 0 · Live 0` on the Assets page of a project
that had both. It now calls `fetchBundles` and `fetchBuilds` on `project.id`, unconditionally rather than on
the `*Loaded` flags, because those flags are global and would keep the previous project's numbers after a
switch. Assets prefer `assets.length` and fall back to `project.assetCount`, since the project row is not
refetched after an upload.

**Each station reports state, not just a count.** A stage is a card — lucide icon tile (the same `image` /
`package` / `hammer` glyphs the sidebar uses for those routes, plus `radio` for Live), a mono uppercase
label, the count as a large tabular-mono number, and one honest detail line derived from data already
loaded: `N untagged` / `All tagged` for assets (only when the assets slice is loaded — otherwise the line is
omitted rather than guessed), `N never built` for bundles with `buildCount === 0`, `N builds running` →
`N failed` → `All passed` for builds, and for Live the actual **build tags** (`release`, `beta`) as teal
chips, because the tag is what is shipped, not the count. A coral pulse dot appears beside *Builds* only
while a build is queued or running.

**The connector encodes flow, not decoration.** Between two stations sits a chevron that is teal when the
downstream stage has content and faint grey when it does not, so a project with assets but no bundles shows
where the line stops feeding. The strip's current-stage accent is `--tc-app-accent` (coral), matching
`RouteTabs` and the sidebar rather than the violet `--tc-primary` used for project identity. Stations wrap
two-up below `$bp-lg` and one-up below `$bp-sm`, dropping the chevrons; the pulse respects
`prefers-reduced-motion`.

`ProjectPageShell` takes `title`, `subline?(project)`, `action?(project)`, `pipeline?` (default
`true`) and `children(project)`:

- **`subline`** is the screen's live state as data, not prose — counts wrapped in `<strong>` so they
  read as numbers (`12 assets · 4 tagged`).
- **`action`** is the ONE primary action for that screen, and it lives in the page header rather
  than in the module below it. Derive its permission from the `project` argument
  (`project.permissions.includes('bundle.write')`), NOT from a page-level `useProjectCan` — that
  hook reads the active project, which has not synced yet on first render of a deep link.
  Shipped: Assets none (upload is the strip), Bundles *Create bundle*, Builds *Purge N untagged*
  (quiet `danger outline`, only when there are untagged builds), Configs *New config* / *New schema*
  following the active tab, Members *Invite*.
- **`pipeline={false}`** for screens that are not stages of the asset→build flow (Members, Settings).

Because the header owns the primary action, modules must NOT repeat it. A module's own card action is for
actions scoped to that card's content (compose, add a trigger, revert the selected config) — never for
"new X" on a screen whose page header already offers it.

The dashboard's onboarding guide opens the project wizard in place for the *Create your first project* step (rather than routing to `/projects` and letting the redirect land on the onboarding screen); the *Upload your first asset* step still routes.

## Page rhythm

`styles/modules/_console.scss` is the single spacing sheet for the console, built on the 4px scale in
`_abstracts.scss` (`$space-1`…`$space-8`; the old `$space-xs`/`sm`/`md`/`lg` names remain as aliases
for modules that have not migrated). The classes there are the vocabulary — reach for one before
adding a margin to a module:

| Class | Job |
| --- | --- |
| `.project-page` / `.console-page` | Page measure: column, `$space-5` between sections, `max-width: 72rem`, centred. Every full-page screen uses one of these — project screens the former, everything else (dashboard, admin, profile, billing, email, moderation, invoices, enquiries, realms) the latter. There is no `.container > .row > .col-12` left in `pages/`. |
| `.console-section` | The content column under the header, `$space-3` gap. |
| `.console-stack` | A run of `tc-group` cards, `$space-2` gap, each with its own border so consecutive groups do not merge. |
| `.console-empty` | Empty state: title + body + action, dashed edge. |
| `.console-hint` | Muted helper line under a control. |
| `.upload-strip` | Compacts `tc-file-dropzone` into a row that sits UNDER the list — browsing is the default state, uploading is an action. |
| `.member-remove` | The rare destructive row on Members: captioned, ruled off, small. |

`tc-group[data-empty='true']` mutes an empty group's label and count so it stays addressable without
competing with a group that has content.

Colours in module styles come from the theme tokens in `_abstracts.scss` (`$line`, `$text-muted`,
`$surface`, `$accent`), which resolve through `var(--tc-*)`. Do not hard-code hex greys in
`styles/modules/` — a retint then misses them.

**Never pad the host of a `tc-*` element that paints its own card.** `tc-panel` renders
`div.tc-panel` (the bordered, filled surface) wrapping `div.tc-panel-body` (which already carries the
inner padding). Padding applied to the `tc-panel` *host* therefore sits OUTSIDE the visible card and
insets it inside its grid track — the card silently stops lining up with everything else in the column,
which is how the dashboard's *Recent projects* / *Recent activity* ended up 16 px narrower than the page
header and the metric grid above them. The same shape applies to `tc-section-card`, `tc-group` and
`tc-metric-tile`: style the painted inner node, leave the host alone.

The companion trap is that a host class's **layout** declarations are usually inert for the same reason.
After upgrade the host has exactly one child (the painted div), so `display: flex` + `gap` on it spaces
nothing — the dashboard panel's `gap: $space-2` was dead from the day it was written, and the panel head
sat flush against its body. If you want to space slotted content, target the node it actually lands in
(`.tc-panel-body`), not the element you wrote in JSX.
