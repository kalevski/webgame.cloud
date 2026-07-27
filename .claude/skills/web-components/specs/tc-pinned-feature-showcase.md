---
component: tc-pinned-feature-showcase
---

### tc-pinned-feature-showcase

Two-column showcase with a sticky/centred left panel and a scrollable right-side item list. The left panel can hold a heading group, optional media (image or slotted content), and optional CTAs. Items on the right carry an optional lucide icon, a title, and optional description text. On narrow viewports the layout collapses to a single column and sticky behaviour is disabled.

**Tag:** `tc-pinned-feature-showcase`

**Attributes**

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | yes | Left-panel heading (rendered as `<h2>`). Also used as the accessible name for the landmark `<section>` via `aria-labelledby`. |
| `description` | `string` | yes | Left-panel sub-text below the heading. |
| `eyebrow` | `string` | no | Small mono kicker rendered above the title — uppercase, letter-spaced. |
| `image-src` | `string` | no | URL of the left-panel media image. Rendered as `<img loading="lazy">` when no `media` slot content is present. |
| `image-alt` | `string` | no | Alt text for the image (defaults to `""`). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `PinnedFeatureShowcaseItem[]` | `[]` | Right-side feature list. Setting the property triggers a re-render. |
| `title` | `string` | `""` | Reflects the `title` attribute. |
| `description` | `string` | `""` | Reflects the `description` attribute. |
| `eyebrow` | `string \| null` | `null` | Reflects the `eyebrow` attribute. |
| `imageSrc` | `string \| null` | `null` | Reflects the `image-src` attribute. |
| `imageAlt` | `string` | `""` | Reflects the `image-alt` attribute. |

**`PinnedFeatureShowcaseItem` shape**

```ts
interface PinnedFeatureShowcaseItem {
  title: string        // Item heading
  description?: string // Optional body text
  icon?: string        // Optional lucide icon name (kebab-case, e.g. "package", "layers")
}
```

**Events**

None. `tc-pinned-feature-showcase` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `media` | Custom left-panel media content (image, video, illustration, etc.). When present, overrides `image-src`. Rendered inside `.tc-pinned-feature-showcase-media`. |
| `ctas` | Call-to-action elements (e.g. `tc-button`) placed beneath the description in the left panel. Rendered inside `.tc-pinned-feature-showcase-ctas` (hidden when empty). |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-pinned-feature-showcase-sticky-top` | `4rem` | `top` offset for the sticky left panel. |
| `--bs-pinned-feature-showcase-gap` | `4rem` | Column gap between panel and item list (desktop). |
| `--bs-pinned-feature-showcase-panel-width` | `40%` | Width of the left panel column. |
| `--bs-pinned-feature-showcase-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow text color. |
| `--bs-pinned-feature-showcase-eyebrow-font-size` | `0.6875rem` | Eyebrow font size. |
| `--bs-pinned-feature-showcase-eyebrow-letter-spacing` | `0.08em` | Eyebrow letter spacing. |
| `--bs-pinned-feature-showcase-title-color` | `var(--tc-text)` | Panel title color. |
| `--bs-pinned-feature-showcase-title-font-size` | `1.75rem` | Panel title font size. |
| `--bs-pinned-feature-showcase-title-font-weight` | `600` | Panel title font weight (≤ 600). |
| `--bs-pinned-feature-showcase-desc-color` | `var(--tc-text-muted)` | Panel description text color. |
| `--bs-pinned-feature-showcase-desc-font-size` | `1rem` | Panel description font size. |
| `--bs-pinned-feature-showcase-item-padding-y` | `1.5rem` | Vertical padding of each item row. |
| `--bs-pinned-feature-showcase-item-border` | `var(--tc-border)` | Color of the 1px hairline between items. |
| `--bs-pinned-feature-showcase-item-gap` | `1rem` | Gap between icon and item text. |
| `--bs-pinned-feature-showcase-item-title-color` | `var(--tc-text)` | Item title color. |
| `--bs-pinned-feature-showcase-item-title-font-size` | `1.0625rem` | Item title font size. |
| `--bs-pinned-feature-showcase-item-title-font-weight` | `600` | Item title font weight (≤ 600). |
| `--bs-pinned-feature-showcase-item-desc-color` | `var(--tc-text-muted)` | Item description text color. |
| `--bs-pinned-feature-showcase-item-desc-font-size` | `0.9375rem` | Item description font size. |
| `--bs-pinned-feature-showcase-item-icon-size` | `1.25rem` | Lucide icon size (width and height). |
| `--bs-pinned-feature-showcase-item-icon-color` | `var(--tc-text-muted)` | Lucide icon color (`currentColor`). |

```html
<!-- Basic usage -->
<tc-pinned-feature-showcase
  eyebrow="Framework-free"
  title="Build once, run anywhere"
  description="Drop into any stack without configuration."
  image-src="/hero.png"
  image-alt="Product screenshot"
  id="showcase"
>
  <tc-button slot="ctas" variant="primary">Get started</tc-button>
  <tc-button slot="ctas" variant="secondary">View docs</tc-button>
</tc-pinned-feature-showcase>
<script>
  document.getElementById('showcase').items = [
    { title: 'Zero dependencies', description: 'Pure ESM/CJS, no runtime overhead.', icon: 'package' },
    { title: 'Design-token driven', description: 'Override any value with a CSS custom property.', icon: 'palette' },
    { title: 'Accessible', description: 'Landmark roles, aria-labelledby, and keyboard focus out of the box.', icon: 'accessibility' },
  ]
</script>

<!-- Custom media slot (overrides image-src) -->
<tc-pinned-feature-showcase title="Custom media" description="Slot any content into the left panel.">
  <video slot="media" src="/demo.mp4" autoplay muted loop></video>
</tc-pinned-feature-showcase>
```

---