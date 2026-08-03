---
name: mobile-first-app
description: Phone-first UI shape for any web app built on @toolcase/web-components — the `tc-mobile-shell` frame, `tc-app-bar`, `tc-tab-dock`, `tc-bottom-sheet`, `tc-action-bar`, `tc-fab`, `tc-page-tabs`. Covers the one-shell frame contract, the route-declares-chrome / page-declares-content split, sheets as the only transient surface, the capability-driven dock, the list-screen shape, mobile-first SCSS (`up()` only, never `down()`), safe-area/touch/viewport rules, and the React-19 ↔ custom-element traps (boolean props, re-parenting children, focus-safe prop assignment). TRIGGER on either condition, whatever the product is (commerce, admin, social, booking, dashboards — the skill is domain-agnostic): (1) **a surface has to work on a phone** — "make this work on mobile", a responsive or phone-sized screen, a bottom sheet, an app bar, a bottom nav/dock, a FAB, a sticky action bar, safe-area/notch/keyboard insets, or a desktop layout being grown from a phone one; or (2) **the code already carries the mobile shell** — the file or project contains `tc-mobile-shell`, `tc-app-bar`, `tc-tab-dock`, `tc-bottom-sheet`, `tc-fab`, `tc-action-bar` or `tc-page-tabs`, in which case its contracts bind even for an unrelated edit. Applies even when `@toolcase/web-components` is not named. For generic SPA layering (pages → modules → services → state) use the project's SPA skill (`web-patterns` in this repo); for the raw element API surface use `web-components`.
---

# Mobile-first apps with @toolcase/web-components

A phone app is not a shrunk desktop app. It is **one frame** that owns the viewport, **one
scroller** inside it, and **one transient surface** (the sheet). Everything below follows
from those three facts.

**Scope.** These rules are about *shape*, not about any one product. Nothing here assumes a
domain — the same frame, dock, sheet and list contracts hold for a storefront, an admin
console, a booking flow or a feed. Substitute your own entities wherever an example names one.

**Two ways in, and they want different things:**

- **Greenfield phone surface** — build the frame first (`references/frame-scaffold.md`), then
  pages. Authoring order matters: the shell has to exist above the router before any page can
  portal chrome into it.
- **An existing codebase that already has a shell** — the contracts below are already load-
  bearing, and most of them fail *silently* when broken (a second unslotted child, a sheet
  rendered inside the pane, `x || undefined` on a boolean). Read the frame before editing a
  page inside it.
- **A desktop-first app growing a phone surface** — do not retrofit `down()` queries onto the
  desktop stylesheet. Author the new surface at 390px in its own namespace and let the two
  scales coexist (see *The authoring rule*). A codebase whose existing components use
  `down()` is not disqualified from adding a mobile shell; it just must not mix directions
  inside one rule.

Companion skills: **`web-patterns`** (this repo's SPA layering — pages → modules → slices →
services; other projects may name it `react-spa-app`) and **`web-components`** (the full `tc-*`
API surface). This skill is the **mobile shape** layer on top of both: it says nothing about
where state lives or what an element's attributes are, only about the shape a phone surface
has to hold.

## The authoring rule

**Write the 390px layout with no media query. Add `@media (min-width: …)` only to widen
it.** Never author a desktop layout and carve out a phone with `max-width`.

```scss
@mixin up($bp)   { @media (min-width: $bp) { @content } }        // the only direction
@mixin down($bp) { @media (max-width: #{$bp - 0.02px}) { @content } }  // legacy, do not add
```

Why it is not taste: a media query adds **no specificity**. A `down()` carve-out placed
above an unconditional rule for the same property loses on source order and dies silently.
`up()` blocks always come after the base rule, so they always win. Mixing the two directions
in one codebase guarantees rules that disagree.

Two spacing scales may coexist (a phone one, a legacy desktop one) — keep them in **separate
namespaces** (`$m-*` vs `$space-*`) so a half-migrated rule is visible on sight. Never invent
a third column cap: one content cap and one prose cap, both in the abstracts file.

Density comes from spacing, never from shrinking type.

## The frame: ONE shell, five regions, mounted once

```
<tc-mobile-shell desktop edge="both" pane-bg="#fbf3e2" data-key={pathname}>
  <tc-app-bar slot="header" …/>        header  — chrome, may repeat (bar + band)
  <div slot="header" class="band"/>    header  — a page's fixed strip (search row)
  <div class="pane">{outlet}</div>     THE one unslotted child = the only scroller
  <div slot="action"/>                 sticky bottom action region
  <div slot="overlay">…</div>          sheets, toasts, FAB  (before dock in DOM)
  <tc-tab-dock slot="dock"/>           bottom nav (left rail at ≥992px)
</tc-mobile-shell>
```

- **Mounted ONCE, above the router outlet** — in the layout the router renders, never per
  page. The shell banks each route's `scrollTop` per `data-key` at module scope —
  per-route scroll restoration survives the pane's *contents* being replaced but not the
  *shell* being re-created. A layout component per page re-creates it on every navigation.
- **Exactly one unslotted child.** The shell resolves the scroller as "the direct child with
  no `slot`". A second unslotted child is a second pane.
- `100dvh`, `overflow: hidden`, `env(safe-area-inset-*)`-aware. Do **not** set
  `overflow: hidden` on `html`/`body` — nothing inside the shell can grow the document, and
  that rule is the classic cause of print truncation.
- **The overlay layer is authored BEFORE the dock in the DOM.** `[slot="overlay"]` is
  `position: absolute; z-index: 1`, so it paints above the in-flow dock wherever it sits —
  which frees its DOM position to serve **focus order**. With the overlay last, a keyboard
  user reaches the dock's tabs before the FAB floating above them.
- A page that must draw edge to edge declares a **canvas** in the route map: the pane and the
  hardware-inset strips take that colour and the pane drops its gutter. Set the pane colour
  through the element's **`pane-bg` attribute**, not an inline `--bs-mobile-shell-bg` — the
  element owns that property and calls `style.removeProperty` on it whenever the attribute is
  absent, wiping a framework-written value on connect.

`index.html` carries two load-bearing lines: `viewport-fit=cover` (without it every
`env(safe-area-inset-*)` reads `0px`, **on hardware only**), and the canvas colour inlined on
`html` so first paint is not UA white. No `maximum-scale`/`user-scalable=no` (WCAG 1.4.4) —
iOS zoom-on-focus is answered by a 16px input floor.

## Chrome is declared, never rendered by a page

Three separate owners, and keeping them separate is what keeps N screens consistent:

| What | Who owns it | How it travels |
|---|---|---|
| Which app bar, dock on/off, canvas, insets | the **route** | a static route→chrome map (one config module) |
| Title, subtitle, tab rail | the **page**, as **data** | provider state (a page context) |
| Action bar, FAB, band, bar overflow, sheets | the **page**, as **content** | `createPortal` into a host the frame registers |

**The data/content split is not cosmetic.** A React element is a new object on every render,
so children held in provider state would re-render the app bar, the dock and the sheet layer
on **every keystroke of every form** on the page. A portal costs nothing: the children
re-render inside the page's own subtree and merely land in the frame's DOM.

The tab rail stays data only because the hook diffs the spec **by value** (a `fingerprint()`
string) before writing it — callers rebuild their `tabs` array each render.

Consequences to keep:
- No page renders its own bar, rail, action bar or FAB. A page cannot disagree with the route
  map about whether it has a back chevron.
- Every host div is **always mounted** (so the target exists before the page that fills it
  renders) and hidden by `:empty` (or the shell paints a bare strip of surface).
- Register hosts with a **stable callback ref** (`useCallback`), or React calls the old ref
  with `null` and the new one with the element on every frame render — two provider writes
  per render, each re-rendering every context reader.

Copy-pasteable scaffold (frame, provider, the four portal components, the SCSS):
**`references/frame-scaffold.md`**.

## Navigation is a model, not components

Declare destinations in one config: `{ id, label, tabLabel, icon, path, section, requires:
Permission[], rank, order, badge }`.

- **`rank`** decides who keeps a dock seat (the four lowest-ranked the account qualifies for);
  **`order`** decides left-to-right. One weight cannot express both: two accounts with
  different capabilities qualify for different four-tab sets, yet a destination both of them
  keep must land in the same place for each.
- **Gate on capabilities, never role names.** Roles are runtime rows; a dock keyed on role ids
  is blind to every role created after the file was written. Grant a capability and the dock
  reshapes; revoke it and the tab is *gone*, not disabled.
- Everything that did not win a seat lives in a **"More" sheet**, so every route stays
  reachable for every account. The fifth dock slot is always "More".
- Give the model a pure resolver layer (pure functions over the model) and one hook that binds
  it to the store. Include a **`backOrRoot`** helper: read the router's `history.state.idx` so a cold
  deep link falls back to the tab root instead of dead-ending. Never a bare `navigate(-1)`.
- The dock's third gesture is worth wiring: re-tapping the **active** tab
  (`tc-tab-dock-reselect`) scrolls the pane to top, and re-tapping an already-topped pane pops
  to the tab's root.
- Tabs within a screen are **routes, not state** — `tc-page-tabs` with an `href` per tab, the
  active id derived from the URL. Deep-linkable, refresh-proof, back-button-steppable. Retiring
  a tab needs an explicit redirect for its old path, or the dead link silently renders the
  default tab as if nothing moved.

## Every transient surface is a `tc-bottom-sheet`

One registry, one element, one place that says so. On the desktop layout the same element
renders as a centred dialog — that is CSS, not a second modal system. Do not mix in
`tc-modal`.

- **Presentation is a prop of the registry wrapper**, not of each body: content-height by
  default (≤4 fields, or a question), a snap list for an always-tall read-only detail, and a
  "full" presentation (full height, back chevron instead of the grab handle, pinned action row)
  for a long form, long list or wizard.
- **A sheet body renders exactly ONE unslotted element** (the scroller) plus an optional
  `<div slot="footer">`. The element re-parents nothing, so a second unslotted child is a second
  body region — and a *conditional* direct child is a body region that arrives late.
  Render the wrapper unconditionally and hide it, or nest the conditional one level down.
- **A sheet body scrolls; its blocks must not squash.** The library lays the body out as a flex
  column and a flex item's default `flex-shrink` is 1 — tall content shrinks every block instead
  of scrolling. Set `tc-bottom-sheet > :not([slot]) > * { flex-shrink: 0 }` once, structurally.
  A block wanting its own scroll caps itself (`max-height: 40vh; overflow-y: auto`).
- **A sheet rendered inside the pane cannot lock the pane.** The element picks its scroll lock
  by where it sits: inside the shell but *outside* the pane → it sets the pane's `overflow-y`
  (`lockTarget === 'pane'`, the whole job, since the document never scrolls inside a shell);
  inside the pane → it falls back to pinning `<body>`, and pinning a body that was never
  scrollable does nothing. `blur-behind` is skipped too — nothing can blur its own ancestor.
  **Every page sheet portals into the frame's `[slot="overlay"]`.** Read back `lockTarget` to
  verify; it exists because "why is the page still scrolling" is otherwise unanswerable.
- **A sheet is not a route.** A route per sheet puts every modal key in the URL space, makes each
  a shareable link that must render standalone, and turns "open the filters" into a counted page
  view. Instead push **one duplicate history entry** so the OS back gesture closes the sheet:

  | Situation | Call |
  |---|---|
  | Sheet closes normally | cleanup pops its own entry |
  | Sheet **navigates** (`replace`) | `consume()` first — the destination overwrote the entry; popping it would undo the navigation one frame later |
  | Sheet's **closer** navigates (callback runs synchronously in the click handler, ahead of the cleanup) | `release(after)` — pop first, run the callback on the guaranteed `popstate` |
  | A **stacked** sheet navigates | `releaseAllSheets(after)` — one `history.go(-n)` fires exactly one `popstate`; entries under it are live and their owners are about to unmount |

  Use **one window `popstate` listener plus a stack**, never a listener per sheet: `popstate` is
  a window event, so per-sheet listeners close the whole stack at once. Mark self-issued
  `history.back()` calls so the sheet underneath does not read them as a user gesture.
- **A full-screen MODE is a route, though.** A step-by-step wizard, a scanner, a reader, a
  media viewer: it owns the viewport for a long time, the back gesture has to leave it, and a
  reload must return to where it was (`?step=`). Its step changes **replace** — a pushed entry
  per step redefines back as "previous step". Read the position out of the URL once as the
  initial value; after that the element owns it and the URL mirrors it.
- Mount the registry once in the frame, and **gate the body's mount on `open`** with a ~320ms
  grace so the exit transition still has something to animate. Unconditional `{children}` across
  ~50 closed sheets is thousands of DOM nodes on every screen, all re-rendering on every store
  change.

## The list screen has one shape

Every list surface, at every width, in this order:

**app bar (title + overflow) → tab rail (inside the bar) → fixed band (search + "Filters") →
count row / quota meter → one card column → `tc-load-more` → FAB.**

Desktop changes the geometry (wider pane, multi-column grids), never the order.

- The **band is fixed, outside the scroller** (a second `[slot="header"]` sibling — *not*
  `tc-app-bar`'s `below` slot, which is for chrome inside the bar's own background, i.e. the
  rail). A search field that scrolls away is a field you must scroll back to.
- The search field is **uncontrolled** (`defaultValue` + change handler). Re-seeding a
  `tc-form-input` mid-typing rebuilds its inner control and drops the caret.
- **Creation is the FAB**; rare screen-level actions go behind the bar's overflow. Never a FAB
  and an action bar on the same screen — two primary actions in one corner.
- **The pane pays for the FAB**: at `offset: 104px` it covers the last card, so the page adds
  `offset + 56 + 16` of bottom padding. The FAB has no idea what is under it.
- **Paged append, never windowing.** A virtualised list restores a pixel offset into content
  that has not rendered and puts the list out of reach of find-in-page. Measured on a shipped
  consumer of this library: 414 cards scrolled at 120fps with a 10.4ms worst frame, so the
  windowing is buying nothing at realistic list sizes. `content-visibility: auto` was rejected
  in the same pass — it shrank the scroll height 27%, i.e. lied to the scrollbar and every
  stored offset.
- **Filters live in one shared sheet, applied filters live in the URL.** A schema per surface
  (a small closed set of field kinds), short comma-joined query keys — never a base64 JSON blob
  — validated on read so a stale URL degrades to "off". The sheet edits a **draft**; apply
  commits with `replace` (and `consume()`s the sheet's history entry, so back leaves the
  filtered list instead of re-opening the sheet). Free-text search stays on-page: a URL that
  changes per keystroke is neither shareable nor navigable.
- Two channels for messages, and picking the wrong one is the easiest mistake to make:
  **something just happened** → a toast in the overlay layer (one mounted layer, dedupe on the
  message, errors never auto-dismiss); **a standing condition of this screen** → an in-flow
  `tc-notice`. A failure never goes into the page.

## Desktop is one attribute plus column discipline

Set `desktop` on the shell **unconditionally** (per-route opt-outs mean the frame jumping
between two shapes on navigation). Below 992px it is inert. From 992px the library widens the
frame, turns the dock into a left rail, renders overlay sheets as centred dialogs and drops the
FAB's offset — all CSS, no second DOM.

The **app's** half is the column: grow the pane's inline padding until content caps at the
content max, and make the band and app bar derive from the same arithmetic so their controls
align with the cards. Prose/forms/single-column surfaces cap tighter (~720px).

```scss
@include up($bp-lg) {
    .pane { padding-inline: max(8px, calc((100% - #{$desktop-content-max}) / 2)) }
}
```

`--bs-mobile-shell-*` overrides go **on the element**, never at `:root` — the component
declares its defaults on the `tc-mobile-shell` type selector, which beats an inherited value.
(`--tc-safe-top`/`--tc-safe-bottom` are the opposite: the shell only reads them, so `:root` is
where you fake or zero them — which is the only way to test safe-area behaviour at all, since
`env(safe-area-inset-*)` reads `0px` in every desktop browser and cannot be synthesised by
Playwright or device mode.)

## Touch, a11y, and the numbers that are fiction

- **A hit-box measured without `pointer: coarse` is fiction.** Every touch floor sits behind
  that query. Assert `matchMedia('(pointer: coarse)').matches` before believing a measurement.
  Second trap: `document.elementFromPoint` is viewport-relative and returns `null` outside it,
  so an off-screen element measures as its drawn box.
- **Touch floors belong in the component library, at the specificity that wins** — not in an
  app-side patch block. A blanket `button, a[role=button]` floor is wrong: it inflates every
  micro-control (chart segments, rating stars, colour swatches, calendar cells). If one control
  is under 44px, floor *that* control.
- **Grow the hit box, not the drawn box**, where the design fixes a row's height: a centred
  transparent `::after`. It does not work inside a scroller — `overflow-x: auto` forces
  `overflow-y: auto` and hit-testing respects the clip.
- **Chrome that must not clip is sized in `rem`, content stays px.** A 1.3× page font squeezes a
  13px label into a box built for 10px when the padding is px. `rem`, not `em` — the dock sets
  its own font-size.
- Contrast is measured off **composited pixels**, never derived from a token: the background of a
  text node is the ancestor chain walked up through every semi-transparent layer to the first
  opaque one. Automated scanners cannot resolve backgrounds through a shell's stacked panes —
  treat them as a floor that measured nothing about colour.
- `role="button"` on a card that contains a button is `nested-interactive`. A card with its own
  controls gets a click-only surface (no role, no tab stop) and its real button carries the
  keyboard path. **No action may be available only by pointer or gesture.**
- Page titles need a real `<h1>`. An app bar renders one only when asked (`heading-level="1"`) —
  the bar does not assume it, because on most screens the page's real heading is in the pane.

## React ↔ custom element: the traps that cost the most

Full detail, with the focus-safe prop-assignment hook to copy: **`references/react-integration.md`**.
The four that take down a route:

1. **Boolean props: pass explicit `true`/`false`, or omit — never `x || undefined`.** These
   elements implement booleans as `set foo(v) { this.toggleAttribute('foo', v) }`, and
   `toggleAttribute(name, undefined)` **toggles**. A closing sheet handed `open={undefined}`
   re-opens. And `dismissible="false"` in JSX reaches the setter as the truthy **string**
   `"false"`.
2. **Elements that re-parent their children throw `NotFoundError: removeChild`** the first time
   React deletes one child individually — the error lands inside the commit and unmounts the tree
   to a blank screen with no boundary to catch it. Both shapes ship easily:
   `{label}{n > 0 ? ` (${n})` : ''}` (React treats `''` as *no child*, so the second text node is
   deleted) and `{cond && <p/>}` among several children. Fix: interpolate into one string, or
   wrap everything in one stable element and keep the conditionals inside it.
3. **Never reassign instance props on every render.** Each assignment makes the element re-render
   its DOM and destroys the focused `<input>` mid-typing. Assign only changed values and wrap
   function props in a stable proxy that calls the latest closure.
4. **Field errors go through a `validate` function**, never an `error` attribute — flipping an
   observed attribute runs `attributeChangedCallback`, which rebuilds `innerHTML`. Compute from
   the value the validator receives, not from React state (state is one keystroke behind inside a
   synchronous `input` handler).

Also: a `focus()` during React's commit is reverted by react-dom's selection restoration (defer
by a microtask); React never renders `autoFocus` as an attribute (use `data-autofocus`); and
`slot="header"`/`slot="dock"` must be set on the **element the component returns**, since a React
component contributes no DOM node of its own.

## Element map

Which `tc-*` element does which job, with the attributes that matter and the events to listen
for: **`references/mobile-elements.md`**. The mobile vocabulary is `tc-mobile-shell`,
`tc-app-bar`, `tc-page-tabs`, `tc-tab-dock`, `tc-bottom-sheet`, `tc-action-bar`, `tc-fab`,
`tc-check-row`, `tc-list-section`, `tc-stat-tile`, `tc-macro-grid`, `tc-quota-meter`,
`tc-day-strip`, `tc-taxonomy-card`, `tc-load-more`, `tc-step-pager`, `tc-swipe-pager`,
`tc-add-slot`, `tc-notice`. `tc-dashboard-layout` and `tc-modal` are the desktop-era elements —
a phone-first app uses neither.

## Performance notes worth not re-deriving

- Registering the whole library plus all themes is ~517KB gz of JS and ~351KB gz of CSS —
  still one entry point and one stylesheet as of 5.0.20. That dominates any app-side splitting;
  the fixes (per-element registration, per-theme CSS entry) live in the library. Budget
  accordingly rather than chasing app chunks.
- **Preload fonts from the entry module.** Fonts named inside a large stylesheet cannot be
  requested until that CSS parses — i.e. after first paint on a slow connection. In one measured
  app that single swap accounted for 0.178 of a 0.182 CLS.
- Lazy-load admin-ish routes; keep member-facing routes in the entry chunk if a service worker
  precaches only what it parses out of `index.html` — a lazy member page breaks offline.
- Bundle all sheet bodies into **one** lazy chunk, not one per sheet: one request, one asset to
  prefetch, one asset to reason about offline. Wrap each so that once the chunk has evaluated,
  the body renders synchronously — `React.lazy` suspends on its first render even when the module
  is already resolved, costing a second layout+paint of a full-height panel.

## Library version and the gaps still open

Contracts here are verified against **`@toolcase/web-components` 5.0.20**, which is the first
version carrying the desktop pass — `tc-mobile-shell[desktop]`, the dock-as-left-rail, the
sheet-as-centred-dialog, the action-bar column cap and the FAB's reduced desktop offset all
ship in it. On an older version the `desktop` attribute is inert and the *Desktop is one
attribute* section does not apply.

Fixed in 5.0.20, worth knowing because the workaround is now wrong: **`tc-macro-grid` accepts
`columns="3"` as a string.** react-dom writes a JSX prop as a *property* whenever one exists on
the instance, so earlier versions took the string, failed `[2,3,4].includes('3')` and silently
rendered four tracks. The setter coerces with `Number()` now.

Still open in 5.0.20 — each one changes what you write, so none is a footnote:

- **`tc-button` does not observe `aria-label`/`title`**, so an icon-only `tc-button` reports as
  an unnamed control. Use `tc-icon-button` (icon and label are attributes, no children), or give
  the button a **single** `.visually-hidden` child — single, because a second child re-opens the
  `removeChild` trap in *React ↔ custom element* above.
- **`tc-alert` hardcodes `role="alert"`** and has no politeness attribute, so every toast is
  assertive and a *success* interrupts a screen reader mid-sentence. React writes props before
  insertion and the element's first render clobbers them, so re-write `role`/`aria-live` in an
  effect **after** mount.
- **`tc-taxonomy-card` renders its heading as an unconditional `h3`**, so a card list under an
  `h1` skips a level and the card cannot sit under an `h2`. Unlike `tc-app-bar` it has no
  `heading-level`.

Re-check this list when bumping the dependency: an item disappearing means an app-side
workaround can be deleted, and the workarounds are the kind that outlive their reason.

## Verifying

There is no substitute for a device-sized viewport with `hasTouch: true`. Check, in order:
390×844 phone → 768px tablet band → ≥992px desktop; then a coarse-pointer hit-box pass; then
`env(safe-area-inset-*)` faked at `:root` (it is `0px` everywhere else). For print surfaces the
shell's `overflow: hidden` must be un-clipped **and** un-padded in the print block, or the
browser never creates a page past the first screenful.
