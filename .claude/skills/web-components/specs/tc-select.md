---
component: tc-select
---

### tc-select

Select dropdown input. Form-associated — add `name` to participate in `<form>` submission and `form.reset()`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Form field name (makes this control a form participant) |
| `label` | string | — | Visible label |
| `value` | string | — | Selected value |
| `multiple` | boolean | false | Multi-select |
| `size` | `sm\|lg` | — | Control size |
| `disabled` | boolean | false | Disabled |
| `state` | `valid\|invalid` | — | Validation state |

**Events:** `tc-change`

Populate with `tc-option` children:

```html
<tc-select name="country" label="Country">
    <tc-option value="us">United States</tc-option>
    <tc-option value="gb">United Kingdom</tc-option>
</tc-select>
```

#### tc-option

**Attributes:** `value`, `selected`, `disabled`

---