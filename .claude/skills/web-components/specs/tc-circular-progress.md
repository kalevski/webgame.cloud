---
component: tc-circular-progress
---

### tc-circular-progress

Ring / circular progress indicator with an optional value label. The disc is one of the sanctioned circular shapes; everything else stays flat and neutral — a slate hairline track, an ink (`--tc-app-accent`) fill arc, and a JetBrains Mono percentage in the centre. The arc starts at 12 o'clock and sweeps clockwise (or counter-clockwise with `reverse`). The fill grows with a `--tc-transition-base` ease as `value` changes; the easing is frozen under `prefers-reduced-motion` (the static arc still conveys the value). Geometry (`size`, `thickness`) and palette (`color`, `background`) are all attribute-driven and flow through `--bs-circular-progress-*`. The host carries `role="progressbar"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`; the SVG itself is `aria-hidden`.

**Tag:** `tc-circular-progress`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `0` | Current progress value. Clamped to `[0, max]` for the arc |
| `max` | number | `100` | Maximum value; values `≤ 0` fall back to `100` |
| `size` | number (px) | `64` | Outer diameter of the ring; values `≤ 0` fall back to `64`. Written to `--bs-circular-progress-size` |
| `thickness` | number (px) | `6` | Stroke width of the ring; values `≤ 0` fall back to `6`, capped at `size / 2` |
| `color` | string | `var(--tc-app-accent)` | Any CSS color for the fill arc. Written to `--bs-circular-progress-fill` |
| `background` | string | `var(--tc-border)` | Any CSS color for the track. Written to `--bs-circular-progress-track` |
| `show-text` | boolean | false | Shows the rounded percentage label in the centre |
| `reverse` | boolean | false | Sweeps the fill counter-clockwise instead of clockwise |

**JS Properties**

All attributes are reflected as JS properties: `value`, `max`, `size`, `thickness` (numbers), `color`, `background` (strings), `showText`, `reverse` (booleans). Setting `value` (e.g. `el.value = 60`) re-renders the arc.

**Slots**

None. `tc-circular-progress` is purely attribute-driven.

**Events**

None. `tc-circular-progress` is a presentational status element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-circular-progress-size` | `64px` | Ring diameter. Set via the `size` attribute |
| `--bs-circular-progress-track` | `var(--tc-border)` | Track (unfilled) stroke color. Set via the `background` attribute |
| `--bs-circular-progress-fill` | `var(--tc-app-accent)` | Fill (progress) arc stroke color. Set via the `color` attribute |
| `--bs-circular-progress-text-color` | `var(--tc-text)` | Percentage label color |
| `--bs-circular-progress-text-size` | `0.8125rem` | Percentage label font size |

```html
<!-- Default with value label -->
<tc-circular-progress value="75" show-text></tc-circular-progress>

<!-- Sizes and thickness -->
<tc-circular-progress value="60" size="96" thickness="10" show-text></tc-circular-progress>

<!-- Status colors (color = information) -->
<tc-circular-progress value="90" color="var(--tc-success)" show-text></tc-circular-progress>
<tc-circular-progress value="30" color="var(--tc-danger)" show-text></tc-circular-progress>

<!-- Custom max and reverse sweep -->
<tc-circular-progress value="3" max="5" show-text></tc-circular-progress>
<tc-circular-progress value="40" reverse show-text></tc-circular-progress>
```

```js
// Live value via the JS property
const ring = document.querySelector('tc-circular-progress')
ring.value = 60
```

---