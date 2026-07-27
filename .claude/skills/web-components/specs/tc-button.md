---
component: tc-button
---

### tc-button

Button.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `primary\|secondary\|success\|danger\|warning\|info\|light\|dark` | `primary` | Color variant |
| `outline` | boolean | false | Outline style |
| `size` | `sm\|lg` | — | Button size |
| `disabled` | boolean | false | Disabled state |
| `loading` | boolean | false | Show spinner, disables button |
| `href` | string | — | Render as `<a>` link button |
| `type` | `button\|submit\|reset` | `button` | Button type |

```html
<tc-button variant="primary">Save</tc-button>
<tc-button variant="danger" outline>Delete</tc-button>
<tc-button loading>Saving…</tc-button>
```

---