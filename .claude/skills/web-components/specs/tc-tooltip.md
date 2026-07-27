---
component: tc-tooltip
---

### tc-tooltip

Tooltip positioned by Popper.js.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Tooltip text |
| `placement` | `top\|right\|bottom\|left\|auto` | `auto` | Position |
| `trigger` | string | `hover focus` | Trigger events |
| `html` | boolean | false | Allow HTML in title |

**Methods:** `show()`, `hide()`, `toggle()`

**Events:** `tc-show`, `tc-shown`, `tc-hide`, `tc-hidden`

```html
<tc-tooltip title="Helpful hint" placement="top">
    <button class="btn btn-secondary">Hover me</button>
</tc-tooltip>
```

---