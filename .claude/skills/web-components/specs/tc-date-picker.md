---
component: tc-date-picker
---

### tc-date-picker

Native HTML5 date input wrapper with optional label, min/max constraints, and `tc-change` event.

**Tag:** `tc-date-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Visible label linked to the input via `for`/`id` |
| `value` | string | `""` | Current date value in ISO `YYYY-MM-DD` format |
| `min` | string | — | Minimum selectable date (`YYYY-MM-DD`) |
| `max` | string | — | Maximum selectable date (`YYYY-MM-DD`) |
| `disabled` | boolean | `false` | Disables the input and dims the component |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string \| null` | `null` | Reflects the `label` attribute |
| `value` | `string` | `""` | Reflects the `value` attribute; reads the live input value |
| `min` | `string \| null` | `null` | Reflects the `min` attribute |
| `max` | `string \| null` | `null` | Reflects the `max` attribute |
| `disabled` | `boolean` | `false` | Reflects the `disabled` attribute |
| `onChange` | `((value: string) => void) \| null` | `null` | Callback fired alongside `tc-change` |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when the selected date changes. Bubbles + composed. |

**Slots:** none

```html
<tc-date-picker label="Event date" value="2026-06-14" min="2026-01-01" max="2026-12-31"></tc-date-picker>
<tc-date-picker label="Locked" value="2026-06-14" disabled></tc-date-picker>
```

```js
document.querySelector('tc-date-picker').addEventListener('tc-change', e => {
    console.log('date selected:', e.detail.value)
})
```

---