---
component: tc-rating
---

### tc-rating

Interactive star rating with optional half-stars, keyboard navigation, custom icons, size variants, and a read-only display mode. The whole rating is a single `role="slider"` tab stop (`aria-valuemin=0` / `aria-valuemax=count` / `aria-valuenow=value`); the star glyphs are decorative. Filled stars use the warm amber accent; empty stars use the neutral border tone. No slots — all configuration is via attributes and the `value` JS property.

**Tag:** `tc-rating`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `0` | Current rating (the controlled selection). Clamped to `[0, count]`. |
| `count` | number | `5` | Number of star icons. |
| `allow-half` | boolean | `false` | Allow half-star (`.5`) values; clicking the left half of a star selects the half value. |
| `read-only` | boolean | `false` | Display only — disables hover, keyboard, and click, and removes the control from the tab order. |
| `size` | `small\|default\|large` | `default` | Scales the star glyphs. |
| `icon` | string | `star` | Lucide icon name used for every star (e.g. `heart`). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Get or set the current rating. Setting reflects to the `value` attribute and repaints (no full re-render). |
| `onChange` | `((value: number) => void) \| null` | Optional callback fired on every committed change (click, keyboard). Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: number }` | Fired when the rating changes via click or keyboard. |

**Keyboard:** Left/Down decrease and Right/Up increase by `1` (or `0.5` with `allow-half`); Home sets `0`; End sets `count`.

**No slots.**

```html
<tc-rating count="5" allow-half></tc-rating>
<script>
  const el = document.querySelector('tc-rating')
  el.value = 3.5
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---