---
component: tc-radio
---

### tc-radio

Radio button input.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Visible label |
| `name` | string | — | Group name |
| `value` | string | — | Input value |
| `checked` | boolean | false | Selected state |
| `disabled` | boolean | false | Disabled |
| `inline` | boolean | false | Inline display |
| `reverse` | boolean | false | Label before input |

**Events:** `tc-change`

```html
<tc-radio name="size" value="sm" label="Small"></tc-radio>
<tc-radio name="size" value="lg" label="Large" checked></tc-radio>
```

---