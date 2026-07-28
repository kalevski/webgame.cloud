# Landing page

> The public front door — one scrolling page that explains the product and takes an email.
>
> Part of the WebGame Cloud proposal — see `README.md` in this directory for the full list.

---

## What this page is for

Everything else in this directory is behind a login. This page is not. It has exactly two jobs:

1. Make a developer understand, in under fifteen seconds, that this is a console that takes their
   game's assets and hands back a published, versioned build on a CDN.
2. Capture an email address.

It is **not** a documentation site, not a blog, and not a dashboard preview. Anything that does not
serve one of those two jobs is cut.

The page ships during **alpha** — there is no console to log into yet. So the primary call to action
is *Get early access*, not *Sign in*, and every claim on the page is written to survive the moment
the product actually launches (see *Claims and honesty*).

---

## Who is actually reading it

Three people land here, and they read the page in three different orders. The layout has to serve all
three without three layouts.

| Visitor | How they arrive | What they do | What they need |
| --- | --- | --- | --- |
| **The solo dev** | A link in a game-dev Discord, on a phone, half-distracted | Reads the headline, scrolls fast, stops at the price | The word `FREE` reachable in two thumb-flicks, and a free tier that is not insulting |
| **The studio lead** | A search, on a desktop, evaluating three tools this afternoon | Skims for the one capability their pipeline needs, then checks seat limits | The feature checklist to be scannable and honest, and team/quota numbers stated plainly |
| **The sceptic** | Sent by someone else, arrives suspicious | Looks for the catch — who runs this, is it abandoned, what happens to my art | The alpha badge, the footer (GitHub, Discord, a real mailbox, DMCA), and the storage promise |

The solo dev is the primary target, so the page optimises for **fast vertical scanning**: short lines,
numbers over adjectives, no band that needs to be read to be understood. The studio lead is served by
making the features band a *list*, not prose. The sceptic is served by the footer being complete and
the alpha badge being loud.

---

## The scroll contract

The page is a sequence of promises, each one due at a specific scroll depth. Miss the deadline and the
visitor is gone — the tab closes before the argument finishes.

| Depth | The visitor must already know | Guaranteed by |
| --- | --- | --- |
| **0%** — before any scroll | What it is, who it is for, that there is a way in | Hero headline + primary CTA above the fold, on a 360×640 phone |
| **~1 flick** | That other people use it and it is fast | Stats bar sitting immediately under the hero |
| **~2 flicks** | The actual workflow, in six words per step | How it works |
| **~50%** | Whether their specific need is covered | Features checklist |
| **~75%** | The price, and that there is a free tier | Pricing |
| **bottom** | What they get for an email, and how to reach a human | Early access + footer |

**The fold is a hard constraint, not a guideline.** On the narrowest supported viewport the headline,
one line of body copy, and the primary button must all be visible without scrolling. If the hero grows
past that, the hero is wrong — not the constraint.

---

## The shape of the page

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WEBGAME.CLOUD·[alpha]    How it works  Features  Pricing  [Get early ▸] │  1  sticky
├─────────────────────────────────────────────────────────────────────────┤
│  SHIP HTML5 GAMES FASTER…              ┌───────────────────────────┐    │
│  The all-in-one platform for           │ ● Live build   world.js   │    │
│  HTML5 game developers                 ├───────────────────────────┤    │  2  hero
│  Upload assets, build optimized…       │                           │    │     (split)
│  [Get early access]  [See features]    │      blueprint canvas     │    │
│                                        └───────────────────────────┘    │
├──────────────────────┬──────────────────────┬───────────────────────────┤
│ 99.99%               │ 200+                 │ < 5s                      │  3  stats
│ GLOBAL UPTIME        │ DEVELOPERS WAITING   │ LIVE ROLLOUTS             │
├──────────────────────┴──────────────────────┴───────────────────────────┤
│  ▌From raw assets to live players, in one console                       │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                              │  4  how it
│  │01 Assets  │ │02 Builds  │ │03 Pipeline│   ← 03 carries the pipeline  │     works
│  ├───────────┤ ├───────────┤ ├───────────┤     strip, 06 the CDN map    │
│  │04 Config  │ │05 Studio  │ │06 CDN     │                              │
│  └───────────┘ └───────────┘ └───────────┘                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  Asset library ─────────────────────────────   │
│  │  ▌Everything your   │  Bitmap fonts & dialogues ───────────────────  │  5  features
│  │  studio needs       │  Localization ──────────────────────────────   │     (pinned
│  │  [ screenshot ]     │  Configs & schemas ─────────────────────────   │      left)
│  └─────────────────────┘  … scrolls past the pinned panel               │
├─────────────────────────────────────────────────────────────────────────┤
│      ┌──────────┐    ┌══════════┐    ┌──────────┐                       │
│      │  Indie   │    ║ POPULAR  ║    │  Studio  │   ← middle card is    │  6  pricing
│      │  FREE    │    ║ $6.99/mo ║    │ $49.99/mo│      capped + raised  │
│      └──────────┘    └══════════┘    └──────────┘                       │
├─────────────────────────────────────────────────────────────────────────┤
│ ███ Sign up early. Keep 250 MB free, forever.       [ email ] [Reserve] │  7  signup
│ ███ ✓ 250 MB free · ✓ one email only · ✓ no tracking                    │     (dark)
├─────────────────────────────────────────────────────────────────────────┤
│ WEBGAME.CLOUD   Product   Community   Legal          ⌗ GitHub ⌗ Discord │  8  footer
│ © 2026 webgame.cloud — All rights reserved       Terms · Privacy · DMCA │
└─────────────────────────────────────────────────────────────────────────┘
```

Eight bands, one route (`/`), anchor-scrolled. That order is the argument — promise → proof →
mechanism → coverage → price → ask. Do not reorder it. Bands can be **dropped** (a band with nothing
true to say is cut, not padded), but a later band never moves above an earlier one.

---

## Band by band

### 1 — Nav

Sticky, condenses on scroll. Wordmark left, three anchors centre, one CTA right.

- Wordmark: **`WEBGAME.CLOUD`** with an `alpha` badge beside it. The badge is not decoration — it sets
  expectations for every claim below it, and it is the one element deleted at launch.
- Anchors: **How it works** · **Features** · **Pricing**. Three, never more.
- CTA: **Get early access** — scrolls to band 7 and focuses the email input. In alpha it is *not* a
  route change; there is nowhere to go. At launch it becomes **Log in**, pointing at the console.

On narrow viewports the anchors collapse into the hamburger; the CTA stays outside it, always visible.

### 2 — Hero

| Slot | Copy |
| --- | --- |
| Eyebrow | `Ship HTML5 games faster, from one console` |
| Headline | **The all-in-one platform for HTML5 game developers** |
| Body | `Upload assets, build optimized bundles, tweak live configs, and push updates to every player — all from one dashboard. The backend your game needs, without building it yourself.` |
| Primary action | `Get early access` |
| Secondary action | `See features` |

The headline names the audience — **HTML5 game developers** — in the headline itself. A developer
deciding whether to keep scrolling is asking *is this for me*, not *is this good*. Answer the first
question first.

The body lists four verbs in pipeline order — *upload, build, tweak, push* — the same order as band 4,
so the page teaches its own vocabulary before using it. The last clause, *"without building it
yourself"*, is the real pitch: every studio has written a worse version of this and knows it.

Layout is the **two-column blueprint split**: copy left, a framed preview panel right. Until real
console screenshots exist, use the built-in blueprint canvas rather than a mockup that will date
badly — an honest abstraction beats a fake screenshot.

### 3 — Stats bar

Three figures, hairline-separated, immediately under the hero.

| Value | Label |
| --- | --- |
| `99.99%` | global uptime — multi-region edge CDN |
| `200+` | developers on waitlist since alpha announcement |
| `< 5s` | live rollouts — config change to player |

One infrastructure number, one social-proof number, one speed number. The mix answers *is it
reliable*, *does anyone else want it*, *is it fast* in a single glance. Three is the count: two reads
as thin, four as padding.

### 4 — How it works

Heading: **From raw assets to live players, in one console.**

Six numbered cards. One line of title, one line of subtitle — no paragraphs anywhere in this band.

| # | Title | Subtitle |
| --- | --- | --- |
| 01 | Asset library | `Upload, tag, and organize every asset` |
| 02 | Optimized builds | `Create build-ready bundles in seconds` |
| 03 | End-to-end pipeline | `Upload → filter → build → deploy → rollback` |
| 04 | Live config | `Type-safe live tweaks, no redeploys` |
| 05 | Studio collaboration | `Invite your whole studio` |
| 06 | CDN distribution | `Edge delivery to every region your players live in` |

These map one-to-one onto the specs in this directory (`02-asset-files`, `03-bundles`, `04-builds`,
`06-config-data`, `01-projects-and-permissions`, `05-build-machine`). **Keep them in sync.** If a
feature spec changes what the product does, this band is wrong until it is edited.

Card 03 gets the horizontal pipeline strip — it is the one card describing a *sequence* rather than a
place. Card 06 gets the CDN node map. The other four stay text-only; a band where every card has a
visual has no emphasis left to spend.

### 5 — Features

Heading: **Everything your studio needs to ship a game.**

Nine named capabilities, as a sticky-panel showcase: heading and screenshot pinned left, list scrolling
right.

`Asset library` · `Bitmap fonts & dialogues` · `Localization` · `Configs & schemas` ·
`Optimized builds` · `Build lifecycle` · `Project dashboard` · `Studio collaboration` ·
`Plans, billing & usage`

This band is for the studio lead scanning for one specific thing. It is a **checklist, not a pitch** —
names and one-liners, no persuasion. Anything not yet built is simply absent; there is no
"coming soon" row. A roadmap on a landing page reads as an admission that the product is not ready.

### 6 — Pricing

Heading: **Plans that grow with your game.**

Three cards. The middle one is highlighted and carries the `POPULAR` flag.

| | **Indie** | **Indie+** | **Studio** |
| --- | --- | --- | --- |
| Price | `FREE` | `$6.99` / month | `$49.99` / month |
| For | `For solo developers prototyping their first game` | `For developers shipping real games to real players` | `For studios shipping multiple titles at scale` |
| Storage | `100 MB` — enough for a small prototype | `2 GB` — room for production assets | `10 GB` — additional storage: $3/GB |
| Projects | `1` — one game, fully managed | `3` — manage a small portfolio | `∞` — manage your catalog |
| Bundles | `1` — one optimized asset pack | `3` / project — per-platform packs | `∞` / project — flexible asset packs |
| Live configs | `2` — basic realtime tuning | `10` / project — balance, economy & events | `∞` — full live-ops flexibility |
| Team members | — | `3` / project — small team collaboration | `∞` / project — your whole studio |
| Support | — | — | `Priority support` — fast response times |

Under the cards: *"Bandwidth fair-use; we'll reach out before any throttle"*.

Three rules hold here:

- **Every line is a quota that actually exists.** Storage, projects, bundles-per-project,
  configs-per-project and team-members-per-project are the metered resources in
  `07-storage-and-quotas.md` and `01-projects-and-permissions.md`. The pricing table is a *view of the
  limit table* — if the two disagree, the page is lying to a paying customer.
- **Each limit carries a plain-English gloss.** `2 GB` means nothing alone; *"room for production
  assets"* tells a developer whether it fits them. The number is the fact, the gloss is the
  translation.
- **The rows align across all three cards.** A tier that lacks a row shows it struck through rather
  than omitting it, so the eye can compare horizontally. Ragged pricing cards force the visitor to
  re-read, and re-reading is where they stop.

The fair-use line exists because bandwidth is the one cost that cannot be capped by a row count.
*"We'll reach out before any throttle"* is a promise the product has to keep.

### 7 — Early access

The conversion band, and the only place on the page that takes input.

| Slot | Copy |
| --- | --- |
| Heading | **Sign up early. Keep 250 MB free, forever.** |
| Benefit | `250 MB free tier — for life, just for signing up before launch` |
| Benefit | `One email only — sent the day the console goes live` |
| Benefit | `No tracking, no resale — your address stays in our launch list` |
| Field | `Your email address*` |
| Opt-in | `Send me the occasional product update` (unchecked by default) |
| Button | `Reserve my spot` |
| Helper | `We'll only contact you once: when the platform is ready for you to log in` |

The offer is concrete — **250 MB free forever**, two and a half times the free plan's 100 MB — and it
is a real entitlement the billing system must honour, not a marketing line. Whoever builds the waitlist
owes the plan system a grandfathered storage grant keyed off the signup date.

The three benefits answer the three reasons someone does not type their email: *what do I get*, *how
often will you mail me*, *who else gets my address*. The marketing opt-in is separate from the launch
mail and **starts unchecked** — the launch email is transactional and needs no consent; anything
beyond it does.

This is the one band rendered on the dark ink surface. After six light bands the contrast does the
work an exclamation mark would otherwise be asked to do.

On success the panel swaps in place to a confirmation. No redirect, no modal, no page reload.

### 8 — Footer

Four link groups plus a legal bar.

- Product: `How it works` · `Features` · `Pricing` · `Early access`
- Community: `GitHub` · `Discord`
- Contact: a real mailbox
- Legal: `Terms of Service` · `Privacy Policy` · `DMCA`
- Legal line: `© 2026 webgame.cloud — All rights reserved`

The footer is the sceptic's band. A GitHub link, a Discord invite and a human mailbox are the cheapest
credibility on the page — and DMCA is not decoration on a platform hosting uploaded art and audio: it
is the address a rights-holder complaint has to arrive at. The three legal documents are their own
static routes (`/terms`, `/privacy`, `/dmca`), never modals.

---

## Visual language

The page inherits the toolcase voice wholesale — **slate neutrals, sharp corners, 1px hairlines,
almost no shadow**. It should look like an instrument panel, not a SaaS brochure. Two typefaces do all
the work:

| Role | Face | Where |
| --- | --- | --- |
| Prose — headline, body, feature names | Inter, weight ≤ 600 | Everything a human reads as a sentence |
| Machine-facing — numbers, prices, tags, wordmark, micro-labels | JetBrains Mono, uppercase, letter-spaced | Stats values, prices, eyebrows, band commands, the legal line |

That split *is* the brand: prose in the humanist face, anything measurable in the mono face. A price is
mono. A promise is not.

**Weight never exceeds 600.** Hierarchy comes from size, case and space — not from black text. If a
heading is not standing out, it needs more room above it, not more weight.

**Band rhythm.** Bands alternate between the plain surface and the muted surface so the eye can count
them while scrolling; hairline dividers do the rest. Two bands break the rhythm on purpose: the hero
(blueprint grid backdrop) and early access (dark ink). Those are the two moments that matter — the
promise and the ask — and they are the only two places the page raises its voice.

**Colour budget: four appearances, page-wide.**

| Where | Colour | Why it earns it |
| --- | --- | --- |
| Brand dot in the nav wordmark | rare cyan accent | The one identity mark |
| One highlight PoP on the CDN map | rare cyan accent | Makes the map read as a map, not a texture |
| Included-feature glyphs in pricing | success green | The only place the page says *yes* |
| Form validation error | danger red | The only place the page says *no* |

Everything else is the slate ramp. Primary buttons are slate ink, not a colour — a page where the CTA
is the only saturated element does not need a saturated palette to point at it. If a fifth colour
appears, something else has to give it up.

**Sharp corners everywhere** (`border-radius: 0`), including the buttons, the cards and the input.
Rounded corners in one band and square in another is the fastest way to make a page look assembled
from parts.

**Imagery is UI, not illustration.** Screenshots of the console, the blueprint canvas, the CDN map —
no stock art, no mascots, no gradient blobs. The product is a tool; the page should look like the tool.

---

## Rules that hold across the page

**One `<h1>`** — the hero headline. Every band heading below it is an `<h2>`. This is both the document
outline and the SEO structure; never pick a heading tag for its size.

**Two CTA targets, no more.** *Get early access* (nav, hero, footer CTA) all scroll to band 7; *See
features* scrolls to band 5. A landing page with five competing destinations converts on none of them.

**Copy lives in one place.** Every string reads from the strings config, like the rest of the app.
Marketing copy changes more often than product copy — exactly why it must not be scattered through JSX.

**Numbers over adjectives.** `< 5s` beats *blazing fast*; `10 GB` beats *generous storage*; `200+`
beats *a growing community*. When there is no number, say the mechanism instead of reaching for an
adjective — *"no redeploys"* is a fact, *"seamless"* is not.

**Nothing on this page requires JavaScript to read.** Content is static markup. JS drives the sticky
condense, the anchor scroll and the signup form — nothing else. A first-time visitor on a slow
connection must see the headline and the price before the bundle lands.

**No third-party requests. At all.** No analytics tag, no chat widget, no font CDN, no tracking pixel,
no embedded video. Fonts are self-hosted and subset. This is not only a performance rule: band 7
promises *"no tracking, no resale"*, and the page must not contradict itself in its own network tab.

**Motion is decorative and optional.** The live-step pulse, the scroll condense and hover lifts all
freeze under `prefers-reduced-motion`. Nothing animates the reader's position for them, ever.

**Mobile keeps the order.** Every band collapses to one column in the same sequence. Nothing is hidden
on small screens — least of all pricing, which is what the phone visitor scrolled down to find.

| Viewport | What changes |
| --- | --- |
| ≥ 1200px | Full layout as drawn. Hero split, features pinned, pricing three-up |
| 992–1199px | Hero split holds; how-it-works drops to two columns |
| 768–991px | Hero stacks (copy above preview); features un-pins to a plain list; pricing wraps to 2 + 1 |
| < 768px | Everything single-column; nav anchors collapse to the hamburger; stats bar stacks to three rows; pricing stacks with the highlighted tier **first** |

---

## Claims and honesty

The page is published while the product is in alpha, which makes it easy to write sentences that are
not yet true. Three guards:

- **A number is either live or sourced.** `200+ developers on waitlist` is a real count from the
  waitlist table, rounded down and updated when it moves. Never render a live-looking figure that is a
  hard-coded guess.
- **`99.99%` and `< 5s` are commitments, not aspirations.** They belong on the page only once the build
  machine and CDN in `05-build-machine.md` support them. If they do not yet, the band shows fewer
  stats — an empty slot is cheaper than a broken promise.
- **The `alpha` badge stays until there is a console to log into.** It is the honest frame around
  everything else; removing it is a deliberate launch step, not a cleanup.

---

## What never goes on this page

Every item below has a reason it is tempting and a reason it is refused.

| Never | Because |
| --- | --- |
| Testimonials from people who have not used it | The product is in alpha. An invented quote is the fastest way to lose the sceptic — and they are reading the footer looking for exactly this |
| A logo wall of studios that are not customers | Same, but legally worse |
| A roadmap or "coming soon" column | Turns a features checklist into a list of things that do not work |
| A countdown timer or "only N spots left" | There is no scarcity; inventing it insults a technical audience |
| A cookie banner | Only needed because of trackers this page refuses to load. No trackers, no banner |
| A newsletter modal on exit intent | Band 7 already asks. Asking twice is asking worse |
| An autoplaying video or a carousel | Both take the reader's position away from them |
| A live chat widget | A third-party script, an unstaffed promise, and a mobile CTA that covers the pricing card |
| Documentation, API references, blog teasers | Different jobs, different pages. This page has two jobs |
| Dashboard data of any kind | The page is public. There is no user, no project, no build to show |

---

## Behaviour

The one interactive surface is the signup form.

| Concern | Rule |
| --- | --- |
| Endpoint | A single unauthenticated `POST` — email plus the marketing-opt-in boolean. The only public write on the page |
| Duplicate email | Succeeds. A returning visitor sees the same confirmation, not *"already registered"* — that leaks who is on the list |
| Rate limit | Per-IP, DB-backed, the same mechanism as every other abusable route. A public write with no limit is a public mailbox |
| Bot traffic | A hidden honeypot field; a submission that fills it gets the confirmation state and is discarded. No CAPTCHA — it costs the honest visitor more than it costs the bot |
| Validation | Client-side format check for instant feedback; server-side check as the real gate |
| Failure | An error inside the panel, sticky until dismissed, with the typed address preserved. Never clear the field on failure |
| Success | The panel swaps to its confirmation state and moves focus to the confirmation heading |
| Storage | Email, opt-in flag, timestamp, source. Nothing else — the promise in band 7 constrains the schema |

**Metadata.** One `<title>`, one description, an OG/Twitter card image rendered from the hero, a
canonical URL, and a `theme-color`. The card image is what actually gets seen when the link is pasted
into Discord — treat it as a ninth band, not an afterthought. If an FAQ band is added later it emits
`FAQPage` JSON-LD; nothing else on the page does structured data.

---

## Budgets

Numbers, so the page can fail a check rather than a taste argument.

| Budget | Target | Enforced by |
| --- | --- | --- |
| Largest contentful paint | < 1.5s on a throttled 4G phone | Hero copy is text, not an image; the hero panel never lazy-loads |
| Cumulative layout shift | < 0.05 | Fixed dimensions on every screenshot; stats values present in the initial markup, not filled in by JS |
| Total transfer | Under a few hundred KB gzipped, fonts included | Two subset woff2 faces, preloaded; screenshots below the fold lazy-load |
| Third-party requests | **0** | The no-third-party rule above |
| Contrast | 4.5:1 on body copy, 3:1 on large text and UI edges | Slate ramp used at its documented steps; the dark band checked as carefully as the light ones |
| Keyboard | Every anchor, button and field reachable and visibly focused | Native elements throughout; the focus ring is never removed |
| Screen reader | Bands are landmarks with accessible names; the stats bar reads as value-then-label pairs | Real headings, real `<section>` elements, no text baked into images |
| Touch targets | ≥ 44px on coarse pointers | Applies to the nav CTA and the signup button in particular |

Pricing figures are **text, never an image** — a screenshotted price cannot be read aloud, translated,
searched, or edited without a designer.

---

## Launch-day diff

What changes the day the console opens. Keeping this list here means launch is an edit, not a redesign.

| Element | Alpha | At launch |
| --- | --- | --- |
| Nav badge | `alpha` | Removed |
| Nav CTA | `Get early access` → scrolls to band 7 | `Log in` → the console |
| Hero primary | `Get early access` | `Start free` → sign-up |
| Hero secondary | `See features` | `See features`, unchanged |
| Band 7 | Waitlist form | Replaced by a short sign-up CTA, or removed entirely |
| `200+ waitlist` stat | Waitlist count | Swapped for a shipped-games or builds-run figure |
| 250 MB grant | Promised | Already granted to every waitlist address; the copy goes away, the entitlement does not |

---

## Screens & components

Screen: **Landing — `/`** (public, no auth guard, no store slice)

```
pages/LandingPage.tsx      route shell — meta tags, no layout wrapper
  └ modules/Landing*.tsx   one module per band — static content, tc-* elements
      └ services/WaitlistService.ts   the single POST
```

The layering is thinner than the rest of the app on purpose: seven of the eight bands are static, so
they need no slice and no service. Only band 7 talks to the API, and it calls its service directly — a
zustand slice for one fire-and-forget POST is ceremony without payoff.

Three rules apply to every band:

- **Boolean props need `value || undefined`** so the attribute is absent when off.
- **Object props and custom events go through `useTc<HTMLElement>(props, events)`** — assign the
  returned ref. Everything set via a JS property (`items`, `stats`, `steps`, `phases`, `features`,
  `menus`, `nodes`, `benefits`) is passed this way, not as an attribute.
- **No permission gating anywhere on this page.** Unlike every other screen in this directory there is
  no `request.can` equivalent — the whole page is public. Correspondingly it must never render a single
  row of real project, user or build data.

Read the matching component spec before using a `tc-*` element; attribute names and event payloads are
per component.

| Band | Component | Notes |
| --- | --- | --- |
| Nav | `tc-cool-nav` | `sticky`; `items` JS property for the three anchors; `login-label="Get early access"`. Scroll-condense is built in via `scroll-offset` |
| Alpha badge | `tc-badge` | Beside the wordmark, in the `brand` slot |
| Hero | `tc-hero` | `preview` + `backdrop="grid"` for the blueprint split; `primaryAction` / `secondaryAction` JS properties; the `tc-action` event carries `which` |
| Stats bar | `tc-hero-stats-bar` | `stats` JS property — `{ label, value, unit }`. Zero values self-mute, which is exactly why an unsourced stat is omitted rather than faked |
| Band headings | `tc-section-flag` | `title` + `subtitle`; `align="center"` for the marketing bands |
| How it works | `tc-phase-grid` | `columns="3"`, `phases` JS property. Status is `complete` for shipped steps — never `upcoming` on a marketing page |
| Step 03 visual | `tc-pipeline` | `steps` JS property: upload → filter → build → deploy → rollback |
| Step 06 visual | `tc-cdn-map` | `nodes` JS property with `top`/`left` percentages; exactly one `accent` node — that is one of the page's four colour appearances |
| Features | `tc-pinned-feature-showcase` | `eyebrow` / `title` / `description` attributes, `items` JS property (title + icon), screenshot via the `media` slot |
| Feature detail | `tc-feature-card` | Only if a band-5 item needs its own card; `size="wide"` for two-up rows |
| Pricing | `tc-pricing-card` ×3 | `features` and `action` JS properties; `highlight` + `badge-text="POPULAR"` on Indie+. Absent lines use `{ label, included: false }` rather than being dropped, so the rows align across cards |
| Early access | `tc-early-signup-form` | `benefits` JS property; `tc-submit` gives `{ email }`; the component owns validation and the success state. `variant="dark"` for the ink band |
| Footer | `tc-page-footer` | `menus`, `socialLinks`, `legalLinks` JS properties; `legal-text` for the copyright line |

Two components are on the table only if the copy earns them: `tc-faq-list` (adds JSON-LD for free) and
`tc-logo-cloud` (only once there are real studios to name — see *What never goes on this page*).

---

## Definition of done

- [ ] Headline, one line of body, and the primary button visible on a 360×640 viewport without
      scrolling
- [ ] Every pricing figure matches the seeded limits in `07-storage-and-quotas.md` and
      `01-projects-and-permissions.md`
- [ ] Every how-it-works card matches a feature spec in this directory
- [ ] Exactly one `<h1>`; heading levels descend without gaps
- [ ] Network tab shows zero third-party hosts
- [ ] Page readable with JavaScript disabled — headline through pricing
- [ ] Signup: happy path, duplicate email, invalid email, honeypot, and rate-limited response all
      produce a sane visible state
- [ ] Colour appears in four places, and no more
- [ ] Keyboard-only pass reaches every link, the email field and both buttons, with a visible ring
- [ ] `prefers-reduced-motion` pass shows no movement anywhere
- [ ] The alpha badge is present, and the launch-day diff above is still accurate
