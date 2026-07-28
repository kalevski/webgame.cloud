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

`MainLayout` = the `tc-dashboard-layout` shell (brand, `SidebarMenu`, `UserPanel`, `PageHeader`, `NotificationsBell`, `AlertPanel`). `BaseLayout` = chrome-free (login, legal). Both are HOCs.

**Three navigation surfaces, one rule.** `SidebarMenu` (Project / Workspace / Platform sections), the `UserPanel` avatar menu (Profile, Billing, Admin, Moderation), and the ⌘K palette's *Go to* group each list routes, and each gates them on the same `useCan` / `useFeature` checks. When you add a route, add it to all three or deliberately decide not to: a route that exists in one surface and not the others is how the palette ended up missing half the app.

**Admin and Moderation are deliberately not in the sidebar.** They are staff destinations rather than everyday workspace ones, so they are reached from the `UserPanel` avatar menu and the ⌘K palette only. The sidebar carries Project, Workspace and Platform. If you re-add an Administration section, add it to all three surfaces and update this paragraph.

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
hint in the dashboard navbar (`MainLayout`'s `navbar-right` slot, beside the notification bell). One module
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
not tabs on one detail page. Every page is the same shape: `usePageContext` sets the title and
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

Because the header owns the primary action, modules must NOT repeat it. A module's own
`tc-action-header` is for actions scoped to the current selection (save, revert, delete the selected
config) — never for "new X".

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
