---
component: tc-cooldown-badge
---

### tc-cooldown-badge

Small ring badge with a cooldown countdown readout, styled to the toolcase voice. The arc represents the remaining cooldown (`max - value`) and depletes clockwise as `value` climbs toward `max`; when the cooldown clears (`value >= max`) the ring completes in the cyan accent (`--tc-accent`) to signal ready. The disc is one of the sanctioned circular shapes; everything else stays flat — a slate hairline track, an ink (`--tc-app-accent`) cooling arc, and a JetBrains Mono readout in the centre. The remaining time is formatted `m:ss` above a minute, whole seconds from 10s up, and one decimal under 10s. The label shows the countdown (or a custom `label`) and is gated by `show-label` / the presence of `label`. The badge re-renders on every attribute or property change; it does not tick on its own — the consumer drives `value`. The inner wrapper carries `role="img"` with a descriptive `aria-label`; the SVG and visual label are `aria-hidden`. All cosmetics flow through `--bs-cooldown-badge-*`.

**Tag:** `tc-cooldown-badge`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `0` | Elapsed cooldown value. Clamped to `[0, max]`; remaining = `max - value` |
| `max` | number | `1` | Total cooldown duration; values `≤ 0` fall back to `1` |
| `size` | number (px) | `48` | Diameter of the ring, clamped to `[32, 64]`. Written to `--bs-cooldown-badge-size` |
| `label` | string | — | Custom centre text shown instead of the countdown; its presence also forces the label visible |
| `show-label` | boolean | false | Shows the countdown readout in the centre (no effect once the cooldown reaches zero unless `label` is set) |

**JS Properties**

All attributes are reflected as JS properties: `value`, `max`, `size` (numbers), `label` (string), `showLabel` (boolean). Setting `value` (e.g. `el.value = 6`) re-renders the ring and readout.

**Slots**

None. `tc-cooldown-badge` is purely attribute-driven.

**Events**

None. `tc-cooldown-badge` is a presentational status element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-cooldown-badge-size` | `48px` | Ring diameter. Set via the `size` attribute |
| `--bs-cooldown-badge-track` | `var(--tc-border)` | Track (unfilled) stroke color |
| `--bs-cooldown-badge-fill` | `var(--tc-app-accent)` | Cooling arc stroke color |
| `--bs-cooldown-badge-ready-fill` | `var(--tc-accent)` | Ring stroke color in the ready state |
| `--bs-cooldown-badge-label-color` | `var(--tc-text)` | Countdown label color |
| `--bs-cooldown-badge-ready-label-color` | `var(--tc-text)` | Label color in the ready state |
| `--bs-cooldown-badge-label-size` | `0.75rem` | Countdown label font size |

```html
<!-- Cooldown progression (value of max) -->
<tc-cooldown-badge value="3" max="10" show-label></tc-cooldown-badge>
<tc-cooldown-badge value="10" max="10" show-label></tc-cooldown-badge>

<!-- Sizes (32–64px) -->
<tc-cooldown-badge value="4" max="10" size="64" show-label></tc-cooldown-badge>

<!-- Time formatting -->
<tc-cooldown-badge value="30" max="120" show-label></tc-cooldown-badge>

<!-- Custom label -->
<tc-cooldown-badge value="5" max="10" label="DASH"></tc-cooldown-badge>
```

```js
// Live value via the JS property
const badge = document.querySelector('tc-cooldown-badge')
badge.value = 6
```

---