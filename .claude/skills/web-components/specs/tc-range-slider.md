---
component: tc-range-slider
---

### tc-range-slider

Dual-handle range slider with an optional label, ticks, tooltips, and full keyboard navigation. The selected segment between handles is filled with the ink accent. No slots — all configuration is via attributes and the `value` JS property.

**Tag:** `tc-range-slider`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Visible label above the track |
| `min` | number | `0` | Minimum allowed value |
| `max` | number | `100` | Maximum allowed value |
| `step` | number | `1` | Snap increment |
| `ticks` | boolean | `false` | Render tick marks below the track |
| `show-tooltip` | boolean | `false` | Show value tooltips above each handle |
| `disabled` | boolean | `false` | Disables all interaction |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `[number, number]` | Get or set the `[lo, hi]` tuple. Setter clamps both values to `[min, max]`, snaps to `step`, and ensures `lo ≤ hi`. Setting triggers a DOM patch — no full re-render. |
| `onChange` | `((value: [number, number]) => void) \| null` | Optional callback fired on every committed change (drag end, track click, keyboard). Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: [number, number] }` | Fired on every committed value change. |

**No slots.**

```html
<tc-range-slider label="Price range" min="0" max="200" step="10" ticks show-tooltip></tc-range-slider>
<script>
  const el = document.querySelector('tc-range-slider')
  el.value = [40, 160]
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---