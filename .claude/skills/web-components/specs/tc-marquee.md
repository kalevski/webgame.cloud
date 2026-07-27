---
component: tc-marquee
---

### tc-marquee

**Tag:** `tc-marquee`

Horizontally scrolling content banner. Items loop seamlessly at a configurable speed and direction. Scrolling is automatically disabled under `prefers-reduced-motion` (the element becomes a static, scrollable row instead).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `separator` | string | `''` (none) | Text string rendered between items (e.g. `•`, `|`). Also appears at the junction between the two copies for seamless looping. |
| `speed` | number | `60` | Scroll speed in pixels per second. The animation duration is computed from this value and the measured content width. |
| `direction` | `'left' \| 'right'` | `'left'` | Scroll direction. `'left'` moves content toward the left; `'right'` reverses it. |
| `pause-on-hover` | boolean | absent | When present, pauses the scroll animation while the pointer hovers over the element. |
| `aria-label` | string | `'Scrolling content'` | Accessible label for the inner `role="region"` container. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `string[]` | `[]` | Array of strings or HTML fragments rendered as marquee items. Takes precedence over slotted children when non-empty. |
| `separator` | string | `''` | Reflected from the `separator` attribute. |
| `speed` | number | `60` | Reflected from the `speed` attribute. |
| `direction` | `'left' \| 'right'` | `'left'` | Reflected from the `direction` attribute. |
| `pauseOnHover` | boolean | `false` | Reflected from the `pause-on-hover` attribute. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Each direct child element is treated as one marquee item. Used when the `items` JS property is not set. Items are preserved across re-renders as real DOM nodes. |

**Events**

None. `tc-marquee` is purely presentational.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-marquee-duration` | Computed by JS | Animation duration derived from `speed` and content width. Overriding this manually is not recommended; set `speed` instead. |
| `--bs-marquee-direction-value` | `normal` | CSS `animation-direction` value — `normal` for left, `reverse` for right. Set by JS; do not override manually. |
| `--bs-marquee-item-color` | `var(--tc-text)` | Text colour of marquee items. |
| `--bs-marquee-sep-color` | `var(--tc-text-muted)` | Colour of the separator string. |
| `--bs-marquee-sep-gap` | `0.625rem` | Inline padding on each side of the separator. |
| `--bs-marquee-padding-y` | `0.5rem` | Block padding applied to each copy container. |

**Example**

```html
<!-- Slotted children -->
<tc-marquee separator="•" aria-label="Product highlights">
  <span>Zero dependencies</span>
  <span>Framework-free</span>
  <span>Fully themeable</span>
</tc-marquee>

<!-- items JS property -->
<tc-marquee id="m" separator="—" speed="40" direction="left" pause-on-hover></tc-marquee>

<script>
  document.getElementById('m').items = [
    '🚀 v3.0 released',
    '⭐ 12k GitHub stars',
    '📦 40+ countries',
  ]
</script>
```

---