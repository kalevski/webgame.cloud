---
component: tc-range
---

### tc-range

Range slider input.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Visible label |
| `value` | number | 0 | Current value |
| `min` | number | 0 | Minimum |
| `max` | number | 100 | Maximum |
| `step` | number | 1 | Step increment |
| `disabled` | boolean | false | Disabled |

**Events:** `tc-change` with `{ detail: { value: number } }`

```html
<tc-range label="Volume" min="0" max="100" value="50" step="5"></tc-range>
```

---