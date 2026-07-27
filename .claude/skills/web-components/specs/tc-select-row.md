---
component: tc-select-row
---

### tc-select-row

A generic labeled dropdown setting row: a label/description text block paired with a native `<select>` whose options are supplied via the `options` JS property. Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse); the control reuses the design-system `.form-select` chrome, styled to the toolcase slate/ink look.

**Tag:** `tc-select-row`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | — | Row label displayed on the left |
| `description` | string | — | Optional secondary line beneath the label |
| `value` | string | — | Currently selected option `value` |
| `disabled` | boolean | `false` | Disables the select |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string` | Get/set the selected option value. Setting patches the select in place — no full re-render. |
| `options` | `SelectOption[]` | Get/set the option list (`{ value, label }[]`). Defaults to an empty array — must be supplied by the consumer. Setting re-renders the control. |
| `rowLabel` | `string` | Get/set the `row-label` attribute. |
| `description` | `string` | Get/set the `description` attribute. |
| `disabled` | `boolean` | Get/set the `disabled` attribute. |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired on every change. Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when the selected option changes (the option `value`). |

**No slots.**

```html
<tc-select-row row-label="Texture quality" description="Controls texture resolution." value="high"></tc-select-row>
<script>
  const el = document.querySelector('tc-select-row')
  el.options = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'ultra', label: 'Ultra' },
  ]
  el.value = 'high'
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---