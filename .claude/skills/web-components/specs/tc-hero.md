---
component: tc-hero
---

### tc-hero

Large hero section with an optional eyebrow badge, heading, description, primary and secondary action buttons, a footnote, an optional background pattern or scattered lucide icons, stat cards, and inline metrics. Supplying a media column (`media-src` or `preview`) switches the layout to a two-column **blueprint split**: left-aligned text on the left, a framed preview panel on the right. Without one it stays a centered single column. All content is driven by attributes and JS properties — no slot children.

**Tag:** `tc-hero`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `eyebrow` | string | — | Small uppercase mono label rendered above the title as a bordered badge with a pulsing status dot. |
| `title` | string | — | Main headline text (required for meaningful output). Rendered inside the heading element specified by `title-as`. |
| `title-as` | `h1`\|`h2`\|`h3`\|`h4`\|`h5`\|`h6` | `h1` | Tag name used to render the heading. Controls semantic heading level. |
| `description` | string | — | Body copy rendered beneath the title. |
| `note` | string | — | Small uppercase mono footnote rendered below the actions. |
| `background-pattern-src` | string | — | URL of a background image rendered absolutely behind the hero content. |
| `backdrop` | `grid` | — | Set to `grid` to render a blueprint grid + radial-glow backdrop behind the content. |
| `media-src` | string | — | Image URL rendered inside the right-hand preview panel. Triggers the two-column split. |
| `media-alt` | string | `''` | Alt text for the `media-src` image. |
| `media-label` | string | — | Titlebar status label on the preview panel (rendered with a pulsing dot). |
| `media-caption` | string | — | Right-aligned mono caption in the preview panel titlebar. |
| `preview` | boolean | `false` | When present and no `media-src` is set, renders the built-in decorative blueprint canvas in the preview panel. Triggers the two-column split. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `primaryAction` | `{ label: string; href?: string; onClick?: () => void; icon?: string } \| null` | `null` | Primary action. Rendered as an `<a>` when `href` is set, else a `<button>`. Ink-gradient primary style. Optional `icon` is a lucide name rendered before the label. |
| `secondaryAction` | `{ label: string; href?: string; onClick?: () => void; icon?: string } \| null` | `null` | Optional secondary action. Rendered as an outline button. Optional `icon` is a lucide name rendered before the label. |
| `statCards` | `Array<{ label: string; value: string }>` | `[]` | Row of stat cards displayed below the actions. Values rendered in mono. |
| `metrics` | `Array<{ label: string; value: string }>` | `[]` | Row of inline metric pairs displayed below stat cards. |
| `bgIcons` | `string[]` | `[]` | Array of lucide icon names (PascalCase or kebab-case) scattered faintly behind the content as `aria-hidden` SVGs. |
| `onPrimaryAction` | `(() => void) \| null` | `null` | Callback invoked when the primary action is activated (alongside the `tc-action` event). |
| `onSecondaryAction` | `(() => void) \| null` | `null` | Callback invoked when the secondary action is activated (alongside the `tc-action` event). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-action` | `{ which: 'primary' \| 'secondary' }` | Fired (bubbles, composed) when either action button is clicked. `detail.which` identifies which button was activated. |

**CSS Custom Properties**

All cosmetic values flow through `--bs-hero-*` vars on the `tc-hero` host:

| Variable | Default | Description |
|----------|---------|-------------|
| `--bs-hero-bg` | `var(--tc-surface)` | Section background. |
| `--bs-hero-border-color` | `var(--tc-border)` | Hairline bottom border colour. |
| `--bs-hero-padding-x` | `2rem` | Horizontal body padding. |
| `--bs-hero-padding-y` | `4rem` | Vertical body padding. |
| `--bs-hero-body-max-width` | `64rem` | Maximum width of the inner body container. |
| `--bs-hero-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow text colour. |
| `--bs-hero-title-color` | `var(--tc-text)` | Heading colour. |
| `--bs-hero-title-font-size` | `clamp(2rem, 4vw, 3.5rem)` | Fluid heading size. |
| `--bs-hero-title-font-weight` | `600` | Heading weight (capped at semibold). |
| `--bs-hero-title-font-family` | `inherit` | Heading font family — theme hook (e.g. a display face). |
| `--bs-hero-title-text-transform` | `none` | Heading case — theme hook (e.g. `uppercase` for blueprint). |
| `--bs-hero-description-color` | `var(--tc-text-muted)` | Description text colour. |
| `--bs-hero-eyebrow-dot-color` | `var(--tc-accent)` | Eyebrow status-dot colour. |
| `--bs-hero-note-color` | `var(--tc-text-faint)` | Footnote text colour. |
| `--bs-hero-panel-bg` | `var(--tc-surface)` | Preview panel background. |
| `--bs-hero-panel-border` | `var(--tc-border)` | Preview panel border. |
| `--bs-hero-panel-shadow` | `var(--tc-shadow-lg)` | Preview panel elevation. |
| `--bs-hero-canvas-bg` | `var(--tc-surface-muted)` | Blueprint canvas background. |
| `--bs-hero-grid-line-color` | `var(--tc-border)` | Blueprint floor grid line colour. |
| `--bs-hero-backdrop-line` | `var(--tc-border-faint)` | `backdrop="grid"` grid line colour. |
| `--bs-hero-bg-icon-opacity` | `0.06` | Opacity of scattered background icons. |

**Example**

```html
<tc-hero
  eyebrow="Open Source"
  title="Build faster with toolcase"
  description="Framework-free web components for modern product teams."
  id="hero"
></tc-hero>
<script>
  const hero = document.getElementById('hero')

  hero.primaryAction = { label: 'Get Started', href: '/docs' }
  hero.secondaryAction = { label: 'View on GitHub', href: 'https://github.com' }

  hero.statCards = [
    { label: 'Total Users', value: '12K+' },
    { label: 'Packages', value: '340' },
    { label: 'Uptime', value: '99.9%' },
  ]

  hero.bgIcons = ['Zap', 'Shield', 'Code', 'Globe', 'Package']

  hero.addEventListener('tc-action', e => {
    console.log('action:', e.detail.which)
  })

  hero.onPrimaryAction = () => console.log('primary clicked')
</script>
```

**Blueprint split example** (two-column, framed preview panel):

```html
<tc-hero
  eyebrow="Cloud console for web gaming"
  title="Build worlds. We run the backend."
  description="One console handles the machinery behind your web games."
  note="Free indie plan · No card · 1UP when you grow"
  preview
  backdrop="grid"
  media-label="Live build"
  media-caption="vector-thrust · world.js"
  id="hero2"
></tc-hero>
<script>
  const hero2 = document.getElementById('hero2')
  hero2.primaryAction = { label: 'Insert coin — start free', icon: 'Zap', href: '/signup' }
  hero2.secondaryAction = { label: 'Watch tour', icon: 'Play', href: '/tour' }
</script>
```
```

---