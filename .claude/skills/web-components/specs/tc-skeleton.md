---
component: tc-skeleton
---

### tc-skeleton

Loading-state placeholder with a slate shimmer animation and configurable shape. Three variants: `text` (1em-tall line rows), `circle` (equal width/height, 50% radius), and `rect` (sharp rectangle). `count` repeats the placeholder bar. The last text line in a multi-line group is automatically narrowed to 80% to mimic a paragraph end. Respects `prefers-reduced-motion` — the shimmer freezes to a static slate fill rather than vanishing.

**Tag:** `tc-skeleton`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `text\|circle\|rect` | `text` | Shape of the placeholder. `text` = 1em block line; `circle` = equal dimensions with 50% radius; `rect` = sharp rectangle |
| `width` | string \| number | `100%` (text/rect), `height ?? 40px` (circle) | Width of each placeholder. Bare number is treated as px; any CSS length string passes through unchanged |
| `height` | string \| number | `1em` (text), `width ?? 40px` (circle), `80px` (rect) | Height of each placeholder. Same px/CSS-string resolution as `width` |
| `count` | number | `1` | Number of placeholder bars to render. When > 1 bars are wrapped in a column flex group |

**JS Properties**

All four attributes are reflected as JS properties with the same names (`variant`, `width`, `height`, `count`).

**Events**

None. `tc-skeleton` is a purely presentational loading indicator.

**Slots**

None. All content is generated from attributes.

**Accessibility**

The host carries `role="status"` and `aria-label="Loading..."`. Individual placeholder spans are marked `aria-hidden="true"`.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-skeleton-base-color` | `var(--tc-surface-muted)` | Base fill color (slate-100) |
| `--bs-skeleton-shine-color` | `var(--tc-surface-hover)` | Leading shimmer highlight (slate-50) |
| `--bs-skeleton-shade-color` | `var(--tc-border)` | Trailing shimmer shade (slate-200) |
| `--bs-skeleton-animation-duration` | `1.5s` | Shimmer sweep duration |
| `--bs-skeleton-group-gap` | `0.5em` | Gap between bars when `count > 1` |

```html
<!-- Single text line -->
<tc-skeleton variant="text"></tc-skeleton>

<!-- Multiple text lines (last line is 80% wide) -->
<tc-skeleton variant="text" count="4"></tc-skeleton>

<!-- Circle avatar placeholder -->
<tc-skeleton variant="circle" width="48" height="48"></tc-skeleton>

<!-- Rect image placeholder -->
<tc-skeleton variant="rect" width="100%" height="160"></tc-skeleton>

<!-- Composed card skeleton -->
<tc-skeleton variant="rect" width="100%" height="160"></tc-skeleton>
<tc-skeleton variant="text" count="3"></tc-skeleton>
```

---