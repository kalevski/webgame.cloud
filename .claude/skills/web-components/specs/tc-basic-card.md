---
component: tc-basic-card
---

### tc-basic-card

Small dashboard card with an optional leading icon chip and a two-line text block. Purely presentational; no events.

**Tag:** `tc-basic-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text-a` | `string` | `""` | Primary text line (headline / value). Required. |
| `text-b` | `string` | `""` | Secondary / supporting text line. Required. |
| `icon` | `string` | — | Lucide icon name in PascalCase (e.g. `"BarChart2"`, `"Users"`). When absent, no icon chip is rendered. |
| `loading` | `boolean` | `false` | When present, renders a shimmer skeleton placeholder in place of the icon and text. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `textA` | `string` | Reflects the `text-a` attribute. |
| `textB` | `string` | Reflects the `text-b` attribute. |
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |

**Events**

None. `tc-basic-card` is purely presentational.

**Slots**

None. Content is driven entirely by HTML attributes.

**Accessibility**

- The icon chip carries `aria-hidden="true"` — it is decorative; no color-only meaning.
- The loading state sets `aria-busy="true"` on the host and includes a visually-hidden `role="status"` announcement.
- Skeleton shimmer animation honours `prefers-reduced-motion` (freezes to a static fill; the region remains visible).
- Primary and secondary text are plain text nodes — readable by assistive technology without relying on color.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-basic-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-basic-card-border-color` | `var(--tc-border)` | Card 1px hairline border color. |
| `--bs-basic-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-basic-card-padding-y` | `1rem` | Vertical card body padding. |
| `--bs-basic-card-padding-x` | `1.25rem` | Horizontal card body padding. |
| `--bs-basic-card-gap` | `0.875rem` | Gap between icon chip and text block. |
| `--bs-basic-card-icon-size` | `2.5rem` | Width and height of the icon chip. |
| `--bs-basic-card-icon-bg` | `var(--tc-surface-muted)` | Icon chip background (slate muted; not a colored badge). |
| `--bs-basic-card-icon-color` | `var(--tc-text-muted)` | Icon glyph stroke color. |
| `--bs-basic-card-icon-svg-size` | `1.125rem` | Icon SVG width/height inside the chip. |
| `--bs-basic-card-primary-color` | `var(--tc-text)` | Primary text color. |
| `--bs-basic-card-primary-font-size` | `1.0625rem` | Primary text font size. |
| `--bs-basic-card-secondary-color` | `var(--tc-text-muted)` | Secondary text color. |
| `--bs-basic-card-secondary-font-size` | `0.8125rem` | Secondary text font size. |
| `--bs-basic-card-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton placeholder fill color. |
| `--bs-basic-card-skeleton-shimmer` | `rgba(255,255,255,0.6)` | Shimmer highlight color. |

```html
<!-- With icon -->
<tc-basic-card icon="BarChart2" text-a="$24,500" text-b="Total revenue this month"></tc-basic-card>

<!-- Without icon -->
<tc-basic-card text-a="1,284" text-b="Active users"></tc-basic-card>

<!-- Loading state -->
<tc-basic-card loading text-a="placeholder" text-b="placeholder"></tc-basic-card>
```

---