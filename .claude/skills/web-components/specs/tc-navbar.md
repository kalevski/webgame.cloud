---
component: tc-navbar
---

### tc-navbar

Responsive navigation bar with built-in collapse behavior. Styled as the toolcase app chrome: translucent glass surface (backdrop blur) on a hairline border, the brand rendered as the typographic mark (cyan square dot + mono wordmark), active links carrying a 2px accent underline. `variant="dark"` switches to the ink surface.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `brand` | string | — | Brand name |
| `expand` | `sm\|md\|lg\|xl\|xxl` | `lg` | Collapse breakpoint |
| `variant` | `dark\|light` | — | Theme |
| `bg` | string | — | Background color variant |
| `fixed` | `top\|bottom` | — | Fixed position |
| `sticky` | `top\|bottom` | — | Sticky position |

```html
<tc-navbar brand="MyApp" expand="md" variant="dark" bg="dark">
    <tc-nav>
        <tc-nav-item href="/" active>Home</tc-nav-item>
        <tc-nav-item href="/docs">Docs</tc-nav-item>
    </tc-nav>
</tc-navbar>
```

---