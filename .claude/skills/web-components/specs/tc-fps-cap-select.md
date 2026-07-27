---
component: tc-fps-cap-select
---

### tc-fps-cap-select

A preset FPS-cap picker: a label/description text block paired with a native `<select>` of frame-rate presets. Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse); the control reuses the design-system `.form-select` chrome with a mono readout font, styled to the toolcase slate/ink look.

**Tag:** `tc-fps-cap-select`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | `FPS Cap` | Row label (set automatically when absent) |
| `description` | string | — | Optional secondary line beneath the label |
| `value` | string | — | Currently selected option `value` (e.g. `60`; `0` is the "Unlimited" preset) |
| `disabled` | boolean | `false` | Disables the select |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | Get/set the selected option value. Setting patches the select in place — no full re-render. |
| `options` | `FPSCapOption[]` | Get/set the preset list (`{ value, label }[]`). Defaults to the six presets `30/60/120/144/240 FPS` + `Unlimited` (`0`). Setting re-renders the control. |
| `rowLabel` | `string` | Get/set the `row-label` attribute. |
| `description` | `string` | Get/set the `description` attribute. |
| `disabled` | `boolean` | Get/set the `disabled` attribute. |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired on every change. Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when the selected preset changes (the option `value`). |

**No slots.**

```html
<tc-fps-cap-select row-label="Frame rate limit" description="Cap the renderer to reduce GPU load." value="60"></tc-fps-cap-select>
<script>
  const el = document.querySelector('tc-fps-cap-select')
  el.options = [{ value: '60', label: '60 FPS' }, { value: '0', label: 'Uncapped' }]
  el.value = '60'
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---