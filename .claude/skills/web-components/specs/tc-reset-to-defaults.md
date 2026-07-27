---
component: tc-reset-to-defaults
---

### tc-reset-to-defaults

A two-step reset action row: a label/description text block paired with a Reset button that enters a confirmation state (Confirm reset + Cancel). Confirming fires `tc-reset` and returns to idle; cancelling discards without firing. Built on the shared `tc-setting-row` scaffold, styled to the toolcase slate/ink look.

**Tag:** `tc-reset-to-defaults`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | `Reset to defaults` | Row label (set automatically when absent) |
| `description` | string | — | Optional secondary line beneath the label |
| `disabled` | boolean | `false` | Disables the Reset button |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `rowLabel` | `string` | Get/set the `row-label` attribute. |
| `description` | `string` | Get/set the `description` attribute. |
| `disabled` | `boolean` | Get/set the `disabled` attribute. |
| `onReset` | `(() => void) \| null` | Optional callback fired on confirmed reset. Mirrors the `tc-reset` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-reset` | `undefined` | Fired when the user confirms the reset (clicks Confirm reset). Not fired on cancel. |

**No slots.**

```html
<tc-reset-to-defaults
  row-label="Reset to defaults"
  description="All settings will return to their factory values."
></tc-reset-to-defaults>
<script>
  const el = document.querySelector('tc-reset-to-defaults')
  el.addEventListener('tc-reset', () => console.log('reset confirmed'))
  el.onReset = () => applyDefaults()
</script>
```

---