---
component: tc-cycle-wheel
---

### tc-cycle-wheel

Animated circular wheel with a continuously rotating SVG ring of phase labels around a fixed centre stack. The active phase is emphasised in the cyan accent while the others are muted slate; a static pointer arrow orients the wheel to the active phase. Purely presentational/animated — no events. The spin stops under `prefers-reduced-motion` (the static, oriented ring is shown instead).

**Tag:** `tc-cycle-wheel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current-index` | number | `0` | Index of the active phase. Highlights the matching ring label and orients the pointer arrow. |
| `center-label` | string | — | Optional small mono micro-label rendered above the centre value. |
| `center-value` | string | — (required) | The prominent centre content. Required for a meaningful render. |
| `center-pill` | string | — | Optional small rounded-pill rendered beneath the centre value. |
| `center-sub` | string | — | Optional muted sub-line rendered below the pill. |
| `spin-seconds` | number | `20` | Continuous rotation period of the ring, in seconds (maps to `animation-duration`). |
| `paused` | boolean | `false` | When present, stops the spin (`animation-play-state: paused`). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `phases` | `string[]` | `[]` | The phase labels arranged evenly around the ring. **Property only** (not an attribute). Setting it re-renders the ring. |
| `currentIndex` | `number` | `0` | Reflects the `current-index` attribute. |
| `centerLabel` | `string \| null` | `null` | Reflects the `center-label` attribute. |
| `centerValue` | `string \| null` | `null` | Reflects the `center-value` attribute. |
| `centerPill` | `string \| null` | `null` | Reflects the `center-pill` attribute. |
| `centerSub` | `string \| null` | `null` | Reflects the `center-sub` attribute. |
| `spinSeconds` | `number` | `20` | Reflects the `spin-seconds` attribute. |
| `paused` | `boolean` | `false` | Reflects the `paused` attribute. |

**Events**

None. `tc-cycle-wheel` is purely presentational/animated.

**Slots**

None. All content is supplied via attributes and the `phases` JS property.

**Accessibility**

The decorative SVGs are `aria-hidden`. The host carries `role="img"` and an `aria-label` summarising the centre label, the active phase, the centre value, and the sub-line — meaning is never color-only.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-cycle-wheel-accent` | `var(--tc-accent)` | Active phase label + pointer arrow color (the one accent in the component). |
| `--bs-cycle-wheel-value` | `var(--tc-text)` | Centre value color. |
| `--bs-cycle-wheel-bg` | `var(--tc-surface)` | Centre core background. |
| `--bs-cycle-wheel-muted` | `var(--tc-text-muted)` | Muted phase labels + centre label/sub color. |
| `--bs-cycle-wheel-border` | `var(--tc-border)` | Centre core border. |
| `--bs-cycle-wheel-track` | `var(--tc-border)` | Ring hairline track stroke. |
| `--bs-cycle-wheel-tick` | `var(--tc-text-faint)` | Per-slot tick mark stroke. |
| `--bs-cycle-wheel-pill-bg` | `var(--tc-success-bg)` | Centre pill background. |
| `--bs-cycle-wheel-pill-color` | `var(--tc-success)` | Centre pill text color. |
| `--bs-cycle-wheel-label-font-size` | `11px` | Ring phase label font size. |
| `--bs-cycle-wheel-label-letter-spacing` | `0.12em` | Ring phase label letter-spacing. |
| `--bs-cycle-wheel-value-font-size` | `3rem` | Centre value font size. |
| `--bs-cycle-wheel-max-size` | `480px` | Maximum diameter of the wheel. |
| `--bs-cycle-wheel-spin-duration` | `20s` | Default spin duration (overridden inline by `spin-seconds`). |

```html
<!-- Five-phase loop -->
<tc-cycle-wheel
  id="cw"
  current-index="1"
  center-label="Now · Sprint"
  center-value="047"
  center-pill="Open"
  center-sub="Day 03 / 14"
></tc-cycle-wheel>
<script>
  const el = document.getElementById('cw')
  el.phases = ['Roll', 'Build', 'Attest', 'Ship', 'Close']
</script>

<!-- Faster spin, three phases -->
<tc-cycle-wheel id="cw3" current-index="2" spin-seconds="12" center-value="v2" center-pill="Live"></tc-cycle-wheel>
<script>
  document.getElementById('cw3').phases = ['Draft', 'Review', 'Ship']
</script>

<!-- Paused -->
<tc-cycle-wheel id="cwp" current-index="3" paused center-value="047" center-pill="Ship"></tc-cycle-wheel>
<script>
  document.getElementById('cwp').phases = ['Roll', 'Build', 'Attest', 'Ship', 'Close']
</script>
```