---
component: tc-alert
---

### tc-alert

Contextual feedback message.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `primary\|secondary\|success\|danger\|warning\|info\|light\|dark` | `primary` | Color variant |
| `dismissible` | boolean | false | Show close button |

**Methods:** `close()`

**Events:** `tc-closed`

```html
<tc-alert variant="success" dismissible>Operation completed.</tc-alert>
```

---