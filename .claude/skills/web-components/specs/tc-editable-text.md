---
component: tc-editable-text
---

### tc-editable-text

Inline editable label — looks like plain text at rest, reveals a form-control border on hover/focus. Commits on Enter or blur; reverts to the last committed value on Escape without firing a change event.

**Tag:** `tc-editable-text`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `default-value` | string | `""` | The initial and committed value |
| `placeholder` | string | — | Placeholder text shown when empty |
| `disabled` | boolean | false | Disables editing (native `disabled` + opacity) |
| `aria-label` | string | — | Accessible name forwarded to the inner `<input>` |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | string (read-only) | Current committed value |
| `defaultValue` | string | Reflects `default-value` attribute |
| `disabled` | boolean | Reflects `disabled` attribute |
| `placeholder` | string | Reflects `placeholder` attribute |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired on commit |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when a new value is committed (blur or Enter), but not on Escape or when value is unchanged |

**Slots:** none

```html
<!-- Default value + event listener -->
<tc-editable-text id="proj" default-value="My Project" aria-label="Project name"></tc-editable-text>
<script>
  document.getElementById('proj').addEventListener('tc-change', e => {
    console.log('committed:', e.detail.value)
  })
</script>

<!-- Placeholder only -->
<tc-editable-text placeholder="Click to add a label…" aria-label="Add label"></tc-editable-text>

<!-- Disabled -->
<tc-editable-text default-value="Archived" aria-label="Status" disabled></tc-editable-text>
```

---