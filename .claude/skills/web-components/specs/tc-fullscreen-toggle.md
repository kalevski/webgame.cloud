---
component: tc-fullscreen-toggle
---

### tc-fullscreen-toggle

A fullscreen on/off setting row: a label/description text block paired with a pill-track switch (`role="switch"`, pure-circle knob — the checked track carries the signature slate-ink gradient). Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse), styled to the toolcase slate/ink look.

**Tag:** `tc-fullscreen-toggle`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | `Fullscreen` | Row label (set automatically when absent) |
| `description` | string | — | Optional secondary line beneath the label |
| `checked` | boolean | `false` | Whether fullscreen is on |
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
<tc-fullscreen-toggle row-label="Borderless fullscreen" description="Run at the desktop resolution without a window frame." checked></tc-fullscreen-toggle>
<script>
  const el = document.querySelector('tc-fullscreen-toggle')
  el.checked = true
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---