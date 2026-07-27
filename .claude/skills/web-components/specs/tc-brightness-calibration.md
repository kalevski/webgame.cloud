---
component: tc-brightness-calibration
---

### tc-brightness-calibration

Gamma/brightness calibration view: three grayscale reference swatches (dark / mid / bright), each carrying a calibration instruction, plus a `0–1` brightness slider with a mono percentage readout. A `brightness()` filter derived from the slider value is applied to the whole swatch preview so the user can adjust until each band matches its instruction. Renders as a flat slate card with a hairline-separated swatch grid and the shared `.form-range` slider.

**Tag:** `tc-brightness-calibration`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `0.5` | Brightness value in `[0, 1]`. Out-of-range values are clamped; non-numeric values fall back to `0.5`. Reflected to/from the `value` JS property and updated as the user drags the slider. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Reflects the `value` attribute, clamped to `[0, 1]`. Reading returns the current numeric value; setting updates the slider, percentage readout, and preview gamma. |
| `onChange` | `((value: number) => void) \| null` | Optional callback mirror of the `tc-change` event. Receives the new clamped value. Defaults to `null`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: number }` | Fired on every slider input with the new clamped brightness value. Bubbles and is composed. The `onChange` callback property, if set, is invoked with the same value. |

**Slots**

None. `tc-brightness-calibration` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-brightness-calibration-bg` | `var(--tc-surface)` | Card background. |
| `--bs-brightness-calibration-border-color` | `var(--tc-border)` | 1px hairline border color. |
| `--bs-brightness-calibration-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-brightness-calibration-padding` | `1rem` | Card inner padding. |
| `--bs-brightness-calibration-gap` | `0.875rem` | Gap between the swatch preview and the control row. |
| `--bs-brightness-calibration-band-dark` | `var(--tc-slate-900)` | Dark reference swatch fill. |
| `--bs-brightness-calibration-band-mid` | `var(--tc-slate-500)` | Mid reference swatch fill. |
| `--bs-brightness-calibration-band-bright` | `var(--tc-slate-50)` | Bright reference swatch fill. |
| `--bs-brightness-calibration-band-height` | `3.5rem` | Minimum swatch height. |
| `--bs-brightness-calibration-band-border-color` | `var(--tc-border)` | Hairline color of the 1px swatch grid gaps and frame. |
| `--bs-brightness-calibration-band-label-dark` | `rgba(255, 255, 255, 0.32)` | Label color on the dark swatch (intentionally faint). |
| `--bs-brightness-calibration-band-label-mid` | `rgba(255, 255, 255, 0.92)` | Label color on the mid swatch. |
| `--bs-brightness-calibration-band-label-bright` | `var(--tc-slate-900)` | Label color on the bright swatch. |
| `--bs-brightness-calibration-band-label-font-size` | `0.75rem` | Swatch label font size. |
| `--bs-brightness-calibration-gamma` | `brightness(1)` | Brightness filter applied to the preview. Overwritten inline by the element on each value change. |
| `--bs-brightness-calibration-row-gap` | `0.75rem` | Gap between the row label, slider, and readout. |
| `--bs-brightness-calibration-row-label-color` | `var(--tc-text)` | "Brightness" label color. |
| `--bs-brightness-calibration-row-label-font-size` | `0.8125rem` | "Brightness" label font size. |
| `--bs-brightness-calibration-row-value-color` | `var(--tc-text-muted)` | Percentage readout color. |
| `--bs-brightness-calibration-row-value-font-size` | `0.8125rem` | Percentage readout font size (JetBrains Mono). |

**Example**

```html
<!-- Default, mid brightness -->
<tc-brightness-calibration value="0.5"></tc-brightness-calibration>

<!-- Listen for changes -->
<tc-brightness-calibration id="cal" value="0.5"></tc-brightness-calibration>
<script>
    document.getElementById('cal').addEventListener('tc-change', (e) => {
        console.log('brightness:', e.detail.value)
    })
</script>
```

---