---
component: tc-vignette-overlay
---

### tc-vignette-overlay

Edge vignette overlay for damage feedback, cinematic framing, or low-health UI. Styled to the web-components design system — no Shadow DOM; a block wrapper whose `::after` pseudo-element paints a radial-gradient overlay on top of slotted content. The center is transparent and the edges fade to `vignette-color`; `intensity` (0–1) controls the pseudo-element's opacity. `pointer-events: none` on the overlay keeps content fully interactive. All cosmetics flow through `--bs-vignette-overlay-*` custom properties.

**Tag:** `tc-vignette-overlay`

---

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `intensity` | number (0–1) | `0.6` | Opacity of the vignette gradient. `0` = invisible, `1` = fully opaque. Clamped to [0, 1]; non-finite values fall back to `0.6`. Written as an inline `--bs-vignette-overlay-intensity` override. |
| `vignette-color` | CSS color | `#000000` | Edge color of the radial gradient (any CSS color value, e.g. `var(--tc-danger)`, `rgba(220,38,38,1)`). Written as an inline `--bs-vignette-overlay-color` override. |

---

#### JS Properties

| Property | Type | Description |
|---|---|---|
| `intensity` | `number` | Reflects `intensity` (default `0.6`, clamped 0–1) |
| `vignetteColor` | `string` | Reflects `vignette-color` (default `#000000`) |

---

#### Events

None. The component is purely presentational.

---

#### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--bs-vignette-overlay-intensity` | `0.6` | Opacity of the vignette `::after` layer (overridden inline by the `intensity` attribute) |
| `--bs-vignette-overlay-color` | `#000000` | Edge color of the radial gradient (overridden inline by the `vignette-color` attribute) |

---

#### Slots

| Slot | Description |
|---|---|
| *(default)* | Content to display inside the vignette frame. The vignette `::after` is painted on top with `pointer-events: none` so the content remains fully interactive. |

---

#### Example

```html
<!-- Static vignette wrapping a scene viewport -->
<tc-vignette-overlay style="width: 100%; height: 400px;">
  <canvas id="scene"></canvas>
</tc-vignette-overlay>

<!-- Damage flash: red edges at high intensity -->
<tc-vignette-overlay
  id="damage"
  intensity="0"
  vignette-color="var(--tc-danger)"
  style="width: 100%; height: 400px;"
>
  <canvas id="scene2"></canvas>
</tc-vignette-overlay>
<script>
  const overlay = document.querySelector('#damage')

  function triggerDamage() {
    // Ramp intensity up then back down for a pulse effect
    overlay.intensity = 0.8
    setTimeout(() => { overlay.intensity = 0 }, 300)
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'h') triggerDamage()
  })
</script>
```