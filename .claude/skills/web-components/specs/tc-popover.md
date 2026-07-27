---
component: tc-popover
---

### tc-popover

Popover positioned by Popper.js.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Popover header |
| `content` | string | — | Popover body text |
| `placement` | `top\|right\|bottom\|left\|auto` | `auto` | Position |
| `trigger` | string | `click` | Trigger events |
| `html` | boolean | false | Allow HTML in content |

**Methods:** `show()`, `hide()`, `toggle()`

**Events:** `tc-show`, `tc-shown`, `tc-hide`, `tc-hidden`

```html
<tc-popover title="Info" content="Extra details here." placement="top">
    <button class="btn btn-info">ℹ Info</button>
</tc-popover>
```

---