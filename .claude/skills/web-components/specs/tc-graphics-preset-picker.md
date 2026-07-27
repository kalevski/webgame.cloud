---
component: tc-graphics-preset-picker
---

### tc-graphics-preset-picker

A low / medium / high / ultra graphics-preset setting row: a label/description text block paired with a segmented preset button group (one hairline frame, 1px internal separators, sharp corners, mono uppercase labels — the active segment carries the signature slate-ink fill). Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse), styled to the toolcase slate/ink look.

**Tag:** `tc-graphics-preset-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | `Quality preset` | Row label (set automatically when absent) |
| `description` | string | — | Optional secondary line beneath the label |
| `value` | string | `medium` | Selected preset — one of `low`, `medium`, `high`, `ultra` (set automatically when absent) |
| `disabled` | boolean | `false` | Disables the preset group |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | Get/set the selected preset. Setting patches the active segment in place — no full re-render. |
| `rowLabel` | `string` | Get/set the `row-label` attribute. |
| `description` | `string` | Get/set the `description` attribute. |
| `disabled` | `boolean` | Get/set the `disabled` attribute. |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired on every selection. Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when a preset is selected (the new preset value). |

**No slots.**

```html
<tc-graphics-preset-picker row-label="Graphics quality" description="Higher presets sharpen shadows and textures at the cost of frame rate." value="high"></tc-graphics-preset-picker>
<script>
  const el = document.querySelector('tc-graphics-preset-picker')
  el.value = 'ultra'
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```