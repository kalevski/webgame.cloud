---
component: tc-textarea
---

### tc-textarea

Multi-line text input. Form-associated — add `name` to participate in `<form>` submission, `form.reset()`, and `form.checkValidity()`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Form field name (makes this control a form participant) |
| `value` | string | — | Current value |
| `placeholder` | string | — | Placeholder text |
| `label` | string | — | Visible label |
| `rows` | number | 3 | Visible rows |
| `size` | `sm\|lg` | — | Control size |
| `disabled` | boolean | false | Disabled |
| `readonly` | boolean | false | Read-only |
| `required` | boolean | false | Required |
| `state` | `valid\|invalid` | — | Validation state |
| `help` | string | — | Help text |

```html
<tc-textarea name="bio" label="Bio" rows="5" placeholder="Tell us about yourself…"></tc-textarea>
```

---