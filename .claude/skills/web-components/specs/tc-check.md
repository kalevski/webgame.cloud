---
component: tc-check
---

### tc-check

Checkbox input.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Visible label |
| `checked` | boolean | false | Checked state |
| `disabled` | boolean | false | Disabled |
| `indeterminate` | boolean | false | Indeterminate state |
| `inline` | boolean | false | Inline display |
| `reverse` | boolean | false | Label before input |
| `state` | `valid\|invalid` | — | Validation state |

**Events:** `tc-change` with `{ detail: { checked: boolean } }`

```html
<tc-check label="I agree" checked></tc-check>
<tc-check label="Disabled" disabled></tc-check>
```

---