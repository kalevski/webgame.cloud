---
component: tc-input
---

### tc-input

Text input field. Form-associated — add `name` to participate in `<form>` submission, `form.reset()`, and `form.checkValidity()`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `text` | Input type |
| `name` | string | — | Form field name (makes this control a form participant) |
| `value` | string | — | Current value |
| `placeholder` | string | — | Placeholder text |
| `label` | string | — | Visible label |
| `size` | `sm\|lg` | — | Input size |
| `disabled` | boolean | false | Disabled |
| `readonly` | boolean | false | Read-only |
| `required` | boolean | false | Required |
| `state` | `valid\|invalid` | — | Validation state |
| `help` | string | — | Help text below input |

```html
<tc-input name="email" type="email" label="Email" placeholder="you@example.com" required></tc-input>
```

---