# Landing page and waitlist

`/` renders the public marketing page for a signed-out visitor and redirects to the dashboard when a
session exists — in every deployment, with no env switch. `/terms`, `/privacy` and `/dmca` are the public
legal routes; their copy is clearly-marked placeholder text pending review.

## Signup

`POST /api/public/waitlist` is the only public **write** in the codebase, so it keeps the DB-backed
limiter (5/hour/IP) and is exempt from the envelope and the CSRF origin guard. Order matters inside
`WaitlistService.signup`: honeypot first (a non-empty `website` returns the same 204 and writes nothing),
then format validation, then the rate limit, then a revive-upsert. It always answers 204 — telling a
visitor "already registered" leaks who is on the list.

`granted_bytes` (250 MB) is stored per row rather than read from a constant, so the promise cannot be
changed retroactively for people who already signed up. `consent_version` records which opt-in sentence
was shown; an opt-in boolean with no record of what was agreed to is not a consent record.

## The 250 MB grant

`WaitlistService.claimGrant(user)` runs from `AuthService` on **every** sign-in, not just the first: the
address that joined the waitlist is often not the address the SSO provider returns, and a
first-sign-in-only check would silently drop the grant. It writes a `user_limit_overrides` row raising
`storage_mb` to `max(planLimit, grantedBytes / 1MB)` — an existing per-user override, not a new subsystem.

Because an override is absolute, it is **recomputed on plan change** too, so an upgrade to a bigger plan is
not capped back down to 250 MB. Staff can also apply a grant by hand from the waitlist row
(`POST /api/admin/waitlist/:id/grant`) for the case where the addresses never match.

Staff read the list at `GET /api/admin/waitlist` behind `waitlist.read`, with keyset paging because the
table is unbounded.

## The page

`modules/Landing.tsx` renders the whole marketing route from `tc-*` components; the copy lives in
`strings.landing` and `strings.waitlist`, never inline. Section order, top to bottom:

1. `tc-announcement-bar` — Discord CTA band, tinted to Discord blurple (`#5865f2`) through
   `--bs-banner-bg` / `--bs-banner-border-color` / `--bs-banner-cta-color`.
2. `tc-cool-nav` (sticky) — `tc-brand` in the `brand` slot, three centred anchors, and the
   component's own login CTA (`login-label` + the `onLogin` property), not a hand-placed button.
3. `tc-hero` — eyebrow, display headline, description, two actions with lucide icons, scattered
   `bgIcons` (`FileJson`, `FileMusic`, `File`, `Gamepad2`, `Joystick`, `Image`, `Server` — the
   reference's icon set, expressed in lucide because `bgIcons` resolves names, never image URLs),
   `backdrop="grid"`. The actions are wired through the `onPrimaryAction` / `onSecondaryAction`
   properties — primary scrolls to `#early-access`, secondary to `#features`. There is no `onAction`
   property; setting one is a silent no-op and the buttons do nothing.
4. `LandingMetrics` (`components/LandingMetrics.tsx`) — **two** app-owned cards, not `tc-metric-grid`.
   See *The two instrument cards* below.
5. `#how-it-works` — section head, `tc-tab-sections` (three audience tabs, controlled from React), and
   six `tc-feature-card`s laid out on the grid (`row g-4` → `col-lg-6` ×2, `col-12`, `col-lg-4` ×3).
   Each card's `slot="visual"` carries, in order, `tc-asset-row-list` / `tc-bundle-bar` /
   `tc-pipeline` / `tc-config-preview` / `tc-team-list` / `tc-cdn-map`, and each tab supplies its own
   assets, chips, pipeline, config entries and team.
6. `#features` — one `tc-pinned-feature-showcase`. The component owns the two-column sticky layout;
   the `media` slot holds `web/public/imgs/features_showcase.svg` above the asset list, and the two
   `tc-cool-button`s go in the `ctas` slot. Its alt text lives in `strings.landing.featuresDiagramAlt`
   like every other string on the page.

   The diagram is **hand-authored SVG**, not a raster: it reads left to right as assets (textures,
   audio, data) → the webgame.cloud server stack → one optimized bundle → players on desktop, gamepad
   and mobile, and it is drawn in the landing's own palette (ink `#0f172a`, muted `#94a3b8`, violet
   `#b429fa` on the bundle and the delivery arrows). Vector means it stays crisp at any column width —
   the earlier PNG was a 950×340 line drawing being downscaled into a ~550 px column, which muddied
   every stroke. Note the sizing trap that came with it: `w-100` plus an intrinsic `height="340"`
   held the rendered height at 340 px while the width shrank to 550, squashing the drawing to a 1.62
   ratio against its natural 2.79. Images scaled by width need `h-auto` alongside `w-100`.
7. `#pricing` — `tc-pricing-card` per plan from `publicConstants.plans`; absent when billing is off.
8. `#early-access` — `LandingSignup` supplies copy, the live waitlist count and the POST;
   `components/EarlyAccessPanel.tsx` is the UI. It is the one **custom** component on the page, and
   it exists because the offer needs a shape the library does not have — see *The allocation rail*.
9. `tc-page-footer` — `tc-brand` in the `brand` slot, two menu columns (Product, Community), social
   links, legal bar.

Layout is composed from `tc-container` / `tc-row` / `tc-col` rather than raw utility classes:
`<tc-row gutter="4" align="stretch">` with `<tc-col span="12" span-lg="6">` and friends. One caveat —
`tc-container` is not in the package's `display: block` reset, so it computes to `display: inline` and
its `max-width` does nothing. `styles/_utilities.scss` sets `tc-container { display: block }`; without
it every section runs to the viewport edge.

## The allocation rail

The early-access offer is a quota — 250 MB, kept for life — so the panel is built as an allocation,
not as a form with a headline. Twenty-five blocks sit along the base of the panel, one per 10 MB, and
they are the section's signature: on a successful reservation they fill left to right in a staged
sweep (24 ms per block, ~700 ms total), the counter in the header flips `0 / 250 MB` → `250 / 250 MB`,
the status pip turns green and the eyebrow flips from *Early access* to *Reserved*. The stagger is a
per-block `transition-delay: calc(var(--block-index) * 24ms)`; `prefers-reduced-motion` collapses it
to an instant fill. Nothing else in the panel animates.

**The panel is light**, and it earns its presence as a surface rather than by inverting: white card on
a faint violet grid (`8%` on two linear-gradients, echoing the hero's `backdrop="grid"` and the CDN
map), hairline registration marks at the four corners so it reads as an engineering sheet, and the
form in a plain white well lifted by a single soft shadow. Unclaimed rail blocks are paper with a
violet-tinted top edge — on the old dark ground an empty rail read as dead grey; on paper it reads as
slots waiting. Mono (`--tc-font-mono`) is reserved for labels that carry numbers (eyebrow, quota,
field label, rail caption); Inter carries everything that carries meaning. The panel introduces no new
typeface: this section sits inside a page whose type system already exists, and a third family would
read as noise.

Its colours are inherited, not redeclared: the panel maps a small `--ea-*` set onto the theme's
`--bp-*` tokens with literal fallbacks, so retinting the theme retints the panel.

`EarlyAccessPanel` owns its markup and its stylesheet (`styles/components/_early-access-panel.scss`),
so the landing no longer mirrors the package's 26 dark `--bs-early-signup-form-*` tokens — that
exception is gone, along with `tc-early-signup-form` itself. The component is store-agnostic: it takes
`copy`, `reservedCount` and an `onReserve(email, optIn, honeypot)` promise, and owns only its own form
state. The honeypot field and the marketing opt-in (a `tc-switch`) live inside the form, which is what
made the library component unusable here. `--bs-page-footer-padding-x` is set to
   `max(2rem, calc((100% - 1400px) / 2 + 0.75rem))` so the footer's content lines up with the
   `.container` above it instead of running to the viewport edge. Contact addresses were removed —
   the Discord and GitHub links carry that traffic.

## Palette: the sunset theme

**The app is wrapped in `<tc-theme name="blueprint" variant="sunset">` (`Router.tsx`)** — that wrapper
is the colour source of truth for the console *and* the landing. **The landing declares no colours of
its own.** It carries no `--wg-*` palette, no Sass colour variables and no hex literals outside the
Discord bar; every colour in `_landing.scss` and `_early-access-panel.scss` is a `var(--bp-*)` /
`var(--tc-*)` read from that theme.

The page runs on **two hues plus the theme's ink**:

| Token | Value | Where it comes from | Role |
| --- | --- | --- | --- |
| `--bp-pink` | `#ff7e5f` | blueprint + `sunset` | Coral. Primary fills, eyebrows, hover edges, seam |
| `--bp-pink-hover` | `#feb47b` | blueprint + `sunset` | The gradient's second stop only |
| `--bp-teal` | `#0aa89a` | blueprint base, **restored** on `.module-landing` | The cool counterweight — ticks, tints, secondary buttons |
| `--bp-teal-fg` | `#097f74` | blueprint base, restored | Text-safe teal: "passed / included" states |
| `--bp-text` / `--bp-text-muted` / `--bp-emphasis` | theme | Body, muted, headings |
| `--bp-bg-2` / `--bp-paper` / `--bp-paper-tint` | theme | Section, card and well grounds |

The single deliberate deviation from the variant: **`sunset` swaps blueprint's teal family to amber**
(`--bp-teal: #ffb020`), which would leave the page monochromatic warm. `.module-landing` restores the
whole `--bp-teal-*` / `--bp-success-*` family — plus `--tc-accent-hex`, `--tc-cyan`, `--tc-success`,
`--bs-success` — to blueprint's base `#0aa89a`, and rebuilds `--bp-glow-field` from the two hues. That
block is the only colour declaration on the route.

**Buttons.** The primary CTA is a `--bp-pink-grad` pill (`#ff7e5f → #feb47b`, the variant's own
gradient) with a **white label** and the theme's `--bp-glow-pink` shadow, lifting on hover and settling
on `:active`. Secondary buttons are paper pills outlined in `--bp-teal` with a `--bp-teal-fg` label.
**No black buttons anywhere.**

Contrast: white on `#ff7e5f` measures **2.5:1**, below AA — it is an explicit product decision, not an
oversight. Ink (`--bp-emphasis`) on the same fill measures 9.0:1 if the CTA ever needs to pass. Muted
and body text on the theme's grounds, `--bp-teal-fg` on paper (4.9) and white on Discord blurple (4.6)
are all AA.

### Announcement bar

Discord blurple `#5865f2` — **the one hex literal the route keeps**, held as `--wg-discord` on the bar
itself, because it is a third-party brand mark and not part of the page palette. Full width, square
(`--bs-banner-border-radius: 0`, overriding blueprint's `--bp-r-lg`), contents centred
(`justify-content: center` with `flex: 0 0 auto` on the icon, copy and CTA so they group in the middle
rather than spreading). The CTA is a solid white pill with a blurple label — the earlier
translucent-white version failed contrast.
Copy names the destination: *"Building a browser game? Come hang out with us on Discord." → Join the
Discord*.

### Removed in this pass

- **The hazard stripe.** It read as a warning band, which is the wrong signal above a sign-up.
- **The pulsing lamp glow.** Only two animations remain on the page and both are component-native (the
  config preview's live dot; the hero's own eyebrow dot, which the landing hides).
- **Black buttons**, replaced as described above.

### Overriding a themed component

Blueprint styles components through selectors like
`[data-tc-theme=blueprint] tc-announcement-bar.tc-banner .tc-banner-content`. Two rules follow:

- **Match or beat the theme's specificity** — carry the host class (`tc-announcement-bar.tc-banner-announce`);
  app.scss loads after the package, so a tie wins.
- **Check the host actually carries the class.** `tc-cool-nav` and `tc-announcement-bar` set classes on
  their host; `tc-page-footer` and `tc-hero` do **not**, so `tc-page-footer.tc-page-footer …`
  silently matches nothing.

## The two instrument cards

`tc-metric-grid` is gone from this route. Three static figures in identical tiles read as filler; two
cards that each *show* their claim read as instruments. `components/LandingMetrics.tsx` +
`styles/components/_landing-metrics.scss` own them.

- **Dropped: "200+ developers on waitlist."** It duplicated the live counter the early-access panel
  already shows, and a vanity number next to two engineering figures weakened both.
- **`99.99% global uptime`** carries a 30-bar uptime histogram in teal. A `metric-sweep` keyframe walks
  a highlight left to right at `55ms` per bar, so the bars read as a live strip rather than a chart.
- **`< 5s live rollouts`** carries a console → player wire: a dashed track between two nodes with a
  coral packet crossing it every 2.8 s (`metric-packet`), fading in at the console end and out at the
  player end.
- Shared details: a 2 px `--wg-seam` on the top edge, two diagonal corner registration ticks (the same
  device as the early-access panel), a pulsing status pip, tabular-figure display numerals in ink, and a
  mono caption rule under the graph. Accent is per-card (`--metric-accent`): teal for uptime, coral for
  rollout.
- Every animation is decorative and sits behind `aria-hidden`; `prefers-reduced-motion` stops all three
  keyframes and freezes the packet mid-track.

## The engine cards

`components/EngineCards.tsx` + `styles/components/_engine-cards.scss`. One `<li>` per engine, keyed by
`engine.key` from `strings.landing.engines` — the key drives the badge artwork, so adding an engine means
adding a key in two places (strings, `LOGOS`) or it falls back to the canvas mark.

**Phaser and PixiJS show real vendored logo files; plain canvas keeps a hand-authored SVG mark.** The
logos are local PNGs under `web/public/imgs/` (no external requests) mapped by the `LOGOS` record, sized
in CSS at roughly a third of their native resolution so they stay sharp on high-DPI screens:

- **Phaser** — `phaser-planet-small.png` (222×192, palette-quantized), rendered up to 46×42 inside the
  soft coral badge chip.
- **PixiJS** — `pixijs-logo-transparent-light.png` (735×289), the white-on-transparent wordmark. It is
  invisible on the card's white paper, so the pixi badge alone widens to 108px and fills solid with
  `--engine` teal to give the wordmark a contrasting chip.
- **Plain canvas** — a framed grid with a polyline that draws itself via `stroke-dasharray` /
  `engine-draw`, with the nib fading in as the stroke lands (`CanvasMark`, drawn in `currentColor`).

Under the copy, each card carries the same **stage strip**: a 16×3 dot grid with a scan pass
(`engine-scan`), tinted per card by `--engine`. The block count is the `STAGE_BLOCK_COUNT` constant; the
layout lives entirely in CSS.

Accent per card is `--engine`: purple for Phaser and pink for PixiJS (each engine's brand colour), ink
for plain canvas — the "no engine" card is deliberately the uncoloured one. A radial `--engine-glow` sits behind the card at `z-index: -1`
and scales on hover, alongside a lift and an accent border. `prefers-reduced-motion` stops every
keyframe and leaves the canvas mark in its finished state.

Prefer remapping a `--bp-*` / `--tc-*` variable over writing a selector.

## Two sections added for the reader, not the layout

- **`#engines` — "It ships whatever you build with."** **Three** cards (Phaser, PixiJS, Plain canvas),
  rendered by `components/EngineCards.tsx`. This is the first question a dev asks about a build service,
  and answering it before pricing removes the main reason to bounce. Three deep cards beat six shallow
  chips: each one now carries a logo (or mark), a mono capability line, a sentence of substance and
  three format tags, so the section reads as an answer rather than a logo wall. See *The engine cards*
  below.
- **`#faq` — five real objections** (card required, what happens if I stop paying, unlisted engines,
  config latency, pre-launch privacy) via `tc-faq-list` with `schema` on, so it also emits FAQPage
  JSON-LD. First item opens by default.

## Gradients

The page carries no background *patterns* — the hero's `backdrop="grid"` is hidden
(`.tc-hero-backdrop { display: none }`) and the early-access panel's graph-paper is gone. What
replaced them is one idea applied consistently rather than scattered effects: **accent light collects
along seams and edges, never in the middle of a surface.** No centred blobs, no mesh, no wash behind
running text.

**Every gradient on the route is a theme token, not a hand-written stop list.** `--bp-pink-grad`
(`#ff7e5f → #feb47b`) and `--bp-teal-grad` come from blueprint; the `sunset` variant supplies the warm
stops, so switching the variant on `<tc-theme>` re-grades the whole page.

- **`--wg-seam`** — one shared token: `transparent → --bp-pink-line → --bp-teal-line → --bp-pink-line →
  transparent`, 1 px tall, full width. It draws the nav's bottom edge, the top of every tinted section,
  the top edge of each instrument card and the top of the footer. One variable, so the device is
  identical everywhere it appears.
- **Hero** — an aurora rising from *below* the fold: `radial-gradient(120% 70% at 50% 116%, --bp-pink-glow …)`,
  so the glow is anchored off the bottom edge and the headline sits on clean paper. A `--bp-teal-glow`
  bloom sits top-right, over the variant's own `--bp-pink-surface`. The hero's flat bottom border is
  replaced by the seam.
- **Tinted sections** (`.bg-light`) — the seam over `--bp-glow-field`, which `.module-landing` rebuilds
  from the two hues (coral top-right, teal bottom-left) because the variant's version is warm on warm.
- **Early access** — a single 135° teal wash (`--bp-teal-glow → --bp-teal-soft → transparent`) over
  paper: one gradient, one hue, so the coral CTA inside it is the only warm thing in the block. The
  form well is lifted by a faint `--bp-pink-soft` downward gradient. Rail blocks carry that same faint
  gradient when unclaimed and flip to `--bp-pink-grad` once reserved.
- **Primary CTA / waitlist submit** — `--bp-pink-grad` with a white label.
- **Engine cards** — a radial `--engine-glow` bleeding in from the bottom-right corner, per-card hue.
- **Highlighted plan** — the card's cap becomes `--bp-pink-grad` via
  `--bs-pricing-card-highlight-cap-bg`.

All of it lives in `_landing.scss` and `_early-access-panel.scss`; no markup changed.

**Element-scoped variable trap.** `tc-hero` declares `--bs-hero-bg: var(--tc-surface)` on the element
itself, so a value inherited from `.module-landing` never wins — the hero silently stayed flat white.
Hero variables must be set inside a `tc-hero { … }` block. The same applies to any `--bs-*` a component
declares on its own host.

## Styling rules for this route

**Layout comes from the component library's Bootstrap-compatible utilities, not from bespoke CSS.**
`container`, `row`/`g-4`/`col-*`, `d-flex`, `gap-*`, `py-5`, `bg-light`, `text-center`, `mb-*` and the
rest ship in `@toolcase/web-components/style.css`. `styles/_utilities.scss` adds only the handful that
package does not carry (`py-7`/`py-md-7`, `fw-*`, `small`, `lead`, `display-5`/`display-6`,
`text-uppercase`, `list-unstyled`, `border`, `rounded-3`, `bg-white`, `min-vh-100`, `font-monospace`).
The app's own `_grid.scss` was deleted — it redefined `.container`/`.row`/`.col-*` and its
`[class^='col-'] { width: 100% }` rule silently defeated the package's responsive columns.

**`styles/modules/_landing.scss` holds tokens and one alignment rule, no layout.** It restores the
teal family on `.module-landing`, sets the hero/showcase/banner/footer `--bs-*` hooks, switches the
subtree to Inter, neutralises the console theme's uppercase display faces on headings and buttons, and
centres the nav's `ul.tc-cool-nav-items`. It declares **no colour values** beyond the teal restore and
the Discord blurple — a new hex in this file is a bug, not a style choice. Everything else — cards, panels, the dark signup band, spacing inside components — is the
package's own styling. When something needs to look different, reach for the component's documented
`--bs-*` custom properties first; do not write selectors against `.tc-*` internals.

Lucide icon names passed to `tc-icon`, `tc-feature-card` and `tc-page-footer` must be **PascalCase**
(`CheckCircle`, `ArrowRight`, `MessageCircle`) — the kebab-case spellings resolve to nothing and the
element renders an empty span with no error.

One live figure comes from the waitlist count; the uptime and rollout figures are static copy in
`strings.landing.metrics` with no source in this repo. No analytics tag, chat widget or font CDN —
the page promises no tracking and must not contradict itself in its own network tab (Inter is
requested from the system stack, never fetched).
