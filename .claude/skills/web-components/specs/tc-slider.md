---
component: tc-slider
---

### tc-slider

Single-handle range slider with full keyboard navigation, optional tick marks, a value tooltip, custom value formatting, and an error state. The track segment from `min` to the current value is filled with the ink accent. `value` is controlled via the attribute; it is always clamped to `[min, max]` and snapped to `step`. No slots — all configuration is via attributes, the `formatValue` JS property, and the `value` JS property.

**Tag:** `tc-slider`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `min` | Current value (controlled). Clamped to `[min, max]` and snapped to `step`. |
| `min` | number | `0` | Minimum allowed value |
| `max` | number | `100` | Maximum allowed value |
| `step` | number | `1` | Snap increment |
| `ticks` | boolean | `false` | Render tick marks below the track at every `step` |
| `show-tooltip` | boolean | `false` | Show a value tooltip above the thumb on hover / focus / drag |
| `label` | string | — | Visible label above the track (also wires `aria-labelledby` on the thumb) |
| `error` | string | — | Error message rendered below the track; recolors the track + message with `--tc-danger` |
| `disabled` | boolean | `false` | Disables all interaction |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Get or set the current value. The getter returns the clamped + snapped number; the setter reflects to the `value` attribute and repaints (no full re-render). |
| `formatValue` | `((value: number) => string) \| null` | Optional formatter applied to the tooltip text and the thumb's `aria-valuetext`. Default `null` (renders the raw number). |
| `onChange` | `((value: number) => void) \| null` | Optional callback fired on every value change (drag, track click, keyboard). Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: number }` | Fired on every value change. Bubbles + composed. |

**Keyboard (thumb focused):** Left/Down decrease and Right/Up increase by `step`; PageDown/PageUp by `step × 10`; Home sets `min`; End sets `max`.

**Ergonomics:** the track reserves half a thumb of inline padding so the 0%/100% extremes stay fully visible and grabbable instead of half-cropped at the container edge; the value tooltip flips inward near the extremes instead of overflowing the container; coarse pointers get a 20px thumb and an invisible hit area ≥ 44px (driven by `--tc-min-touch-target`).

**No slots.**

```html
<tc-slider label="Budget" min="0" max="500" step="10" value="120" ticks show-tooltip></tc-slider>
<script>
  const el = document.querySelector('tc-slider')
  el.formatValue = n => `$${n.toFixed(2)}`
  el.value = 200
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---