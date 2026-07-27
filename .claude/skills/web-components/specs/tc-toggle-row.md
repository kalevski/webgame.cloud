---
component: tc-toggle-row
---

### tc-toggle-row

A generic labeled boolean toggle setting row: a label/description text block paired with a pill-track switch (`role="switch"`, pure-circle knob — the checked track carries the signature slate-ink gradient). Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse), styled to the toolcase slate/ink look. For named setting presets (V-Sync, invert-axis, …) just set `row-label` — `<tc-toggle-row row-label="V-Sync" checked>`.

**Tag:** `tc-toggle-row`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | — | Row label displayed on the left |
| `description` | string | — | Optional secondary line beneath the label |
| `checked` | boolean | `false` | Whether the toggle is on |
| `disabled` | boolean | `false` | Disables the switch |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `checked` | `boolean` | Get/set the on/off state. Setting patches the switch in place — no full re-render. |
| `rowLabel` | `string` | Get/set the `row-label` attribute. |
| `description` | `string` | Get/set the `description` attribute. |
| `disabled` | `boolean` | Get/set the `disabled` attribute. |
| `onChange` | `((value: boolean) => void) \| null` | Optional callback fired on every toggle. Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: boolean }` | Fired when the switch is toggled (the new checked state). |

**No slots.**

```html
<tc-toggle-row row-label="Auto-save" description="Save progress automatically." checked></tc-toggle-row>
<script>
  const el = document.querySelector('tc-toggle-row')
  el.checked = true
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---