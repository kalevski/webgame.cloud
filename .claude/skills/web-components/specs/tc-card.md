---
component: tc-card
---

### tc-card

Content container with optional header/footer.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Card title in header |
| `subtitle` | string | — | Card subtitle |
| `variant` | `primary\|secondary\|success\|danger\|warning\|info\|light\|dark` | — | Background color (`text-bg-*`) |
| `img` | string | — | Image URL |
| `img-position` | `top\|bottom` | `top` | Image position |

**Slots:** default (body), `slot="header"`, `slot="footer"`

```html
<tc-card title="My Card">
    <p>Body content.</p>
    <tc-button slot="footer" variant="primary">Action</tc-button>
</tc-card>
```

---