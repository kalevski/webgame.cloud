---
component: tc-switch
---

### tc-switch

Toggle switch (styled checkbox). Form-associated — add `name` to participate in `<form>` submission. Submits its `value` attribute (default `"on"`) when checked, or nothing when unchecked.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Form field name (makes this control a form participant) |
| `label` | string | — | Visible label |
| `checked` | boolean | false | On/off state |
| `value` | string | `"on"` | Value submitted when checked |
| `disabled` | boolean | false | Disabled |
| `reverse` | boolean | false | Label before switch |

**Events:** `tc-change` with `{ detail: { value: boolean } }`

```html
<tc-switch name="newsletter" label="Subscribe to newsletter" value="yes" checked></tc-switch>
```

---