---
component: tc-crosshair
---

### tc-crosshair

Configurable aiming reticle in the toolcase idiom. Six variants — `cross`, `dot`, `circle`, `tShape`, `classic`, `rune` — with knobs for overall `size`, arm `thickness`, center `gap`, `color`, and a `spread` offset added to the gap (for a recoil/bloom effect). The fantasy chrome is dropped: arms and the center pip are sharp ink shapes, the only curve is the sanctioned ring, and the `rune` variant is reworked into a sharp rotated-square marker. The host is decorative (`aria-hidden="true"`) and pointer-transparent so it can sit as an overlay marker. Purely presentational — no events.

**Tag:** `tc-crosshair`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | enum | `cross` | One of `cross`, `dot`, `circle`, `tShape`, `classic`, `rune`. Invalid values fall back to `cross` |
| `size` | number (px) | `24` | Overall width and height of the reticle box. Non-positive / non-numeric values fall back to `24` |
| `thickness` | number (px) | `2` | Arm / ring / marker stroke width. Non-positive / non-numeric values fall back to `2` |
| `gap` | number (px) | `4` | Empty space between the center and each arm. Non-numeric values fall back to `4` |
| `color` | string | `var(--tc-app-accent)` | Any CSS color value. Written to `--bs-crosshair-color` on the host when set; drives arms, dot, ring, and diamond |
| `spread` | number (px) | `0` | Extra offset added to `gap` (recoil/bloom). Negative / non-numeric values fall back to `0` |

**JS Properties**

All six attributes are reflected as JS properties with the same names (`variant`, `size`, `thickness`, `gap`, `color`, `spread`). Numeric properties return parsed numbers; `color` returns the default `var(--tc-app-accent)` when unset.

**Slots**

None. `tc-crosshair` is a purely presentational, attribute-driven element.

**Events**

None.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-crosshair-size` | `24px` | Reticle box width/height (set from the `size` attribute in render) |
| `--bs-crosshair-thickness` | `2px` | Arm / ring / marker stroke width (set from `thickness`) |
| `--bs-crosshair-gap` | `4px` | Center gap, including `spread` (set from `gap + spread`) |
| `--bs-crosshair-color` | `var(--tc-app-accent)` | Stroke/fill color. Set via the `color` attribute or override in CSS |

```html
<!-- Variants -->
<tc-crosshair variant="cross" size="40"></tc-crosshair>
<tc-crosshair variant="dot" size="40"></tc-crosshair>
<tc-crosshair variant="circle" size="40"></tc-crosshair>
<tc-crosshair variant="tShape" size="40"></tc-crosshair>
<tc-crosshair variant="classic" size="40"></tc-crosshair>
<tc-crosshair variant="rune" size="40"></tc-crosshair>

<!-- Size & thickness -->
<tc-crosshair variant="classic" size="56" thickness="3"></tc-crosshair>

<!-- Gap & spread (recoil/bloom) -->
<tc-crosshair variant="cross" size="48" gap="6" spread="12"></tc-crosshair>

<!-- Color -->
<tc-crosshair variant="classic" size="40" color="var(--tc-danger)"></tc-crosshair>
<tc-crosshair variant="classic" size="40" color="#a855f7"></tc-crosshair>
```

---