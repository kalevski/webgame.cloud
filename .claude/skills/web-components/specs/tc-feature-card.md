---
component: tc-feature-card
---

### tc-feature-card

Card highlighting a product feature with optional icon chip, eyebrow micro-label, title, description text, and a visual region. Supports `default`, `wide`, and `full` size modifiers, plus an `inline` layout that places the icon beside the copy.

**Tag:** `tc-feature-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `icon` | string | — | PascalCase Lucide icon name (e.g. `"Zap"`, `"Shield"`). Rendered as inline SVG inside the icon chip. Ignored when a `slot="icon"` child is present. |
| `eyebrow` | string | — | Short label rendered above the title in mono uppercase micro-text. Ignored when a `slot="eyebrow"` child is present. |
| `title` | string | — | Card heading text. Ignored when a `slot="title"` child is present. |
| `description` | string | — | Body description text rendered below the title. Ignored when a `slot="description"` child is present. |
| `size` | `'default' \| 'wide' \| 'full'` | `'default'` | Layout width modifier. `wide` caps at 720 px; `full` stretches to 100% of the container. Unknown values fall back to `'default'`. |
| `inline` | boolean | `false` | When present, switches to a horizontal layout — the icon chip sits beside the copy column (eyebrow + title + description). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `eyebrow` | `string \| null` | Reflects the `eyebrow` attribute. |
| `title` | `string` | Reflects the `title` attribute (overrides `HTMLElement.title`). |
| `description` | `string \| null` | Reflects the `description` attribute. |
| `size` | `FeatureCardSize` | Reflects the `size` attribute (validated; falls back to `'default'`). |
| `inline` | `boolean` | Reflects the `inline` boolean attribute. |

**Events**

None. `tc-feature-card` is purely presentational.

**Named Slots**

| Slot | Description |
|------|-------------|
| `icon` | Rich icon content (e.g. custom SVG). When present, takes priority over the `icon` attribute. Rendered inside the icon chip (`.tc-feature-card-icon`). |
| `eyebrow` | Rich eyebrow content. When present, takes priority over the `eyebrow` attribute. |
| `title` | Rich title content (e.g. `<strong>`, `<em>`). When present, takes priority over the `title` attribute. |
| `description` | Rich description content. When present, takes priority over the `description` attribute. |
| `visual` | Visual region rendered below the copy (image, diagram, chart, etc.). No attribute fallback. |

**Accessibility**

- The icon chip carries `aria-hidden="true"` — it is decorative; the title is the readable label.
- Visible focus is inherited from any focusable slotted children via the global `:focus-visible` ring.
- `prefers-reduced-motion` retains the `box-shadow` hover transition but freezes the `translateY(-1px)` lift.
- No interactive affordance is added by the component itself — for clickable cards, wrap the element or add a focusable slotted child.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-feature-card-bg` | `var(--tc-surface)` | Card background colour. |
| `--bs-feature-card-border-color` | `var(--tc-border)` | 1 px hairline border colour. |
| `--bs-feature-card-shadow` | `var(--tc-shadow-sm)` | Box shadow at rest. |
| `--bs-feature-card-shadow-hover` | `var(--tc-shadow-hover)` | Box shadow on hover. |
| `--bs-feature-card-padding-y` | `1.5rem` | Vertical padding. |
| `--bs-feature-card-padding-x` | `1.5rem` | Horizontal padding. |
| `--bs-feature-card-gap` | `1rem` | Gap between the head and visual regions. |
| `--bs-feature-card-head-gap` | `0.75rem` | Gap between icon and copy inside the head. |
| `--bs-feature-card-copy-gap` | `0.375rem` | Gap between eyebrow, title, and description. |
| `--bs-feature-card-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-feature-card-title-weight` | `600` | Title font weight. |
| `--bs-feature-card-desc-color` | `var(--tc-text-muted)` | Description text colour. |
| `--bs-feature-card-eyebrow-color` | `var(--tc-text-faint)` | Eyebrow micro-label colour. |
| `--bs-feature-card-icon-bg` | `var(--tc-surface-muted)` | Icon chip background. |
| `--bs-feature-card-icon-color` | `var(--tc-text)` | Icon glyph colour. |
| `--bs-feature-card-icon-size` | `1.125rem` | Icon SVG width/height inside the chip. |
| `--bs-feature-card-icon-tile-size` | `2.5rem` | Width and height of the icon chip square. |

```html
<!-- Icon attribute + all text attributes -->
<tc-feature-card
    icon="Zap"
    eyebrow="Performance"
    title="Lightning-fast builds"
    description="Incremental compilation cuts build times by up to 80%."
></tc-feature-card>

<!-- Wide size -->
<tc-feature-card
    size="wide"
    icon="Database"
    title="Managed distributed database"
    description="Automatic sharding and replication."
></tc-feature-card>

<!-- Full width -->
<tc-feature-card
    size="full"
    icon="BarChart2"
    title="End-to-end tracing"
    description="Distributed tracing and real-time metrics in one dashboard."
></tc-feature-card>

<!-- Inline (horizontal) layout -->
<tc-feature-card
    inline
    icon="Shield"
    eyebrow="Security"
    title="Zero-trust by default"
    description="Authenticated at the edge before reaching your services."
></tc-feature-card>

<!-- Slotted icon and visual -->
<tc-feature-card title="Custom branding" description="Your logo, your colours.">
    <svg slot="icon" aria-hidden="true" width="18" height="18" ...></svg>
    <img slot="visual" src="/feature-preview.png" alt="Feature preview" />
</tc-feature-card>
```

---