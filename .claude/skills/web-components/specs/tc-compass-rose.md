---
component: tc-compass-rose
---

### tc-compass-rose

Radial compass rose showing a facing direction. The slate-ink north needle rotates to the current `heading` while static N/E/S/W cardinals frame a flat slate face; short index ticks mark the four cardinals for an instrument read. Styled to the toolcase design system: flat surface, 1px hairline ring, mono cardinal labels, and the slate ink accent for the north needle and hub (the south half uses a muted slate). The needle's rotation tween is decorative motion, frozen under `prefers-reduced-motion` (the final orientation — the information — is kept). The face circle and centre hub are the only sanctioned curves. No slot children, no events — purely presentational.

**Tag:** `tc-compass-rose`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `heading` | number | `0` | Bearing in degrees the needle points to. Any finite number; invalid values fall back to `0`. Written to `--bs-compass-rose-rotation` and applied to the needle. The aria-label readout normalises it to `[0, 360)`. |
| `size` | number | `160` | Face diameter in pixels (numeric → `Npx`, written to `--bs-compass-rose-size`). Omit to use the default (bumped to `184` under coarse pointers). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `heading` | `number` | Mirrors the `heading` attribute. Setting it re-renders and rotates the needle. |
| `size` | `number \| null` | Mirrors the `size` attribute. Set to `null` to remove the override and fall back to the default. |

**Events**

None. `tc-compass-rose` is a purely presentational element.

**Slots**

None. The component owns its SVG face, needle, ticks, and cardinal labels.

**CSS custom properties** (cosmetics flow through `--bs-compass-rose-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-compass-rose-size` | `160px` | Face diameter (set from the `size` attribute; `184px` under coarse pointers) |
| `--bs-compass-rose-rotation` | `0deg` | Needle rotation (set from the `heading` attribute) |
| `--bs-compass-rose-face-bg` | `var(--tc-surface)` | Face fill |
| `--bs-compass-rose-ring-color` | `var(--tc-border-strong)` | Hairline ring stroke |
| `--bs-compass-rose-tick-color` | `var(--tc-text-faint)` | Cardinal index tick stroke |
| `--bs-compass-rose-needle-n-color` | `var(--tc-app-accent)` | North (pointing) needle half — ink accent |
| `--bs-compass-rose-needle-s-color` | `var(--tc-slate-300)` | South needle half — muted |
| `--bs-compass-rose-hub-color` | `var(--tc-app-accent)` | Centre hub dot |
| `--bs-compass-rose-label-color` | `var(--tc-text-muted)` | E/S/W cardinal label color |
| `--bs-compass-rose-label-n-color` | `var(--tc-text)` | North cardinal label color (emphasised) |
| `--bs-compass-rose-transition` | `var(--tc-transition-base)` | Needle rotation transition (frozen under reduced motion) |

**Example**

```html
<tc-compass-rose id="rose" heading="45" size="180"></tc-compass-rose>
<script>
  // rotate the needle to a new bearing
  document.getElementById('rose').heading = 120
</script>
```

---