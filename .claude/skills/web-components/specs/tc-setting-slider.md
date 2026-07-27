---
component: tc-setting-slider
---

### tc-setting-slider

A generic range-slider setting row: a label/description text block paired with a native `<input type="range">` and a mono readout, plus an optional mute button. Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse). The readout format is driven by `format` (`percent` renders `value × 100 %`; `int` / `float` append `unit`).

**Tag:** `tc-setting-slider`

**Preset aliases:** `tc-volume-slider` (percent, `with-mute`, default `0.8`), `tc-deadzone-slider` (percent, default `0.15`), `tc-fov-slider` (integer degrees, `60`–`120`, default `90`) are aliases of `tc-setting-slider` that seed their range, default value and readout format from the tag name. Everything below applies identically.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | (per preset) | Row label. The preset aliases set this automatically when absent. |
| `description` | string | — | Optional secondary line beneath the label |
| `value` | number | (per preset, else `min`) | Current value. Clamped to `[min, max]`. |
| `min` | number | `0` | Minimum value |
| `max` | number | `100` | Maximum value |
| `step` | number | `1` | Step granularity |
| `unit` | string | `""` | Suffix appended to the readout for `int` / `float` formats (e.g. `°`). |
| `format` | `percent` \| `int` \| `float` | `int` | Readout format. `percent` renders `value × 100 %`; `int` rounds and appends `unit`; `float` appends `unit` verbatim. |
| `with-mute` | boolean | `false` | When present, renders a mute toggle button before the slider (default on for the volume preset). |
| `muted` | boolean | `false` | When present (and `with-mute`), the range input is disabled and the mute button shows the muted icon. |
| `disabled` | boolean | `false` | Disables the mute button and the range input. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Get or set the value (clamped to `[min, max]`). Setting patches the input + readout in place — no full re-render. |
| `min` / `max` / `step` | `number` | Reflect the matching attributes (with per-preset defaults). |
| `unit` | `string` | Reflects the `unit` attribute. |
| `format` | `'percent' \| 'int' \| 'float'` | Reflects the `format` attribute. |
| `withMute` | `boolean` | Reflects the `with-mute` attribute. |
| `muted` | `boolean` | Reflects the `muted` attribute. Patched in place (swaps icon, toggles input disabled). |
| `disabled` | `boolean` | Reflects the `disabled` attribute. |
| `rowLabel` / `description` | `string` | Reflect the matching attributes. |
| `onChange` | `((value: number) => void) \| null` | Optional callback fired on every slider change. Mirrors the `tc-change` event. |
| `onToggleMute` | `(() => void) \| null` | Optional callback fired when the mute button is clicked. Mirrors the `tc-toggle-mute` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: number }` | Fired on every range-input change. |
| `tc-toggle-mute` | `{}` | Fired when the mute button is clicked (only with `with-mute`). The consumer toggles the `muted` attribute. |

**No slots.**

```html
<!-- Generic integer slider with a unit -->
<tc-setting-slider row-label="Render scale" value="100" min="50" max="200" step="5" format="int" unit="%"></tc-setting-slider>

<!-- Presets (range / format / mute inferred from the tag) -->
<tc-volume-slider row-label="Master volume" value="0.8"></tc-volume-slider>
<tc-deadzone-slider row-label="Left stick deadzone" value="0.15"></tc-deadzone-slider>
<tc-fov-slider row-label="Vertical FOV" min="70" max="140" value="103"></tc-fov-slider>
<script>
  const el = document.querySelector('tc-volume-slider')
  el.addEventListener('tc-change', e => console.log(e.detail.value))
  el.addEventListener('tc-toggle-mute', () => { el.muted = !el.muted })
</script>
```

---