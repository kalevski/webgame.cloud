# Frontend architecture

The web app follows the `react-spa-app` skill. Read that skill for the full contract; this is the app-specific map.

## Layering (never skip a layer)

```
pages → modules → components / state (slices) → services → helpers/api (apiFetch)
```

- **pages** (`pages/*.tsx`) wrap one module in a layout HOC (`wrapInMainLayout` / `wrapInBaseLayout`) + `AuthGuard` (+ optional `permission`) and set the page title/description via `usePageContext`.
- **modules** (`modules/*.tsx`) are feature screens; they read the store and open modals.
- **components** (`components/*.tsx`) are reusable, store-agnostic (`AdvancedTable`, `PageToolbar`, `RouteTabs`, `LimitMeter`, `LockChip`, `LockedAction`, `UpgradeNudge`, `Loading`, `Icon`).
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

`modals/keys.ts` holds the `MODAL` key map (its own file so the component-bearing registry stays a clean Fast Refresh boundary); `modals/registry.tsx` holds the context/hooks (`useModalOpen`, `useModalClose`, `useModalInput`, `ModalWindow`); `modals/index.tsx` (`ModalRender`) mounts each modal once. Add a key + a `<ModalWindow>`. Modal bodies stay mounted while hidden and reset on open.

**`ModalWindow` restores focus to the opener.** It captures `document.activeElement` when the modal opens and re-focuses it on close (falling back to a `blur()` if the opener has since unmounted). Without this, `tc-modal` sets `aria-hidden` on a subtree that still holds focus — Chrome logs *"Blocked aria-hidden on an element because its descendant retained focus"* and, more practically, focus falls back to `<body>`, so the next Tab restarts from the top of the page instead of returning to the button that opened the dialog. Keep this if you swap the modal component.

**Escape closes one layer at a time.** `tc-modal` and `tc-extended-select` both listen for Escape on `document` in the bubble phase, and only the modal consults the overlay stack — so with a select menu open inside a modal, both handlers fire and Escape discards the whole form the user was half-way through filling in. `ModalWindow` adds a capture-phase Escape listener that, when the open modal contains an expanded `.tc-extended-select__menu--open`, stops propagation and dispatches a `mousedown` on `document` — the select's own outside-click handler closes just the menu. A second Escape then closes the modal, and a modal with no open menu is untouched. Drop this once the library gives dropdowns a place on the overlay stack.

## Dates

Never call `toLocaleDateString()` / `toLocaleString()` inline. `helpers/dates.ts` exposes `formatDate` (e.g. *Jul 27, 2026*) and `formatDateTime`, both null-safe with an em-dash fallback. One place to change the convention, and no drift between screens — which is how the app ended up mixing `7/26/2026` with `1 min ago`. Relative "x min ago" labels for very recent items stay local to the module that needs them (`Dashboard`, `NotificationsBell`).

## Layouts

`MainLayout` = the `tc-dashboard-layout` shell (brand, `SidebarMenu`, `UserPanel`, `PageHeader`, `NotificationsBell`, `AlertPanel`). `BaseLayout` = chrome-free (login, legal). Both are HOCs.

**Three navigation surfaces, one rule.** `SidebarMenu` (Workspace / Platform sections), the `UserPanel` avatar menu (Profile, Billing, Admin, Moderation), and the ⌘K palette's *Go to* group each list routes, and each gates them on the same `useCan` / `useFeature` checks. When you add a route, add it to all three or deliberately decide not to: a route that exists in one surface and not the others is how the palette ended up missing half the app.

**Admin and Moderation are deliberately not in the sidebar.** They are staff destinations rather than everyday workspace ones, so they are reached from the `UserPanel` avatar menu and the ⌘K palette only. The sidebar carries just Workspace and Platform. If you re-add an Administration section, add it to all three surfaces and update this paragraph.

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

The tc-* library ships Bootstrap-derived themes; the app uses `sunshine` retinted to a violet-on-neutral palette. Because sunshine sets `--bs-primary: var(--sun-lead)`, overriding the `--sun-*` tokens in `styles/app.scss` recolours buttons, links, badges and focus in one move. The single accent colour is `$brand` in `styles/_abstracts.scss` (also set on `AppBrand.tsx`). Light + system-dark are supported via `prefers-color-scheme`. Design tokens (`$space-*`, radii, breakpoints) live in `_abstracts.scss`; per-module styles in `styles/modules/`, per-component in `styles/components/`, each with an `_index.scss` manifest.

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

The shipped command set is deliberately scoped to the projects/tasks worked example, and is what you copy
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
