---
component: tc-collapse
---

### tc-collapse

Toggleable content panel with built-in height/width animation.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Expanded state |
| `horizontal` | boolean | false | Horizontal collapse |

**Methods:** `show()`, `hide()`, `toggle()`

**Events:** `tc-show`, `tc-shown`, `tc-hide`, `tc-hidden`

```html
<button onclick="document.querySelector('tc-collapse').toggle()">Toggle</button>
<tc-collapse>Collapsible content</tc-collapse>
```

---