# The mobile element vocabulary

Which `tc-*` element does which job, the attributes that matter, and the events to listen
for. Attribute names are kebab in markup, camel on the property (`active-id` ↔ `activeId`).
Arrays and objects must be assigned as **properties** — see `react-integration.md`.

For the exhaustive API of every element in the library, use the `web-components` skill. This
file is the phone-shaped subset plus the judgement calls.

## Frame

### `tc-mobile-shell`
The app frame. One per app, mounted above the router outlet.

| | |
|---|---|
| Regions | `[slot="header"]` (repeatable) · **one unslotted child = the pane** · `[slot="action"]` · `[slot="overlay"]` · `[slot="dock"]` |
| Attributes | `desktop` · `edge="top\|bottom\|both"` · `pane-bg` · `scroll-restore="auto\|manual"` · `data-key` |
| Read | `.pane` (the scroller, `null` until that child exists) · `.scrolled` |
| Methods | `scrollToTop(smooth?)` |
| Events | `tc-shell-scroll` `{ scrolled, top }`, plus `onScrollStateChange` |

`desktop` is inert below 992px. `pane-bg` must go through the attribute — the element owns
`--bs-mobile-shell-bg` in its inline style and removes the property whenever the attribute is
absent, wiping a framework-written value on connect.

`tc-app-bar`, `tc-action-bar`, `tc-tab-dock` and `tc-fab` all bind to `tc-shell-scroll`
themselves when asked — that is what `elevate-on-scroll` / `auto-hide` are.

### `tc-app-bar`
`variant="brand" | "title" | "back"`, `heading`, `subheading`, `heading-level` (0 = a `<div>`;
`1`–`6` render a real `<hN>`), `back-label`, `elevated`, `elevate-on-scroll`, `truncate`.
Slots: `actions` (trailing), `below` (a tab rail, **inside the bar's own background**).
Event: `tc-app-bar-back` / `onBack`.

- The bar does **not** assume a heading level: on most screens the page's real heading is in
  the pane and a second `h1` in the chrome would compete with it. A screen whose only heading
  IS the bar's title opts in with `heading-level="1"`.
- **Do not add `truncate` to a `title` bar.** It reads like "ellipsise the title", but what it
  adds is `flex: 0 1 auto` — it lets the heading *shrink*, which the title variant turns off so
  the muted subtitle gives up its width first. Measured: a one-word title rendered as "Re…" at
  390px while a 70-character description kept 304px.
- `elevate-on-scroll` is wrong on a screen with a band under the bar: the shadow lands inside
  the header block, above the band's own hairline. Switch it off there.
- A **band** (search row, offline strip) is a second `[slot="header"]` sibling, *not* `below`.
  `below` is for chrome that lives on the bar's fill; a band carries its own fill and rule.

### `tc-tab-dock`
Bottom nav; becomes a left rail at ≥992px inside a `tc-mobile-shell[desktop]`.

`tabs: { id, label, icon, href?, badge?, badgeLabel?, disabled? }[]` (property), `active-id`,
`auto-hide`, `reveal()`. Events `tc-tab-dock-change` and `tc-tab-dock-reselect`, both with
detail `{ id, href }`.

- A tab with an `href` renders a real `<a>` (middle-click, no-JS). Cancel the event and hand
  the navigation to the router.
- `badge`: `0`/`''`/`null`/`undefined` render **nothing** — a zero badge is noise. `>99` → `99+`.
  `badgeLabel` is how it is spoken ("Messages, 12 new"); without it a screen reader gets a bare
  number.
- `auto-hide` is **off by default and should usually stay off**: nav that disappears while you
  read is a regression. Turn it on only for a long reading surface.
- Wire `tc-tab-dock-reselect`: scroll the pane to top, and if already topped, pop to the tab's
  root. That is the native three-gesture bottom nav.

### `tc-page-tabs`
The in-bar rail. `tabs: { id, label, href?, count?, disabled? }[]`, `active-id`; event
`tc-change` `{ id, href }`. **It scrolls, it never wraps** — six labels are ~470px, which takes
two lines at 390px and pushes the whole page down on first paint. Give every tab an `href` so
the URL owns the active id and the element never writes it.

## Overlays

### `tc-bottom-sheet`
The app's only transient surface. At the desktop layout the same element renders as a centred
dialog (drag off) — no second modal system.

`open`, `heading`, `snap` (`"auto"` = content height, or an ascending percentage list),
`initial-snap`, `dismissible` (default **true**; reads `!== 'false'`), `scrim="warm|dark|none"`,
`blur-behind` (default true), `handle`. Read `snapIndex` and **`lockTarget`**
(`'pane' | 'body' | 'none'`). Methods `show()` / `hide(reason?)` — `hide` resolves after the
**exit** animation, so a caller can unmount safely. Events `tc-sheet-open` / `tc-sheet-close`
`{ reason: 'scrim'|'drag'|'escape'|'action' }`, plus `onOpenChange`.

Non-negotiables:
- Mount in the shell's `[slot="overlay"]`, never in the pane (otherwise `lockTarget` falls back
  to `'body'`, which cannot lock a body that never scrolled, and `blur-behind` is skipped).
- Body = **exactly one unslotted element** + an optional `[slot="footer"]`. The element
  re-parents nothing.
- Direct children of the body must be a **fixed list** — a conditional direct child changes the
  surface's shape mid-animation. Render the wrapper unconditionally and hide it.
- Cap a content-height sheet with `--bs-bottom-sheet-inset-top` (e.g. `10%` for a 90% ceiling).

### `tc-action-bar`
Sticky bottom action region, in the shell's `action` slot. `stack` (vertical: a primary action
over its escape hatch), `elevated`, `flat`, `elevate-on-scroll`.

**Unset is not "off"**: with neither `elevated` nor `flat` the bar declares no shadow at all and
the shell's context-aware default applies — a shadow when the bar is the bottom-most chrome,
none when a dock sits below it. Most screens should touch neither. Inside a shell the bar pays
no safe-area or keyboard inset (the shell already did).

### `tc-fab`
`icon` (lucide name, kebab or Pascal), **`label` (required — the whole accessible name in the
icon variant)**, `variant="icon|extended"`, `position`, `offset` (default `104px` = dock reserve
+ clearance; a dock-less screen passes `24px`), `auto-hide` (off by default), `reveal()`.
`click` bubbles from its single `<button>`, so `onClick` on the host is unambiguous.

Never on the same screen as an action bar. The page must add `offset + 56 + 16` of bottom
padding — the FAB has no idea what is under it.

## Content

| Element | Job | Key attributes |
|---|---|---|
| `tc-list-section` | A titled, rounded group of rows | `heading`, `icon`, `meta` (right-aligned figure, tabular-nums) |
| `tc-check-row` | A tickable row — a list item to tick off, a per-item toggle | `label`, `hint`, `trailing` (figure) or `[slot="trailing"]` (a control, outside the `<label>`, so pressing it does not toggle), `checked`, `shape`, `tone`, `divider`, `no-strike`, `no-dim`; event `tc-check-row-change` |
| `tc-stat-tile` | One figure + caption | `value` (text, never parsed), `unit`, `label`, `hint`, `tone`, `color` (data-hue, beats `tone`), `size`, `align`, **`spoken`** (the fact as a sentence — abbreviations like "kcal"/"g" are mangled by every screen reader, and only the app knows the spoken form) |
| `tc-macro-grid` | A row of 2–4 figures | `variant="bare\|tiled"`, `columns=2\|3\|4` (not open-ended: five 700-weight figures do not fit across 390px — anything else is a grid; the string form `columns="3"` works from 5.0.20, earlier versions silently rendered four tracks) |
| `tc-quota-meter` | Used-of-allowance | `used`, `total` (`0`/absent = no cap), `warn-at`, `variant="inline\|bar"`, `label-format="fraction\|percent\|remaining\|none"`, `suffix`, `tone`, `width`; read `percent` (un-clamped) and `state` (`ok\|near\|full`, reflected as `data-state`) |
| `tc-taxonomy-card` | The list card | `accent` (hue → top rule, tint, eyebrow, metric), `eyebrow`, `heading`, `heading-level` (0 default — a card in a list is an `h3`, a hero card is not a heading at all), `href`; event `tc-taxonomy-card-activate` `{ href }` |
| `tc-day-strip` | A week/fortnight selector | `days`, `active-id`, `columns` (7 default — it is a **column count**, so 14 days become two rows); event `tc-day-strip-change` |
| `tc-load-more` | The tail of a paged feed | `state`, `label`, `loading-label`, `exhausted-label`, `count` ("+20" — answers "is this worth a tap"), `load()`; event `tc-load-more` |
| `tc-add-slot` | A dashed "add one here" tile | `icon` (default `plus`), **`label` (required)**, `tone="muted\|accent"` (accent when the slot IS the section's primary action because the section is empty) |
| `tc-notice` | A standing condition of this screen | `tone="info\|muted\|warning\|accent\|success\|danger"` |
| `tc-step-pager` | A wizard / full-screen step mode | `steps`, `index`, `next-label`, `done-label`, `hint-label`, `back-label`, `close-label`, `swipe-hint`, `heading-action`; events `tc-step-pager-change` / `-done` / `-close` / `-heading`, `goTo/next/prev` |
| `tc-swipe-pager` | Horizontally paged content | `gesture="swipe\|none"`, `index`; event `tc-swipe-pager-change` `{ index, count }` |

Pagination vs load-more: a **feed** you extend ends in `tc-load-more`; an **archive you
navigate** (page 3 of 4 is the useful affordance) keeps `tc-pagination`.

## Not in the phone vocabulary

- `tc-dashboard-layout` / `tc-dashboard-sidebar` — the desktop shell. A phone-first app has one
  `tc-mobile-shell` and grows the desktop from it.
- `tc-modal` — replaced entirely by `tc-bottom-sheet`, which is a centred dialog at desktop
  width anyway.
- `tc-tab-bar` for a page rail — it wraps; `tc-page-tabs` scrolls.

## Icons

Lucide names. `tc-tab-dock` and `tc-list-section` accept either spelling, but some versions of
`tc-icon` index `lucide-static` directly and resolve **PascalCase only** — a kebab name there
renders an empty wrapper with nothing in the console. Pascal works against both; use it.

## Known library gaps to design around

- `aria-label` on a `tc-button` host is inert (the element never forwards ARIA to its inner
  `<button>`). Use a `.visually-hidden` span inside a **single** wrapper child, or
  `tc-icon-button`, which takes its label as an attribute.
- Registering everything costs ~517KB gz JS + ~351KB gz CSS (all elements, all themes). Per-
  element registration and per-theme CSS entry points are library-side fixes; budget for the
  full cost until they land.
- Some elements' focus rings inherit an accent that fails contrast on their own surface — check
  rings on dock/rail/tab surfaces and override app-side with a `data-surface-dark` /
  `data-surface-light` convention.
