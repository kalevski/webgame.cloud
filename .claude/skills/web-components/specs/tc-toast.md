---
component: tc-toast
---

### tc-toast

Toast notification.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state |
| `title` | string | — | Header text |
| `autohide` | boolean | true | Auto-dismiss |
| `delay` | number | 5000 | Auto-hide delay (ms) |
| `variant` | string | — | `text-bg-*` color variant |

**Methods:** `show()`, `hide()`

**Events:** `tc-show`, `tc-shown`, `tc-hide`, `tc-hidden`

```html
<tc-toast title="Saved" variant="success" open autohide delay="3000">
    Your changes have been saved.
</tc-toast>
```

---