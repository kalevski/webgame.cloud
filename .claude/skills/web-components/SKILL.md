---
name: web-components
description: Use when building UI with @toolcase/web-components — framework-free HTML5 Web Components (`tc-*` custom elements) with from-scratch toolcase styling and a Bootstrap-compatible class API. Covers layout (BasicLayout, DashboardLayout, DashboardContent, DashboardSidebar, Login, Container, Row, Col, Spacer, Stack), content (Accordion, AccordionItem, ActionHeader, ActionItems, ActionRowList, Alert, AnnouncementBar, ApiReferenceTable, AssetRow, AssetRowList, Avatar, Badge, BadgeRow, Banner, Brand, Build, BriefCard, BundleBar, CdnMap, CalloutQuote, Changelog, ChartContainer, Sparkline, TrendIndicator, Leaderboard, LeaderboardTrend, CodeLabelCell, CodeSnippet, CodeWithOutput, CommunityLinks, ConfigPreview, ContributorWall, CookbookGrid, CoolButton, ActivityCard, BasicCard, Button, ButtonGroup, Card, Carousel, CloseButton, Collapse, Divider, Dropdown, DownloadStats, EcosystemMap, EmptyState, GameShowcaseCard, GithubStarsCard, GoodFirstIssues, Group, Hero, HeroStatsBar, Heading, Image, InfiniteScroll, Kbd, ListCard, ListGroup, LogoCloud, MaintainerCard, Marquee, MetricTile, MetricGrid, MigrationGuide, PageFooter, Panel, PhaseGrid, Pipeline, PinnedFeatureShowcase, PluginGrid, PricingCard, File, UserPanel, QueuedFile, Placeholder, Progress, PulseIndicator, ScoringRules, ScoreDisplay, SectionCard, SectionFlag, Skeleton, Spinner, SprintChain, Stamp, MetricCard, StatCard, StateMachine, StatusCard, StatusDot, Stepper, Tag, DataList, TierLadder, Timeline, UsageSummaryPanel, WelcomeGuide, CommandReference, Comparator, CompatibilityMatrix, CountdownTimer, FAQList, FeatureMatrix, Text, VersionLabel, VisuallyHidden), navigation (Breadcrumb, CoolNav, Nav, Navbar, Pagination, Scrollspy, SocialLinks, Stepper), overlays & feedback (ContextMenu, DebugOverlay, Modal, Offcanvas, Popover, Toast, Tooltip), and forms (CardOptions, Check, CheckboxGroup, Chip, ChipGroup, ColorPicker, IconPicker, DatePicker, EarlySignupForm, EditableText, FloatingLabel, Form, HelperText, Input, InputGroup, InputGroupText, Label, MultiCardSelect, NewsletterSignup, Option, Radio, RadioGroup, Range, RangeSlider, DeadzoneSlider, Select, Switch, Textarea). Consumable from any stack — React, Vue, Svelte, or plain HTML.
---

# web-components — API Reference

Framework-free HTML5 Web Components with their own from-scratch toolcase styling — no Bootstrap dependency, Bootstrap-compatible markup/class API. No React, Vue, or Angular required — drop `tc-*` tags into any stack.

```ts
import { register } from '@toolcase/web-components'
import '@toolcase/web-components/style.css'

register() // registers all tc-* elements via customElements.define
```

**SSR / Next.js / server-side rendering — dynamic import required.** Every `tc-*` class body contains `extends HTMLElement`, which is evaluated at module load time. A static top-level `import '@toolcase/web-components'` in server-rendered code throws `ReferenceError: HTMLElement is not defined`. The package ships a `node` export condition that resolves to a no-op stub, so server-side imports are safe, but browser registration must use a dynamic import inside a client-only boundary:

```ts
// Next.js app directory — client component
'use client'
import { useEffect } from 'react'

useEffect(() => {
    void import('@toolcase/web-components').then(m => m.register())
}, [])
```

Never call `register()` at module top-level in a file that Next.js (or any SSR framework) also renders on the server.

**React `className` merging.** Components that own their host `class` attribute — `tc-modal`, `tc-alert`, `tc-card`, `tc-avatar`, `tc-toast`, `tc-carousel`, `tc-navbar`, `tc-list-group-item`, `tc-portrait`, `tc-offcanvas` — **merge** consumer-authored classes into the classes they render instead of clobbering them: classes present on the tag before the first render (e.g. a React `className`) are captured and re-applied on every subsequent render.

After `register()` you can author markup directly:

```html
<tc-button variant="primary">Save</tc-button>
<tc-modal title="Confirm">Are you sure?</tc-modal>
<tc-alert variant="success" dismissible>Saved successfully.</tc-alert>
```

---

## Internationalization (configureMessages)

Every built-in user-visible default string a `tc-*` component renders (validation copy, placeholders, pagination summaries, aria labels) resolves through a global message registry **at render time**, so a single `configureMessages()` call at app bootstrap localises the whole component set. Defaults stay English. Exported from the package root:

- `configureMessages(overrides: Partial<ToolcaseMessages>)` — merges the overrides into the active catalog (keys set to `undefined` keep their current value) and dispatches a `tc-messages-changed` CustomEvent on `document`.
- `resetMessages()` — restores the built-in English defaults (also dispatches `tc-messages-changed`).
- `getMessages(): Readonly<ToolcaseMessages>` — snapshot of the active catalog (for auditing coverage).

```js
import { configureMessages } from '@toolcase/web-components'
configureMessages({
    fieldRequired: 'Ова поле е задолжително',
    paginationRange: ({ start, end, total }) => `${start}–${end} од ${total}`,
    selectPlaceholder: 'Изберете…',
})
```

**Message catalog**

| Key | Default | Used by |
|-----|---------|---------|
| `fieldRequired` | `This field is required` | `tc-form-input` + the pickers/sliders/OTP — required field left empty |
| `fieldInvalid` | `Please provide a valid value.` | `tc-input`, `tc-textarea`, `tc-tag-input` |
| `invalidValue` | `Invalid value` | `tc-form-input` + the pickers/sliders/OTP — fallback when a validator returns no message |
| `selectionRequired` | `Please make a selection.` | `tc-select`, `tc-combo-box`, `tc-extended-select` |
| `selectionInvalid` | `Please provide a valid selection.` | `tc-select`, `tc-combo-box`, `tc-extended-select` |
| `selectionMinOne` | `Please select at least one option.` | `tc-checkbox-group` |
| `invalidChoice` | `Please choose a valid value.` | `tc-slider` |
| `invalidDate` | `Please provide a valid date.` | date picker |
| `invalidTime` | `Please provide a valid time.` | time picker |
| `invalidColor` | `Please select a valid color.` | color picker |
| `invalidIcon` | `Please select a valid icon.` | icon picker |
| `invalidCode` | `Please enter a valid code.` | `tc-otp-input` |
| `selectPlaceholder` | `Select…` | selects (`tc-select`, `tc-combo-box`, `tc-extended-select`) |
| `searchPlaceholder` | `Search…` | searchable selects |
| `searchOptionsLabel` | `Search options` | searchable selects (search box aria label) |
| `loading` | `Loading…` | spinners, skeletons, charts, tables |
| `noData` | `No data` | `tc-table` empty default + charts |
| `close` | `Close` | close buttons (modal, offcanvas, toast, alert, drawer, …) |
| `clear` | `Clear` | reserved |
| `filtersLabel` | `Filters` | `tc-advanced-table` filter toolbar |
| `toggleSidebarLabel` | `Toggle sidebar` | reserved |
| `paginationLabel` | `Page navigation` | `tc-pagination` |
| `paginationPrevious` | `Previous` | `tc-pagination` |
| `paginationNext` | `Next` | `tc-pagination` |
| `paginationRange` | `{start}–{end} of {total}` | `tc-advanced-table` pagination summary |
| `stepsComplete` | `{completed} of {total} complete` | reserved formatter |
| `starsRating` | `{value} out of {max} stars` | reserved formatter |
| `fileDropPrompt` | `Drag & drop files here or click to browse` | `tc-file-dropzone` |
| `fileDropLabel` | `Upload files — drag and drop or click to browse` | `tc-file-dropzone` |
| `fileSelectLabel` | `Select files to upload` | `tc-file-dropzone` |

Notes:

- Parameterised keys (`paginationRange`, `stepsComplete`, `starsRating`) accept either a `{token}` template string or a formatter function (`(params) => string`) — functions get full control over pluralisation and word order.
- Per-instance attributes (`placeholder`, `empty-message`, `error`, `required-message`, …) always win over the registry for one-off cases.
- Call `configureMessages()` before components render — components read the registry when they render. Changing messages later requires re-rendering the affected components; listen for `tc-messages-changed` on `document` to trigger that.

---

## Component Index

Each link opens the full spec (attributes, methods, events, examples) in `specs/`. Read the matching spec file before using a component.

### Layout

- [`tc-anchor`](./specs/tc-anchor.md) — Layout primitive that absolutely positions its slotted content at a corner, edge, or the centre of the nearest positioned ancestor. Purely structural — no visible chrome, no shadows, no border-radius.
- [`tc-artboard-backdrop`](./specs/tc-artboard-backdrop.md) — Decorative full-bleed backdrop surface for staging artwork, previews, or hero content. Styled to the web-components design system — the slate neutral ramp, sharp corners (`border-radius: 0`), and a 1px hairline.
- [`tc-aspect-ratio-box`](./specs/tc-aspect-ratio-box.md) — Layout primitive that holds its slotted content at a fixed intrinsic aspect ratio (e.g. 16:9). Uses the modern CSS `aspect-ratio` property with a `padding-bottom` percentage fallback for older engines.
- [`tc-basic-layout`](./specs/tc-basic-layout.md) — Two-section page layout: an optional brand header region followed by a full-height main content area. Flat structural surface — no shadows, no border-radius, slate neutrals only.
- [`tc-col`](./specs/tc-col.md) — Grid column.
- [`tc-container`](./specs/tc-container.md) — Responsive fixed-width container.
- [`tc-dashboard-content`](./specs/tc-dashboard-content.md) — Scrollable main content area for the dashboard layout. A pure layout wrapper — no chrome, no elevation. Provides comfortable padding and `overflow-y: auto` for hosting cards, rows, and section headers inside a dashboard shell.
- [`tc-dashboard-layout`](./specs/tc-dashboard-layout.md) — Full-height dashboard shell: a full-height sidebar on the left, a glass navbar spanning the content column, and a scrollable content area.
- [`tc-dashboard-sidebar`](./specs/tc-dashboard-sidebar.md) — Vertical sidebar shell for dashboard layouts. Arranges three named slot regions — brand (top), menu (scrollable middle), panel (pinned bottom) — in a fixed-width column separated from the content by a 1px hairline on its trailing edge.
- [`tc-gilded-frame`](./specs/tc-gilded-frame.md) — Hairline-framed surface that wraps its slotted content. Styled to the toolcase voice — sharp corners, slate neutrals, 1px hairline borders, no decorative shadow.
- [`tc-grid`](./specs/tc-grid.md) — CSS-grid layout primitive. Set a column and/or row count, a gap, and a uniform cell size; children are laid out directly as grid items. Purely structural — no visible chrome, no shadows, no border-radius.
- [`tc-login`](./specs/tc-login.md) — Two-column login layout: a decorative ink aside (left, carries the background pattern) and a white form column (right, carries a logo slot, title, description, and a vertical stack of OAuth connect buttons).
- [`tc-resizable-panel`](./specs/tc-resizable-panel.md) — Two-pane layout with a draggable divider, localStorage persistence, and keyboard resizing. The **first two element children** become pane A and pane B.
- [`tc-row`](./specs/tc-row.md) — Grid row wrapper.
- [`tc-safe-area`](./specs/tc-safe-area.md) — Layout wrapper that insets its content by the device's `env(safe-area-inset-*)` CSS environment variables (the areas carved out by notches, rounded corners, and home indicators).
- [`tc-scroll-area`](./specs/tc-scroll-area.md) — Scrollable container with configurable max dimensions and scroll axis. The slotted children are placed into an inner content element; overflow is applied to the wrapper based on `axis`.
- [`tc-spacer`](./specs/tc-spacer.md) — Purely structural spacing element. Fills available space in a flex container when `size` is omitted, or provides a fixed dimension along the given axis when `size` is set. The element is `aria-hidden` and carries no visible chrome.
- [`tc-stack`](./specs/tc-stack.md) — Flexbox row/column layout primitive. Children are composed along a single axis with configurable gap, alignment, justification, and optional wrapping. The element has no visible chrome; it is purely structural.
- [`tc-theme`](./specs/tc-theme.md) — Theming host element — the `--tc-*` token override container. Every `tc-*` component drives its cosmetics through `--bs-<component>-*` custom properties whose defaults resolve to the design-system `--tc-*` tokens (e.g.

### Content

- [`tc-ability-card`](./specs/tc-ability-card.md) — Ability portrait tile: an icon chip, a rarity micro-label, the ability name, an optional hotkey (keybind), a description, and a meta grid of cooldown / cost / range.
- [`tc-accordion`](./specs/tc-accordion.md) — Collapsible accordion container. Wrap `tc-accordion-item` children inside to build a group where only one item can be open at a time (unless `always-open` is set).
- [`tc-accordion-item`](./specs/tc-accordion-item.md) — Single panel inside a `tc-accordion`. Renders a clickable header button and a collapsible body region; default slot content becomes the body.
- [`tc-action-header`](./specs/tc-action-header.md) — Flex header row with slotted title content on the left and a row of action buttons on the right. Dispatches a `tc-exec` custom event when an action button is clicked.
- [`tc-action-items`](./specs/tc-action-items.md) — Dropdown menu button with keyboard-accessible items positioned relative to the trigger. Fires `tc-action-click` when an item is chosen and closes the menu.
- [`tc-action-row-list`](./specs/tc-action-row-list.md) — Vertical list of action rows, each with a title, optional description, and a CTA button on the right. Fires `tc-action-click` when a row's button is clicked. Disabled rows render at reduced opacity and are not interactive.
- [`tc-activity-card`](./specs/tc-activity-card.md) — Dashboard card showing a vertical timeline of activity items with icons, descriptions, and timestamps. Purely presentational; no events.
- [`tc-advanced-table`](./specs/tc-advanced-table.md) — Data table with a built-in filter toolbar, sortable headers, a translucent loading overlay, and a paginated footer.
- [`tc-alert`](./specs/tc-alert.md) — Contextual feedback message.
- [`tc-ammo-counter`](./specs/tc-ammo-counter.md) — Magazine / clip counter HUD readout — current rounds in the magazine, magazine capacity, reserve ammo, an optional weapon name, and a reloading state. Purely presentational, attribute-driven, no slots.
- [`tc-api-reference-table`](./specs/tc-api-reference-table.md) — Documentation-style API reference table. Renders API items grouped by category with name, signature, returns, and description columns. Deprecated items render an inline warning badge with an optional deprecation note.
- [`tc-area-chart`](./specs/tc-area-chart.md) — SVG area chart with filled regions, gridlines, an interactive tooltip, and an optional legend. Sharp square corners, slate-neutral chart frame on `--tc-surface` behind a 1px hairline; faint slate gridlines; mono micro axis labels.
- [`tc-asset-bundle`](./specs/tc-asset-bundle.md) — Asset bundle card showing a target engine, included/excluded tag chips, file-type counts, build references, an action menu (kebab) in the header, and a collapsible **Advanced** packing section.
- [`tc-asset-row`](./specs/tc-asset-row.md) — Single row displaying an asset with a leading icon, primary name label, optional tag chips, and a trailing size. Non-interactive; dispatches no events.
- [`tc-asset-row-list`](./specs/tc-asset-row-list.md) — Bordered container for a sequence of `tc-asset-row` elements.
- [`tc-audio-mixer`](./specs/tc-audio-mixer.md) — A framework-free audio mixer / timeline editor.
- [`tc-avatar`](./specs/tc-avatar.md) — Circular user avatar. Displays an image, 1–2 initials derived from a name, or a placeholder user glyph when neither is provided. Optionally shows a colour-coded status dot at the bottom-right corner.
- [`tc-badge`](./specs/tc-badge.md) — Small count or label indicator.
- [`tc-badge-row`](./specs/tc-badge-row.md) — Horizontal row of paired key/value chips. Sharp square corners, slate neutral default, JetBrains Mono value text. Set badges exclusively via the `badges` JS property.
- [`tc-banner`](./specs/tc-banner.md) — Status banner with a leading icon, body content, an optional action slot or CTA link, and optional localStorage-backed dismissal. Emits `tc-dismiss` when closed.
- [`tc-bar-chart`](./specs/tc-bar-chart.md) — SVG bar chart in vertical (columns) or horizontal (rows) orientation, with category/value axis labels, an interactive tooltip, and optional per-bar value labels.
- [`tc-basic-card`](./specs/tc-basic-card.md) — Small dashboard card with an optional leading icon chip and a two-line text block. Purely presentational; no events.
- [`tc-battle-pass`](./specs/tc-battle-pass.md) — Battle-pass tier track with a season header, an XP progress bar, and a two-row reward track (premium / free) of claimable reward cells.
- [`tc-benchmark-chart`](./specs/tc-benchmark-chart.md) — Horizontal SVG bar chart comparing benchmark values, with leader highlighting and a linear or log scale.
- [`tc-bitmap-font-generator`](./specs/tc-bitmap-font-generator.md) — Canvas-based bitmap-font atlas generator. Owns its own control panel (font/fill/effects/layout/content groups), a live preview `<canvas>`, a generate button, and a multi-format export descriptor block with copy/download.
- [`tc-boss-bar`](./specs/tc-boss-bar.md) — Wide top-of-screen boss health bar — a boss name, an optional epithet, a phase indicator, an ink health fill over a flat slate track, and a mono `hp / hp-max` readout. Purely presentational, no events, no slots.
- [`tc-brand`](./specs/tc-brand.md) — Branded wordmark with primary/secondary text, a customisable accent underline bar, and an optional micro-label chip.
- [`tc-brief-card`](./specs/tc-brief-card.md) — A card displaying a task/brief with a difficulty indicator, optional icon, body copy, and a two-column meta footer. Dispatches `tc-click` when activated.
- [`tc-brightness-calibration`](./specs/tc-brightness-calibration.md) — Gamma/brightness calibration view: three grayscale reference swatches (dark / mid / bright), each carrying a calibration instruction, plus a `0–1` brightness slider with a mono percentage readout.
- [`tc-buff-bar`](./specs/tc-buff-bar.md) — A horizontal row of active buff / debuff status icons, each composed from `tc-buff-icon`. Every entry can carry a duration (rendered as a mono caption and an optional radial cooldown sweep) and a stack count (a small mono ink badge).
- [`tc-buff-icon`](./specs/tc-buff-icon.md) — A single buff / debuff status icon: a square slate tile with a centred lucide glyph and an optional mono duration caption pinned to the bottom edge.
- [`tc-build`](./specs/tc-build.md) — Build status card showing name, date, size, duration, a status icon, an optional badge, and an action menu (kebab). The status icon and badge are the only places colour appears — the card body uses the slate neutral ladder throughout.
- [`tc-bundle-bar`](./specs/tc-bundle-bar.md) — Segmented progress bar for build / bundle visualisation. Renders a discrete row of cells where the first N are filled, with an optional header row (name + meta) and an optional row of chip labels.
- [`tc-button`](./specs/tc-button.md) — Button.
- [`tc-button-group`](./specs/tc-button-group.md) — Groups buttons horizontally or vertically.
- [`tc-callout-quote`](./specs/tc-callout-quote.md) — Blockquote with a decorative quote-mark icon, optional attribution, and an optional source link. The quote body is supplied either via the `quote` attribute (plain text) or via default slotted children (rich content).
- [`tc-car-listing-card`](./specs/tc-car-listing-card.md) — Vehicle listing card: image, category chip, wishlist toggle, title, optional rating, an icon spec row (mileage/fuel/transmission), current + strikethrough old price, and an optional seller mini-row. The flagship component of the
- [`tc-card`](./specs/tc-card.md) — Content container with optional header/footer.
- [`tc-carousel`](./specs/tc-carousel.md) — Slideshow component with built-in slide/fade behavior.
- [`tc-cdn-map`](./specs/tc-cdn-map.md) — Grid-backed surface with positioned CDN node markers. Primary nodes use the slate ink accent (`--tc-app-accent`); accent nodes use the rare cyan `--tc-accent` for highlight PoPs.
- [`tc-changelog`](./specs/tc-changelog.md) — Vertical changelog timeline. Entries are set via the JS `entries` property (array of `ChangelogEntry` objects). Supports optional truncation via `max-visible` with a configurable "read more" link, and a loading skeleton.
- [`tc-chart-container`](./specs/tc-chart-container.md) — Chart wrapper with an optional header (title + subtitle on the left, actions on the right), a slotted chart body, a legend footer region, and loading/empty states.
- [`tc-chat-window`](./specs/tc-chat-window.md) — Scrolling chat log with channel tabs and a compose row (text input + Send button). Messages and channels are set via JS properties; the newest message sits at the bottom and the log scrolls to it after every update.
- [`tc-circular-progress`](./specs/tc-circular-progress.md) — Ring / circular progress indicator with an optional value label.
- [`tc-close-button`](./specs/tc-close-button.md) — Standalone × close button.
- [`tc-code-label-cell`](./specs/tc-code-label-cell.md) — Machine-facing code chip alongside a human-readable display name. Purely presentational — designed to drop into table or list cells.
- [`tc-code-snippet`](./specs/tc-code-snippet.md) — Syntax-highlighted code block with a copy button, language label, optional title, and loading skeleton. Dark ink surface; JetBrains Mono throughout; sharp corners everywhere.
- [`tc-code-with-output`](./specs/tc-code-with-output.md) — Code snippet and its output displayed side-by-side (`split`) or stacked (`stacked`), with separate panes. The output pane switches to a danger-styled error state when the `error` property or `slot="error"` content is provided.
- [`tc-codex`](./specs/tc-codex.md) — Codex / bestiary browser: a scrollable list of entries paired with a detail panel that shows the active entry's description and stat rows.
- [`tc-collapse`](./specs/tc-collapse.md) — Toggleable content panel with built-in height/width animation.
- [`tc-colored-card`](./specs/tc-colored-card.md) — Dashboard card with a caller-supplied color tinting the icon chip and a two-line metric display. Purely presentational; no events.
- [`tc-combo-counter`](./specs/tc-combo-counter.md) — Combo / multiplier HUD readout — a JetBrains Mono label, a large ink multiplier figure (`x{combo}`), and an optional draining timer bar. Purely presentational, attribute-driven, no slots.
- [`tc-command-reference`](./specs/tc-command-reference.md) — Searchable reference guide for CLI commands with usage, descriptions, flags, and aliases. Filters results in real time by command name, description, aliases, and flag text.
- [`tc-community-links`](./specs/tc-community-links.md) — Grid of community platform links (GitHub, Discord, X, YouTube, etc.) with icons, labels, optional descriptions, and optional counts. Purely presentational — no callbacks or events.
- [`tc-comparator`](./specs/tc-comparator.md) — Side-by-side comparison table for two technologies with auto winner detection per row and optional summary stats. Purely presentational — no interactive targets, no events.
- [`tc-compass-bar`](./specs/tc-compass-bar.md) — Horizontal compass strip showing a slice of the heading ring — the field of view (`fov`) — with cardinal ticks (N/NE/E/…) and positioned markers.
- [`tc-compass-rose`](./specs/tc-compass-rose.md) — Radial compass rose showing a facing direction. The slate-ink north needle rotates to the current `heading` while static N/E/S/W cardinals frame a flat slate face; short index ticks mark the four cardinals for an instrument read.
- [`tc-compatibility-matrix`](./specs/tc-compatibility-matrix.md) — Matrix table showing compatibility status across versions (rows) and platforms (columns) with status icons and a legend. Purely presentational — no events.
- [`tc-config-preview`](./specs/tc-config-preview.md) — JSON-like configuration preview with syntax-highlighted key-value pairs rendered on a dark code surface. Purely presentational — no callbacks or events.
- [`tc-contributor-wall`](./specs/tc-contributor-wall.md) — Grid of contributor avatar tiles with optional overflow counter and profile links. Avatars are sanctioned circles; initials tiles shown when no `avatarUrl` is provided. Purely presentational — no callbacks or events.
- [`tc-controller-layout-preview`](./specs/tc-controller-layout-preview.md) — A gamepad diagram with labeled face-button bindings.
- [`tc-controls-rebind-list`](./specs/tc-controls-rebind-list.md) — A list of input actions, each rebindable to a key/button.
- [`tc-cookbook-grid`](./specs/tc-cookbook-grid.md) — Multi-column grid of code-recipe cards with title, description, code snippet, and optional tags. Linked cards animate with a 1 px lift on hover. Purely presentational — no callbacks or events.
- [`tc-cool-button`](./specs/tc-cool-button.md) — Grouped button with variants, sizes, loading state, and an optional addon region separated by a 1px internal divider. The addon sits in its own muted fill segment on either side of the label. Dispatches a `tc-click` event on activation.
- [`tc-cooldown-badge`](./specs/tc-cooldown-badge.md) — Small ring badge with a cooldown countdown readout, styled to the toolcase voice.
- [`tc-countdown-timer`](./specs/tc-countdown-timer.md) — Counts down to a target date/time in configurable units (days, hours, minutes, seconds). Visibility-aware: pauses ticking when the tab is hidden and immediately recomputes on resume.
- [`tc-crafting-panel`](./specs/tc-crafting-panel.md) — A crafting UI: a recipe list on one side, and a detail panel on the other showing the selected recipe's output, its ingredient requirements, and a craft action. Selecting a row fires `tc-select`; the craft button fires `tc-craft`.
- [`tc-credits-scroll`](./specs/tc-credits-scroll.md) — Auto-scrolling end-credits sequence. The credit sections scroll upward at a configurable speed; click or press Space/Enter to pause and play. Fires `tc-complete` when the track has fully passed the viewport.
- [`tc-crosshair`](./specs/tc-crosshair.md) — Configurable aiming reticle in the toolcase idiom.
- [`tc-currency-chip`](./specs/tc-currency-chip.md) — Compact currency pill pairing a leading glyph (a currency symbol or short token string) with a formatted amount.
- [`tc-currency-display`](./specs/tc-currency-display.md) — A larger currency readout pairing an optional label and currency icon with a prominent formatted amount.
- [`tc-cycle-wheel`](./specs/tc-cycle-wheel.md) — Animated circular wheel with a continuously rotating SVG ring of phase labels around a fixed centre stack.
- [`tc-damage-number`](./specs/tc-damage-number.md) — A floating combat number that rises and fades over a configurable duration, then fires a `tc-done` CustomEvent. Styled to the toolcase voice — JetBrains Mono digits in the slate/status palette, sharp corners.
- [`tc-danger-zone-actions`](./specs/tc-danger-zone-actions.md) — List of destructive actions rendered inside a danger-bordered panel. Each action row shows a title, optional description, and an `btn-outline-danger` button. Driven entirely by the `actions` JS property.
- [`tc-data-list`](./specs/tc-data-list.md) — Generic, data-driven row list. Owns the skeleton every domain list repeats — an `items` array that re-renders on assignment, an optional `list-title` header, an `empty-text` fallback, delegated per-row action buttons, and an optional singl…
- [`tc-diff-viewer`](./specs/tc-diff-viewer.md) — Side-by-side or unified line diff of two text blocks with per-line add/remove highlighting. Uses an LCS-based line diff algorithm. No syntax highlighting — the component renders plain text with semantic color cues only.
- [`tc-difference-card`](./specs/tc-difference-card.md) — Dashboard metric card showing a prominent value with a directional percentage-delta chip (vs the previous period). Purely presentational; no events.
- [`tc-download-stats`](./specs/tc-download-stats.md) — Package download statistics card showing formatted weekly, monthly, and total download counts with an optional sparkline trend chart. Supports npm, PyPI, and crates.io registries.
- [`tc-dropdown`](./specs/tc-dropdown.md) — Dropdown menu positioned by Popper.js.
- [`tc-ecosystem-map`](./specs/tc-ecosystem-map.md) — Concentric ring diagram showing ecosystem relationships, rendered as an inline SVG. Always renders a semantic list fallback (`tc-ecosystem-map__list`) alongside the diagram for accessibility and no-SVG contexts.
- [`tc-emission-badge`](./specs/tc-emission-badge.md) — Compact emissions credential for a vehicle catalog row: the emission category label behind a 4px colored left stripe encoding the emission class, an optional NEDC/WLTP measurement-standard mono tag, and an optional mono CO₂ figure.
- [`tc-empty-state`](./specs/tc-empty-state.md) — Centered placeholder shown when data is unavailable — the canonical empty treatment for tables, tabs, lists, and search results (`tc-table` renders it automatically for its empty state).
- [`tc-engine-spec`](./specs/tc-engine-spec.md) — Machined engine ID plate for the vehicle-catalog `engine` table — mono stamped engine code, muted manufacturer, a derived CONFIG badge combining layout + cylinder count (`V`+8 → **V8**, `SERIES`+6 → **L6**, `BOXER`+4 →
- [`tc-entity-cell`](./specs/tc-entity-cell.md) — Entity card showing a sharp initials tile, a primary name, and an optional sublabel. Tile colour can be tinted per entity for identity purposes. Supports an optional click handler that dispatches `tc-click`.
- [`tc-entity-profile-card`](./specs/tc-entity-profile-card.md) — Entity profile card with a hero section (lead avatar, title, subtitle, chips row) and a meta-information grid of label-value pairs. Presentational only — no events.
- [`tc-equipment-doll`](./specs/tc-equipment-doll.md) — A paper-doll of equipment slots arranged around a neutral character figure.
- [`tc-equipment-matrix`](./specs/tc-equipment-matrix.md) — The full equipment sheet of one catalog variant (the `variant_equipment` link table): items grouped by `feature_flag` into **Standard equipment / Optional extras / Packages** sections, each capped by a mono uppercase micro-header with an i…
- [`tc-equipment-tag`](./specs/tc-equipment-tag.md) — One vehicle-equipment chip (the catalog's `equipment` table), optionally carrying its per-variant `feature_flag` (`variant_equipment.flag`).
- [`tc-eyebrow`](./specs/tc-eyebrow.md) — Small uppercase micro-label shown above a heading. Machine-facing JetBrains Mono, wide letter-spacing, slate-muted ink, sharp corners. Content is provided via the default slot — no attributes, properties, or events.
- [`tc-faq-list`](./specs/tc-faq-list.md) — Collapsible FAQ accordion with optional JSON-LD `FAQPage` schema generation for SEO. Items are fully independent — multiple panels may be open simultaneously. The chevron rotates with a CSS transition that honours `prefers-reduced-motion`.
- [`tc-feature-card`](./specs/tc-feature-card.md) — Card highlighting a product feature with optional icon chip, eyebrow micro-label, title, description text, and a visual region.
- [`tc-feature-matrix`](./specs/tc-feature-matrix.md) — Comparison table of features vs columns, supporting boolean, partial, and custom string values with optional column highlight bands. Designed for plan or capability comparison.
- [`tc-file`](./specs/tc-file.md) — Full-featured file entry row with an inline-editable name, format badge, human-formatted byte size, nested item count, tag chips, and an action menu. Sharp corners (`border-radius: 0`); slate neutrals throughout.
- [`tc-funnel-chart`](./specs/tc-funnel-chart.md) — SVG funnel chart visualising a conversion flow as a vertical stack of tapering trapezoids: each step's top width is proportional to its value and its bottom width matches the next step's value, producing the funnel taper.
- [`tc-game-showcase-card`](./specs/tc-game-showcase-card.md) — Game showcase card with an artwork region, title, pitch, tag chips, compliance status indicators, and optional corner stamps. Rich-node regions are distributed via named slots; array data (stamps, tags, compliance) is set as JS properties.
- [`tc-gamepad-button-prompt`](./specs/tc-gamepad-button-prompt.md) — Gamepad button glyph prompt — a sharp slate key-cap holding a glyph (A / B / X / Y or generic such as `RT`, `LB`) with an optional caption label. Purely presentational, attribute-driven, no slots.
- [`tc-gantt-chart`](./specs/tc-gantt-chart.md) — Gantt chart with time-based task bars, progress fills, a date-marker axis, and a horizontally-scrolling body.
- [`tc-github-stars-card`](./specs/tc-github-stars-card.md) — GitHub repository card showing stars, forks, contributors, version, and a CTA link. Pre-fetched stats are supplied via the `stats` JS property; live stats are fetched from the GitHub REST API when the `fetch-live` attribute is present.
- [`tc-good-first-issues`](./specs/tc-good-first-issues.md) — Bordered list-group of GitHub good-first-issue items. Each row links to the issue URL, shows the repo slug, a row of label chips (with optional color dot), and a meta line with comment count and relative update time.
- [`tc-group`](./specs/tc-group.md) — Collapsible group container with a header label, optional badge, and optional action button. The body region holds arbitrary slotted children and is toggled hidden/visible by clicking the header.
- [`tc-guild-panel`](./specs/tc-guild-panel.md) — Guild / clan panel with a header (eyebrow, guild name + tag, optional motto), a stats strip (optional level, members count or count/cap, online count), and a member roster (status pip, name, optional rank chip, optional contribution).
- [`tc-heading`](./specs/tc-heading.md) — Semantic heading element (h1–h6) with optional slate-ink gradient text treatment. Renders a real `<hN>` element for a correct document outline.
- [`tc-heatmap`](./specs/tc-heatmap.md) — Heatmap grid with colour-interpolated cells and hover tooltips. Computes the value domain (min→max) across `data` and interpolates each cell's fill along `colorScale`; cells with no matching datum render muted.
- [`tc-hero`](./specs/tc-hero.md) — Large hero section with an optional eyebrow badge, heading, description, primary and secondary action buttons, a footnote, an optional background pattern or scattered lucide icons, stat cards, and inline metrics.
- [`tc-hero-stats-bar`](./specs/tc-hero-stats-bar.md) — Horizontal bar of key-value statistics with optional units and zero-state styling. Items are separated by 1px hairline dividers; each item stacks a large mono value (with optional unit suffix) above an uppercase mono micro-label.
- [`tc-hit-marker`](./specs/tc-hit-marker.md) — A transient hit-confirmation reticle — four inward-pointing corner ticks that pop in and fade out over a configurable duration, then fire a `tc-done` CustomEvent and auto-clear their own `show` attribute.
- [`tc-hotbar`](./specs/tc-hotbar.md) — A horizontal action bar of item/ability slots with hotkeys and a selected index. Each slot composes a `tc-item-slot` for the item visuals; the bar owns the sharp hairline frame, the row layout, the hotkey badge and the selection ring.
- [`tc-image`](./specs/tc-image.md) — Image wrapper with a loading shimmer skeleton, aspect-ratio control, configurable `object-fit`, and an error fallback. On successful load the skeleton fades out and the image fades in.
- [`tc-image-crop`](./specs/tc-image-crop.md) — Canvas-based image cropper with drag-to-pan, scroll-to-zoom (around the cursor), a zoom slider, an optional fixed aspect ratio, and an optional circular mask.
- [`tc-infinite-scroll`](./specs/tc-infinite-scroll.md) — Intersection Observer wrapper that dispatches `tc-load-more` when its sentinel element enters the viewport.
- [`tc-install-tabs`](./specs/tc-install-tabs.md) — Tabbed install command block for npm, yarn, pnpm, and bun. Shows the correct install command per manager, with a copy button that briefly confirms with a check icon.
- [`tc-interact-prompt`](./specs/tc-interact-prompt.md) — Contextual "press X to interact" prompt — a keycap paired with a mono uppercase machine-facing label, plus an optional hold-to-interact progress bar.
- [`tc-inventory-grid`](./specs/tc-inventory-grid.md) — A grid of inventory item slots with a configurable column count and a selected item id. Each cell composes a `tc-item-slot` for the item visuals; the grid owns the sharp hairline frame, the 1px-gap grid layout and the selection ring.
- [`tc-item-compare`](./specs/tc-item-compare.md) — A side-by-side item stat comparison: a `current` (equipped) item next to a `candidate`, with the candidate column annotated by a per-stat **difference** block.
- [`tc-item-slot`](./specs/tc-item-slot.md) — A single inventory / hotbar slot: an item glyph (image or initials), a quantity badge, a per-rarity border accent, an optional hotkey, an equipped marker, a radial cooldown sweep, and a locked state.
- [`tc-item-tooltip`](./specs/tc-item-tooltip.md) — A hover card describing an item: an optional mono **type** micro-label, the item **name**, a **rarity** chip, a **stat** list, an optional **requirements** block (each marked met / unmet), and optional **flavor** text.
- [`tc-journal`](./specs/tc-journal.md) — Quest / lore journal pairing an entry list (left rail) with a detail view (right pane).
- [`tc-key-binder`](./specs/tc-key-binder.md) — Click (or press Enter / Space) to enter capture mode; the next key press commits a new binding. Pressing Escape cancels. Emits `tc-change` with `{ value, code, key }` when a key is bound; emits `tc-cancel` when capture is cancelled.
- [`tc-kill-feed`](./specs/tc-kill-feed.md) — Stacking feed of kill/event entries rendered in a bordered container. Supports optional per-entry name colours (set as CSS custom properties on each span), a weapon label, and a headshot indicator.
- [`tc-leaderboard`](./specs/tc-leaderboard.md) — Table-based leaderboard with avatar, tier, sprints, trend, and points columns. Entries are supplied as a JS property (not an attribute).
- [`tc-legal-screen`](./specs/tc-legal-screen.md) — Multi-section legal / EULA screen with a sidebar nav, scrollable body panel, an optional accept footer, and a close button.
- [`tc-level-header`](./specs/tc-level-header.md) — Level / stage title header banner — a compact ink badge displaying the current level number, an optional title, a flat-slate XP progress bar with a `value / max XP` mono readout, and an optional next-unlock label.
- [`tc-level-select`](./specs/tc-level-select.md) — Level / stage selection grid with SVG edge connections between nodes. Each node can be locked, completed, or selected; optional star ratings show best performance.
- [`tc-line-chart`](./specs/tc-line-chart.md) — Inline-SVG line chart plotting multiple series on shared axes, with grid hairlines, axis tick labels, point markers, hover tooltips, and an optional toggle legend.
- [`tc-linked-providers-card`](./specs/tc-linked-providers-card.md) — Section card listing OAuth providers with custom icons and brand colors.
- [`tc-list`](./specs/tc-list.md) — Generic vertical selectable list with icon, label, and optional meta cells. Styled to the toolcase design system.
- [`tc-list-card`](./specs/tc-list-card.md) — Dashboard card rendering a list of items with optional ranking numbers, leading icons, and trailing values. Purely presentational; no events.
- [`tc-list-group`](./specs/tc-list-group.md) — Vertical list of items.
- [`tc-list-row`](./specs/tc-list-row.md) — Single selectable list row (leading media, label, trailing value/action). Styled to the toolcase design system. The host is the interactive element: `role="option"`, `tabindex="0"`, `aria-selected`, `aria-disabled`.
- [`tc-live-feed`](./specs/tc-live-feed.md) — Vertical feed of timestamped events with optional header bar, REC indicator, and auto-scroll. Events are set via the `events` JS property (array of `FeedEvent`). Newest events appear at the bottom.
- [`tc-lobby`](./specs/tc-lobby.md) — Multiplayer lobby panel showing player slots, ready state, and start controls. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners, JetBrains Mono for machine-facing text, ink accent for primary actions.
- [`tc-logo-cloud`](./specs/tc-logo-cloud.md) — Grid of logos with an optional section title, optional grayscale filter, and optional per-logo links. Set logos via the `logos` JS property. All logos sit flush on the page surface — no boxes, no shadows, `border-radius: 0`.
- [`tc-loot-list`](./specs/tc-loot-list.md) — A list of loot / drop entries with optional rarity tiers. Items are set via the JS `items` property. Rarity is communicated by a 3 px left-edge accent per row.
- [`tc-loot-popup`](./specs/tc-loot-popup.md) — Modal loot window with Take All / Discard and optional auto-fade timer. Styled to the slate design system (sharp corners, 1px hairline, overlay-tier shadow).
- [`tc-lore-text`](./specs/tc-lore-text.md) — Flavor / lore body-copy block. Slot-based — used for tooltips, loading screens, codex entries, or any italic narrative aside. Styled to the web-components design system: sharp corners, 1px hairline left border, Inter italic prose.
- [`tc-main-menu`](./specs/tc-main-menu.md) — Main-menu container of menu items. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners, JetBrains Mono for machine-facing labels, ink accent for the selected item. Items are set via the JS `items` property.
- [`tc-maintainer-card`](./specs/tc-maintainer-card.md) — Profile card of a maintainer with a circular avatar, name heading, optional role sub-label, optional location line, optional bio paragraph, a row of social-link icon buttons, and a sponsor button.
- [`tc-manufacturer-tile`](./specs/tc-manufacturer-tile.md) — Brand tile for manufacturer grids and filter rails (the `manufacturer` lookup table of a vehicle catalog).
- [`tc-marquee`](./specs/tc-marquee.md) — Horizontally scrolling content banner. Items loop seamlessly at a configurable speed and direction. Scrolling is automatically disabled under `prefers-reduced-motion` (the element becomes a static, scrollable row instead).
- [`tc-matchmaking-screen`](./specs/tc-matchmaking-screen.md) — Matchmaking / searching status panel with a state indicator ring, eyebrow + title header, optional meta strip (Mode, Region, Elapsed, ETA), and accept/cancel action buttons.
- [`tc-menu-item`](./specs/tc-menu-item.md) — Single interactive menu row — icon, label, optional hotkey badge, selected/disabled states.
- [`tc-metal-button`](./specs/tc-metal-button.md) — Primary call-to-action button styled to the toolcase design system. The button renders with slate neutrals, sharp corners (`border-radius: 0`), a 1px hairline border, and the ink primary gradient for the `primary` variant.
- [`tc-metric-card`](./specs/tc-metric-card.md) — Dashboard card showing a prominent metric with optional icon chip, subtitle, and inline SVG sparkline. Purely presentational — no events.
- [`tc-metric-grid`](./specs/tc-metric-grid.md) — CSS-grid container for metric tiles with configurable column count (2, 3, or 4). Tiles can be supplied as a JS `items` array or as light-DOM children (`tc-metric-tile` elements or equivalent markup).
- [`tc-metric-tile`](./specs/tc-metric-tile.md) — Compact presentational card showing a single metric — a mono uppercase micro-label, a large value figure, an optional unit suffix, an optional leading icon, and an optional hint line. No interactive targets; purely data-display.
- [`tc-migration-guide`](./specs/tc-migration-guide.md) — Step-by-step migration guide with a version transition header (from → to version labels) and numbered steps, each with an optional description and before/after code diff panels. Purely presentational — no interactive targets, no events.
- [`tc-minimap`](./specs/tc-minimap.md) — Positioned-marker map surface with a fixed player dot at the centre. World coordinates (`world-x`, `world-y`, `world-width`, `world-height`) define the visible bounds; entity markers are projected onto the surface proportionally.
- [`tc-model-family-card`](./specs/tc-model-family-card.md) — Card for one `model_family` row of a vehicle catalog — manufacturer eyebrow, range title, a machine-facing mono lineage breadcrumb `RANGE / SERIES / GENERATION`, and a meta row with a body-type chip (lucide icon + humanized enum label), a…
- [`tc-network-status-icon`](./specs/tc-network-status-icon.md) — 4-bar signal-strength indicator for connectivity / network quality. Bar count and tier are computed from ping latency and packet loss; the optional label shows the ping value or offline state.
- [`tc-node-editor`](./specs/tc-node-editor.md) — A framework-free canvas node/graph editor.
- [`tc-normal-map-generator`](./specs/tc-normal-map-generator.md) — Interactive height→normal map generator. Loads a source image, computes a tangent-space normal map from a luminance emboss + alpha bevel heightmap (Sobel gradient, all in JS), and renders the result on a layered canvas stage.
- [`tc-objective-marker`](./specs/tc-objective-marker.md) — Absolutely-positioned world-space marker with a map-pin glyph, optional label, and formatted distance readout (metres / kilometres). Drop it inside a `position: relative` container and set `x`/`y` to world coordinates.
- [`tc-page-footer`](./specs/tc-page-footer.md) — Full-site footer with brand column, navigation menu columns, social icon links, optional CTA block, and a legal bar. All data is supplied via attributes and JS properties — no events emitted.
- [`tc-page-indicator`](./specs/tc-page-indicator.md) — Dot page-navigation widget. Renders one circular button per page; clicking or pressing Enter/Space on a dot selects that page and fires `tc-select`.
- [`tc-panel`](./specs/tc-panel.md) — A themed surface panel — a lightweight container with an optional 1px hairline border and optional header. Compose `tc-panel-header` as a first child to add a heading row.
- [`tc-panel-header`](./specs/tc-panel-header.md) — The header sub-element for `tc-panel`. Renders a heading row with an optional Lucide icon on the left and an optional action slot on the right. Gains a bottom hairline divider automatically when inside a `tc-panel--bordered` panel.
- [`tc-particle-emitter`](./specs/tc-particle-emitter.md) — Canvas-based DOM particle-burst emitter. Each time the `burst` attribute changes to a new value (or the imperative `burst()` method is called), a wave of square particles radiates from the centre of the canvas and fades out under configura…
- [`tc-party-panel`](./specs/tc-party-panel.md) — Party member panel with portraits, health, and status. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners, JetBrains Mono for machine-facing text, ink accent for host badge.
- [`tc-pause-menu`](./specs/tc-pause-menu.md) — In-game pause overlay with a full-screen backdrop, an optional eyebrow + title header, a keyboard-navigable menu-item list, and a primary Resume button.
- [`tc-perk-picker`](./specs/tc-perk-picker.md) — Grid of selectable perk cards with selected and locked states. Perks are supplied via the `perks` JS property; each card shows an optional icon tile, a name, and an optional description. Fires `tc-select` on click, Enter, or Space.
- [`tc-phase-grid`](./specs/tc-phase-grid.md) — CSS-grid of phase/timeline cards with status indicators, optional description, tag chips, and a shell-command block. Status is conveyed by icon + text label (not color alone). No events emitted — purely presentational.
- [`tc-physics-editor`](./specs/tc-physics-editor.md) — Physics shape editor for polygons / circles / boxes drawn over an image background, with full undo/redo history.
- [`tc-pie-chart`](./specs/tc-pie-chart.md) — Inline-SVG pie or donut chart showing a percentage distribution with an interactive (hoverable + toggleable) legend and an optional donut centre label.
- [`tc-ping-display`](./specs/tc-ping-display.md) — Compact network-latency readout: a status pip square plus a JetBrains Mono millisecond value, colour-coded by tier. Styled to the toolcase design system (slate neutrals, sharp corners, `--bs-ping-display-*` custom properties).
- [`tc-pinned-feature-showcase`](./specs/tc-pinned-feature-showcase.md) — Two-column showcase with a sticky/centred left panel and a scrollable right-side item list. The left panel can hold a heading group, optional media (image or slotted content), and optional CTAs.
- [`tc-pipeline`](./specs/tc-pipeline.md) — Horizontal pipeline / steps visualization with numbered markers, titles, and three states: `default`, `live`, and `complete`. The live step displays a pulsing ring animation; the complete step shows a lucide check icon.
- [`tc-placeholder`](./specs/tc-placeholder.md) — Loading skeleton placeholder.
- [`tc-platform-icon`](./specs/tc-platform-icon.md) — Inline platform badge combining a Lucide glyph and an optional JetBrains Mono label. Covers PC, PlayStation, Xbox, Nintendo, Steam, Mobile, and Web. No shadow root; light DOM; `display: inline-flex`.
- [`tc-player-card`](./specs/tc-player-card.md) — Player summary card showing a player name, optional title, presence status pip, rank badge, level, a stats grid, and action buttons.
- [`tc-player-frame`](./specs/tc-player-frame.md) — Player nameplate / HUD frame combining a portrait tile (glyph + optional level badge), a player name, an optional class label, and up to three stacked resource bars (HP always shown; MP and Stamina shown via boolean attributes).
- [`tc-plugin-grid`](./specs/tc-plugin-grid.md) — Responsive grid of plugin cards. Each card displays a logo (image or lucide icon), plugin name, description, monospace install command with a copy affordance, and a formatted download count.
- [`tc-portrait`](./specs/tc-portrait.md) — Standalone character portrait frame. Displays a glyph (emoji, initials, unicode symbol, or image URL) with an optional level badge strip at the bottom and an optional colored ring outline accent.
- [`tc-press-any-key`](./specs/tc-press-any-key.md) — "Press any key to continue" prompt. Renders a pulsing mono text label that fires `tc-continue` on any non-modifier keydown (document-level) or mousedown on the element.
- [`tc-pricing-card`](./specs/tc-pricing-card.md) — Pricing tier card with a feature list, action button, and optional highlight/badge. Sharp corners everywhere; the highlight variant adds a 135° slate-ink top cap and a stronger `--tc-app-accent` border.
- [`tc-progress`](./specs/tc-progress.md) — Progress bar.
- [`tc-pulse-indicator`](./specs/tc-pulse-indicator.md) — Animated pulsing status dot with a text label. Defaults to `--tc-success` green (live/online indicator). The ring is a subtle `::after` expand-and-fade loop (~1.6s). The `paused` attribute freezes the ring for idle/offline states.
- [`tc-quest-tracker`](./specs/tc-quest-tracker.md) — On-screen quest-objectives tracker. Renders a header title, a list of named quests, and per-quest objective rows with a checkbox indicator, label, optional badge, progress count, and a 3 px progress bar.
- [`tc-queued-file`](./specs/tc-queued-file.md) — File-queue item row displaying a leading file icon, the file name with extension, a rectangular format badge, and a human-formatted byte size.
- [`tc-quick-start`](./specs/tc-quick-start.md) — Numbered step-by-step guide with optional code snippets and output sections. Each step has a circular numbered marker connected by a vertical rail line. Code blocks include an optional copy button that dispatches a `tc-copy` event.
- [`tc-radial-wheel`](./specs/tc-radial-wheel.md) — Modal radial (pie) item / ability selector. A fixed-position overlay displaying a circular disc with options arranged radially. Hovering an option shows its label in the center of the disc.
- [`tc-rank-cell`](./specs/tc-rank-cell.md) — Zero-padded rank number with tier accent for top-three positions. Gold for rank 1, silver for 2, bronze for 3, neutral slate for rank 4 and above.
- [`tc-rarity-chip`](./specs/tc-rarity-chip.md) — Mono uppercase rarity label chip for item tiers: Common, Uncommon, Rare, Epic, Legendary, and Mythic.
- [`tc-resource-bar`](./specs/tc-resource-bar.md) — Value/max resource bar for a game HUD (HP, mana, stamina, …) — an ink fill over a flat slate track.
- [`tc-result-screen`](./specs/tc-result-screen.md) — Match / round result screen: a centred region with a mono uppercase eyebrow, a status-toned title, a short hairline divider, an optional subtitle, a column of hairline-separated stat rows, a soft reward strip, and a wrapped row of action b…
- [`tc-rich-page-header`](./specs/tc-rich-page-header.md) — Page-level hero element with an optional square icon tile, chip row, title (`<h1>`), subtitle, description, and a trailing actions area. The icon tile is decorative (`aria-hidden`) — status meaning is conveyed by visible text.
- [`tc-roadmap`](./specs/tc-roadmap.md) — Kanban or stacked roadmap board with status columns (`shipped` / `in-progress` / `planned` / `considering`) and a per-column item count badge.
- [`tc-rune-corner`](./specs/tc-rune-corner.md) — Decorative corner accent for absolutely-positioned framed surfaces. Voiced for the web-components design system — flat ink L-shaped clip. Purely presentational — no events, no slots.
- [`tc-score-display`](./specs/tc-score-display.md) — Score readout HUD — a prominent JetBrains Mono value with an optional mono micro-label and an optional multiplier chip. Purely presentational; attribute-driven with no slots.
- [`tc-scoring-rules`](./specs/tc-scoring-rules.md) — Presentational list of scoring rules with optional icons, titles, descriptions, point values, and optional accent color markers. Set rules exclusively via the `rules` JS property. Non-interactive — no hover state, no events.
- [`tc-scroll-text`](./specs/tc-scroll-text.md) — Scrollable text panel with an optional mono uppercase title header. Drop any HTML content into the default slot; set `max-height` to enable a scrollable viewport. Styled to the slate design system.
- [`tc-section-card`](./specs/tc-section-card.md) — Card wrapper with a header containing an optional icon chip, title, and a named `action` slot. Body content is distributed via the default (unnamed) slot. Supports a `danger` variant for destructive/alert sections.
- [`tc-section-flag`](./specs/tc-section-flag.md) — Section header with a slate-ink accent marker bar, a title (rendered as an `<h2>` heading), and an optional subtitle. Supports left (default) and center alignment. All cosmetics are overridable via `--bs-section-flag-*` custom properties.
- [`tc-settings-category-list`](./specs/tc-settings-category-list.md) — Settings sidebar panel with a left-side category nav and a right-side slotted content area. Categories are driven by the `categories` JS property; the active category is tracked via `selected-id`; clicking a tab fires `tc-select`.
- [`tc-shake-container`](./specs/tc-shake-container.md) — rAF-driven camera-shake wrapper that translates its slotted content with a decaying random offset.
- [`tc-shop-panel`](./specs/tc-shop-panel.md) — Shop UI with an item grid, prices, optional discounts, and buy/sell actions. Styled to the toolcase design system — slate neutrals, sharp corners, 1px hairlines, JetBrains Mono for prices and currency. No Shadow DOM.
- [`tc-simple-file`](./specs/tc-simple-file.md) — File icon tile displaying a format-specific lucide glyph alongside the file name and extension. Sharp corners (`border-radius: 0`); slate neutrals throughout; extension rendered in JetBrains Mono uppercase.
- [`tc-skeleton`](./specs/tc-skeleton.md) — Loading-state placeholder with a slate shimmer animation and configurable shape. Three variants: `text` (1em-tall line rows), `circle` (equal width/height, 50% radius), and `rect` (sharp rectangle). `count` repeats the placeholder bar.
- [`tc-skill-bar`](./specs/tc-skill-bar.md) — A horizontal toolbar of ability-card slots. Each slot is composed from `tc-ability-card` and driven entirely by the `slots` JS property. Clicking or pressing Enter/Space on a slot fires `tc-activate`.
- [`tc-skill-tree`](./specs/tc-skill-tree.md) — Node-graph skill tree with prerequisite edges, locked/unlocked/selected states, rank counters, and an optional remaining-points readout.
- [`tc-slices-card`](./specs/tc-slices-card.md) — Dashboard card with a donut/pie chart and a labeled legend. Driven by a JS property array of slices. Purely presentational — no events.
- [`tc-sparkline`](./specs/tc-sparkline.md) — Compact inline SVG micro-chart for quick trend display. Renders as a `<svg>` with `display: inline-block`, suitable for embedding within metric rows, prose, or dashboard cards. Supports line (polyline + endpoint dot) and bar (column) types.
- [`tc-spinner`](./specs/tc-spinner.md) — Animated loading indicator.
- [`tc-sponsor-wall`](./specs/tc-sponsor-wall.md) — Sponsor logos organised by tier with an optional wall title and per-logo links. Logos rest greyscale/muted and lift to full colour on hover. No shadow DOM — renders into light DOM.
- [`tc-sprint-chain`](./specs/tc-sprint-chain.md) — Timeline/chain visualization of sprint items with past, current (now), and future states. Renders as an ordered list with circular node markers and hairline connector lines.
- [`tc-stamp`](./specs/tc-stamp.md) — Decorative stamp badge pinned to a corner of a relatively-positioned ancestor element. Uses the status tint palette (soft background + dark emphasis text). Sharp rectangular corners; mono uppercase micro-label type.
- [`tc-stat-card`](./specs/tc-stat-card.md) — Statistic card with label, value, optional icon, delta indicator, helper text, and footer row. Presentational only — no events.
- [`tc-stat-row`](./specs/tc-stat-row.md) — Label + value stat row with an optional trend indicator. Styled to the toolcase design system with slate neutrals, JetBrains Mono values, and 1px hairline separators. Purely presentational; attribute-driven with no events and no slots.
- [`tc-state-machine`](./specs/tc-state-machine.md) — Vertical state-progression display with per-state status markers. States are set via a JS property (`states`). Markers reflect status: done (check icon), active (filled dot with pulse ring), pending (hollow circle), error (alert icon).
- [`tc-stats-screen`](./specs/tc-stats-screen.md) — End-of-match statistics panel. Styled to the toolcase design system: slate surface, sharp corners, 1px hairline borders, JetBrains Mono for machine-facing stat values, muted prose palette for labels.
- [`tc-status-card`](./specs/tc-status-card.md) — Dashboard card showing a list of status indicator rows. Each row has a colored circle indicator (with an inline icon for non-color accessibility), a label, and an optional right-aligned detail. Purely presentational; no events.
- [`tc-status-dot`](./specs/tc-status-dot.md) — Colour-coded status indicator dot with an optional text label and an optional pulsing ring animation. Uses semantic status colours (`online` → success green, `busy` → danger red, `away` → warning amber, `offline` → slate/neutral).
- [`tc-subtitle`](./specs/tc-subtitle.md) — Subtitle / secondary heading text line. Styled to the toolcase design system: slate neutrals, sharp corners, 1px hairline border (boxed variant), JetBrains Mono for the optional speaker micro-label.
- [`tc-table`](./specs/tc-table.md) — Flexible data table with sortable columns, loading skeletons, and optional row-click handlers.
- [`tc-tag`](./specs/tc-tag.md) — Badge-like rectangular tag with color variants and an optional remove button. Sharp corners (`border-radius: 0`).
- [`tc-team-list`](./specs/tc-team-list.md) — List of team members rendered as gradient avatar tiles, names, optional emails, and optional role chips. Purely presentational — no events, no slots; driven entirely by the `members` JS property.
- [`tc-terminal-window`](./specs/tc-terminal-window.md) — Styled terminal/console window with macOS-style chrome (three traffic-light dots + a centered title), command prompts, and an optional character-by-character typing animation.
- [`tc-testimonial-carousel`](./specs/tc-testimonial-carousel.md) — Shows one testimonial at a time on a white card, with prev/next arrow controls and a row of dot indicators. Prev/next wrap around; clicking a dot jumps to that slide.
- [`tc-text`](./specs/tc-text.md) — Flexible text element with semantic HTML tags and style variants. Renders as a `<p>`, `<span>`, `<small>`, or `<div>` controlled by the `as` attribute.
- [`tc-tier-ladder`](./specs/tc-tier-ladder.md) — Ranked tier ladder with color-coded identity dots and a current-tier indicator. Tiers are set via a JS property; the current tier is highlighted with an ink-accent left marker and a check icon.
- [`tc-timeline`](./specs/tc-timeline.md) — Vertical timeline of chronological events. Items are set via the JS `items` property (array of `TimelineItem` objects).
- [`tc-title`](./specs/tc-title.md) — Large display title text for hero sections, screen headings, and prominent labels. Styled to the toolcase design system: slate neutrals, sharp corners. Slot content is the title text; `size` overrides the font size in pixels.
- [`tc-trend-indicator`](./specs/tc-trend-indicator.md) — Trend badge with a directional arrow icon and formatted value. Direction is determined by the explicit `direction` attribute or inferred from the numeric sign of `value`. Three sizes scale icon and text together.
- [`tc-tyre-spec`](./specs/tc-tyre-spec.md) — Tyre sidewall readout for the vehicle-catalog `tyre_size` table.
- [`tc-usage-summary-panel`](./specs/tc-usage-summary-panel.md) — Usage-metrics panel with labelled progress bars for resource consumption. Presentational only — no events. Data is provided via the `usage` JS property.
- [`tc-user-panel`](./specs/tc-user-panel.md) — User profile panel with a circular avatar (image or initials chip), a display name, a plan micro-label, and a trailing settings icon button.
- [`tc-variant-spec-sheet`](./specs/tc-variant-spec-sheet.md) — The full technical datasheet of one `model_variant` catalog row: a header (name, muted version, mono slug, production years), a hero strip of big mono dashboard readouts (power PS/kW, 0–100 km/h, top speed, CO₂) in a 1px-gap grid, then gro…
- [`tc-version-label`](./specs/tc-version-label.md) — Corner build / version stamp — a compact JetBrains Mono inline label that shows version, build hash, and branch name separated by `·` dots.
- [`tc-video-embed`](./specs/tc-video-embed.md) — Responsive embedded video player. Detects the provider from the `src` URL: YouTube (`youtube.com` / `youtu.be`), Vimeo (`vimeo.com`), and Loom (`loom.com`) build the correct iframe embed URL (the video id is parsed robustly from the variou…
- [`tc-virtual-list`](./specs/tc-virtual-list.md) — Virtualized list for efficiently rendering very large datasets.
- [`tc-waypoint-marker`](./specs/tc-waypoint-marker.md) — Absolutely-positioned world-space waypoint marker with a configurable Lucide icon glyph, optional label chip, and formatted distance readout (metres / kilometres).
- [`tc-welcome-guide`](./specs/tc-welcome-guide.md) — Onboarding guide with progress tracking and sequential step completion. The active step is auto-derived as the first non-completed step. Locked and completed steps are inert.

### Navigation

- [`tc-breadcrumb`](./specs/tc-breadcrumb.md) — Breadcrumb navigation trail.
- [`tc-cool-nav`](./specs/tc-cool-nav.md) — Responsive navigation bar with collapsible hamburger menu, scroll-detection condensed state, brand slot, right-side slot, and a login CTA.
- [`tc-nav`](./specs/tc-nav.md) — Navigation strip.
- [`tc-nav-button`](./specs/tc-nav-button.md) — Back / close navigation button, styled to the toolcase design system. Renders as a compact square icon button (chevron-left for `back`, × for `close`) with slate neutrals, sharp corners (`border-radius: 0`).
- [`tc-navbar`](./specs/tc-navbar.md) — Responsive navigation bar with built-in collapse behavior.
- [`tc-pagination`](./specs/tc-pagination.md) — Page navigation controls.
- [`tc-scrollspy`](./specs/tc-scrollspy.md) — Scroll-position tracker (IntersectionObserver based).
- [`tc-side-nav`](./specs/tc-side-nav.md) — Vertical navigation menu organised into sections of items, each with an optional lucide icon, a label, and an optional badge. Renders a `<nav>` landmark containing one block per section (optional mono uppercase title + a list of items).
- [`tc-social-links`](./specs/tc-social-links.md) — Horizontal row of social-media icon-button links. Each link is a square icon button with sharp corners, slate neutrals, and accessible labels. Two visual variants (`ghost` / `filled`) and three sizes (`sm` / `md` / `lg`).
- [`tc-stepper`](./specs/tc-stepper.md) — Multi-step progress indicator with completion icons and optional clickable navigation. Steps are set via the JS `steps` property; states are derived from the `active-step` attribute.
- [`tc-tab-bar`](./specs/tc-tab-bar.md) — Horizontal tab switcher bar. Tabs are set via the `tabs` JS property (array of `TabBarItem`). The only chrome is a 2px ink underline on the active tab and a 1px hairline below the whole bar. Supports `sm` and `md` size variants.
- [`tc-tab-sections`](./specs/tc-tab-sections.md) — Tabbed interface with switchable content sections and an optional loading skeleton. Underline tab nav — the only chrome is a 2px ink underline under the active tab. Tabs are set via the `items` JS property (array of `TabSectionItem`).
- [`tc-tree-view`](./specs/tc-tree-view.md) — Hierarchical tree navigation with expand/collapse, optional multi-select checkboxes, and async lazy-loaded branches.
- [`tc-vertical-item-list`](./specs/tc-vertical-item-list.md) — Vertical navigation menu with icons and badges beside an associated content area. Items are set via the `items` JS property (array of `VerticalItemListItem`).

### Overlays & Feedback

- [`tc-blur-overlay`](./specs/tc-blur-overlay.md) — Full-surface backdrop-blur scrim for pause screens and dialog backdrops. Styled to the web-components design system — a slate-ink scrim on the fixed overlay tier (`--tc-z-modal-backdrop`), with sharp edges and no fantasy chrome.
- [`tc-command-palette`](./specs/tc-command-palette.md) — Modal command-search overlay with fuzzy/substring filtering, results grouped by `group`, optional per-item icon and shortcut chips, and full keyboard navigation.
- [`tc-confirm-dialog`](./specs/tc-confirm-dialog.md) — Centred yes/no confirmation modal. Styled to the slate design system (sharp corners, 1px hairline, the single hard overlay shadow). Focus trap, scroll lock, and keyboard handling included.
- [`tc-context-menu`](./specs/tc-context-menu.md) — Right-click / long-press context menu with nested submenu support and full keyboard navigation (ArrowUp/Down/Left/Right, Enter, Space, Escape). Fires `tc-select` when a leaf item is chosen.
- [`tc-debug-overlay`](./specs/tc-debug-overlay.md) — Dev/perf overlay rendering an fps readout and key/value stat lines on a dark, machine-facing panel (JetBrains Mono, sharp corners, 1px hairline border, overlay-tier shadow).
- [`tc-dialogue-box`](./specs/tc-dialogue-box.md) — NPC dialogue box with an optional speaker name and a typewriter body line, plus an optional list of choice buttons. Built to the design system — a flat slate surface, sharp corners, a 1px hairline border, and an overlay-tier shadow.
- [`tc-drawer`](./specs/tc-drawer.md) — Slide-out panel with focus trap, keyboard handling, and optional pinned mode. Controlled component — fires `tc-close` when the user requests dismissal; the consumer sets `open` to `false` to actually close.
- [`tc-invite-toast`](./specs/tc-invite-toast.md) — Transient invite popup pinned to the top-right corner, overlay tier. Styled to the slate design system (white surface, sharp corners, 1px hairline, an ink accent stripe, the single hard overlay shadow).
- [`tc-letterbox-bars`](./specs/tc-letterbox-bars.md) — Animated cinematic letterbox bars for cutscenes and reveal transitions. Styled to the web-components design system — flat `var(--tc-ink)` bars.
- [`tc-lightbox`](./specs/tc-lightbox.md) — Modal image gallery with keyboard/swipe navigation, a thumbnail strip, captions, and focus management. Controlled component — fires `tc-close` when the user requests dismissal; the consumer sets `open` to `false` to actually close.
- [`tc-loading-overlay`](./specs/tc-loading-overlay.md) — Full-surface loading overlay with a spinner ring, optional label, determinate or indeterminate progress bar, and an optional mono tip line. Styled to the toolcase design system: flat slate ink scrim, sharp panel.
- [`tc-loading-screen`](./specs/tc-loading-screen.md) — Full-viewport loading screen with an eyebrow label, optional title, progress bar (determinate or indeterminate), and a cycling tip section.
- [`tc-modal`](./specs/tc-modal.md) — Modal dialog.
- [`tc-module-access`](./specs/tc-module-access.md) — A single role's live permission editor: name, quota limits, and the permission catalog grouped by domain prefix into toggle-chip cards.
- [`tc-offcanvas`](./specs/tc-offcanvas.md) — Offcanvas panel.
- [`tc-popover`](./specs/tc-popover.md) — Popover positioned by Popper.js.
- [`tc-report-dialog`](./specs/tc-report-dialog.md) — Player-report moderation modal with a reason radio group, an optional comment textarea, and Cancel / Submit Report actions. Styled to the slate design system (sharp corners, 1px hairline, overlay-tier shadow, danger-red submit).
- [`tc-screen-flash`](./specs/tc-screen-flash.md) — Full-screen flash effect for damage hits and scene transitions. Styled to the toolcase design system: no shadow DOM — a flat fill `<div>` that JS animates from a peak opacity back to transparent.
- [`tc-title-screen`](./specs/tc-title-screen.md) — Full-viewport game title / start screen. Covers the entire viewport when present in the DOM; add or remove it (or toggle `[hidden]`) to show or hide it.
- [`tc-toast`](./specs/tc-toast.md) — Toast notification.
- [`tc-tooltip`](./specs/tc-tooltip.md) — Tooltip positioned by Popper.js.
- [`tc-transition-wipe`](./specs/tc-transition-wipe.md) — Full-screen scene-wipe transition overlay. Styled to the toolcase design system: no shadow DOM — a flat-fill `<div>` that CSS transitions in/out when the `[show]` attribute is toggled.
- [`tc-vignette-overlay`](./specs/tc-vignette-overlay.md) — Edge vignette overlay for damage feedback, cinematic framing, or low-health UI.

### Forms

- [`tc-card-options`](./specs/tc-card-options.md) — Grid of selectable card options (radiogroup). Options are set via the `options` JS property. Fires `tc-change` when the selection changes. Fully keyboard-accessible: Arrow keys move selection, Enter/Space confirms.
- [`tc-character-create`](./specs/tc-character-create.md) — Character-creation panel: a character-name field plus a data-driven list of appearance/class fields (text, select, number, range) and a confirm action.
- [`tc-character-select`](./specs/tc-character-select.md) — Roster / character-selection screen: a grid of selectable character tiles (square portrait + name + role) paired with a detail panel that shows the active character's role, description, and stats.
- [`tc-check`](./specs/tc-check.md) — Checkbox input.
- [`tc-checkbox-group`](./specs/tc-checkbox-group.md) — Coordinated group of checkboxes with an optional group label, inline layout, disabled per-option support, and required validation. Options are set via the `options` JS property. Fires `tc-change` when the selection changes.
- [`tc-chip`](./specs/tc-chip.md) — Compact interactive chip/tag with optional leading icon, trailing count badge, and remove button. Built as a real `<button>` so it participates in keyboard navigation.
- [`tc-chip-group`](./specs/tc-chip-group.md) — Grouped set of interactive chip buttons with an optional title, subtitle, and hairline border frame. Composes `tc-chip` internally — one chip per item in the `items` JS property.
- [`tc-color-picker`](./specs/tc-color-picker.md) — Color picker dropdown with a preset swatch grid, a hex text input, and selection management.
- [`tc-combo-box`](./specs/tc-combo-box.md) — A trigger button with a filterable dropdown of options. Clicking the trigger opens an overlay popover with a search field and a listbox; typing filters the options by `label`, `value`, or `keywords`.
- [`tc-date-picker`](./specs/tc-date-picker.md) — Native HTML5 date input wrapper with optional label, min/max constraints, and `tc-change` event.
- [`tc-early-signup-form`](./specs/tc-early-signup-form.md) — Email signup panel with a benefits list, inline validation, and a confirmation success state. Set `benefits` via JS property. Fires `tc-submit` on valid email submission, then switches to the success state.
- [`tc-editable-text`](./specs/tc-editable-text.md) — Inline editable label — looks like plain text at rest, reveals a form-control border on hover/focus. Commits on Enter or blur; reverts to the last committed value on Escape without firing a change event.
- [`tc-extended-select`](./specs/tc-extended-select.md) — Searchable dropdown with debounced filtering (150 ms), keyboard navigation, optional item descriptions, and native form-submission support via a hidden `<input>`. Implements the combobox/listbox ARIA pattern.
- [`tc-file-dropzone`](./specs/tc-file-dropzone.md) — Drag-and-drop upload zone with optional supported-format chips. Fires a `tc-files` custom event (and calls the `onFiles` callback) with the selected `File[]` array on both drop and native file-picker selection.
- [`tc-file-tags`](./specs/tc-file-tags.md) — Tag picker that renders selected tags as removable chips with a searchable dropdown to add more. Supports readonly mode (static chips, no add/remove controls).
- [`tc-floating-label`](./specs/tc-floating-label.md) — Floating label wrapper for text input, textarea, or select.
- [`tc-form`](./specs/tc-form.md) — Form wrapper with HTML5 constraint validation.
- [`tc-form-input`](./specs/tc-form-input.md) — Universal form-input dispatcher. The `type` attribute selects which native control to render, with built-in validation, a helper line, a danger-toned error line, and full ARIA wiring.
- [`tc-form-wizard`](./specs/tc-form-wizard.md) — Multi-step form wizard with a tab-strip header, scrollable content body, and Back / Next / Complete footer. Steps are set via the JS `steps` property.
- [`tc-fps-cap-select`](./specs/tc-fps-cap-select.md) — A preset FPS-cap picker: a label/description text block paired with a native `<select>` of frame-rate presets.
- [`tc-fullscreen-toggle`](./specs/tc-fullscreen-toggle.md) — A fullscreen on/off setting row: a label/description text block paired with a pill-track switch (`role="switch"`, pure-circle knob — the checked track carries the signature slate-ink gradient).
- [`tc-graphics-preset-picker`](./specs/tc-graphics-preset-picker.md) — A low / medium / high / ultra graphics-preset setting row: a label/description text block paired with a segmented preset button group (one hairline frame, 1px internal separators, sharp corners, mono uppercase labels — the active segment c…
- [`tc-helper-text`](./specs/tc-helper-text.md) — Contextual helper text with a leading lucide icon. Pair with form inputs via `aria-describedby`.
- [`tc-icon-picker`](./specs/tc-icon-picker.md) — Searchable icon-grid dropdown for selecting a lucide icon by name.
- [`tc-input`](./specs/tc-input.md) — Text input field. Form-associated — add `name` to participate in `<form>` submission, `form.reset()`, and `form.checkValidity()`.
- [`tc-input-group`](./specs/tc-input-group.md) — Input with prepended/appended addons.
- [`tc-json-editor`](./specs/tc-json-editor.md) — Schema-driven form editor for JSON objects.
- [`tc-json-schema-def`](./specs/tc-json-schema-def.md) — Visual editor for defining JSON schema properties. Renders an optional editable schema-name field, a list of property rows, and an "add property" button.
- [`tc-label`](./specs/tc-label.md) — Semantic form label with optional required indicator and info-icon tooltip.
- [`tc-markdown-editor`](./specs/tc-markdown-editor.md) — Split-pane markdown editor with Write/Preview tabs and a formatting toolbar.
- [`tc-mouse-sensitivity`](./specs/tc-mouse-sensitivity.md) — A mouse-sensitivity setting row: a label/description text block paired with one or two native range sliders (main + optional ADS, each spanning 0.1–5 with 0.05 steps) and mono decimal readouts.
- [`tc-multi-card-select`](./specs/tc-multi-card-select.md) — Multi-select card grid (checkgroup pattern). Options are set via the `options` JS property; selected values via the `value` JS property. Fires `tc-change` when the selection changes.
- [`tc-newsletter-signup`](./specs/tc-newsletter-signup.md) — Email subscription form with async status management. Drives its own state (`idle → submitting → success` or `error`) from the optional `onSubmit` Promise. Fires `tc-submit` on valid submission.
- [`tc-number-input`](./specs/tc-number-input.md) — Controlled numeric input with increment/decrement steppers, arrow-key support, min/max clamping, precision formatting, and optional prefix/suffix addons.
- [`tc-otp-input`](./specs/tc-otp-input.md) — One-time-password input with per-digit cells, paste support, keyboard navigation, and optional masked mode.
- [`tc-phone-input`](./specs/tc-phone-input.md) — International phone input with a searchable country-selector dropdown, dial-code prefix, and native form submission support via a hidden input.
- [`tc-radio`](./specs/tc-radio.md) — Radio button input.
- [`tc-radio-group`](./specs/tc-radio-group.md) — Group of radio buttons with optional label, inline layout, disabled options, and roving-tabindex keyboard navigation. Form-associated — add `name` to participate in `<form>` submission and `form.reset()`.
- [`tc-range`](./specs/tc-range.md) — Range slider input.
- [`tc-range-slider`](./specs/tc-range-slider.md) — Dual-handle range slider with an optional label, ticks, tooltips, and full keyboard navigation. The selected segment between handles is filled with the ink accent. No slots — all configuration is via attributes and the `value` JS property.
- [`tc-rating`](./specs/tc-rating.md) — Interactive star rating with optional half-stars, keyboard navigation, custom icons, size variants, and a read-only display mode.
- [`tc-reset-to-defaults`](./specs/tc-reset-to-defaults.md) — A two-step reset action row: a label/description text block paired with a Reset button that enters a confirmation state (Confirm reset + Cancel). Confirming fires `tc-reset` and returns to idle; cancelling discards without firing.
- [`tc-select`](./specs/tc-select.md) — Select dropdown input. Form-associated — add `name` to participate in `<form>` submission and `form.reset()`.
- [`tc-select-row`](./specs/tc-select-row.md) — A generic labeled dropdown setting row: a label/description text block paired with a native `<select>` whose options are supplied via the `options` JS property.
- [`tc-setting-slider`](./specs/tc-setting-slider.md) — A generic range-slider setting row: a label/description text block paired with a native `<input type="range">` and a mono readout, plus an optional mute button.
- [`tc-single-card-select`](./specs/tc-single-card-select.md) — Single-selection card grid (radiogroup pattern). Options are set via the `options` JS property; the selected key is the `value` attribute (controlled). Fires `tc-change` when the selection changes.
- [`tc-slider`](./specs/tc-slider.md) — Single-handle range slider with full keyboard navigation, optional tick marks, a value tooltip, custom value formatting, and an error state. The track segment from `min` to the current value is filled with the ink accent.
- [`tc-switch`](./specs/tc-switch.md) — Toggle switch (styled checkbox). Form-associated — add `name` to participate in `<form>` submission. Submits its `value` attribute (default `"on"`) when checked, or nothing when unchecked.
- [`tc-tag-input`](./specs/tc-tag-input.md) — Tag input with autocomplete recommendations and optional create-on-type. A form-surface control holds committed tag chips and a text field; typing filters the `recommendations` pool (excluding already-selected tags) into an overlay listbox.
- [`tc-textarea`](./specs/tc-textarea.md) — Multi-line text input. Form-associated — add `name` to participate in `<form>` submission, `form.reset()`, and `form.checkValidity()`.
- [`tc-time-picker`](./specs/tc-time-picker.md) — Time picker with a scrollable column interface (hours, minutes, optional seconds, plus an AM/PM column in 12-hour mode). Selecting cells composes a canonical 24-hour time string.
- [`tc-toggle`](./specs/tc-toggle.md) — Atomic standalone on/off switch — a pill-track with a sliding circular knob. The host element IS the switch: it carries `role="switch"`, `aria-checked`, and handles click + Space/Enter.
- [`tc-toggle-card`](./specs/tc-toggle-card.md) — Clickable card with an integrated toggle switch for on/off states. The whole card is the click target — clicking anywhere (or pressing Space/Enter while focused) flips the switch and fires `tc-change`.
- [`tc-toggle-row`](./specs/tc-toggle-row.md) — A generic labeled boolean toggle setting row: a label/description text block paired with a pill-track switch (`role="switch"`, pure-circle knob — the checked track carries the signature slate-ink gradient).
- [`tc-version-picker`](./specs/tc-version-picker.md) — Version selector rendered as a segmented button group or a native-style dropdown. Each version may be annotated `latest`, `lts`, or `deprecated`.
