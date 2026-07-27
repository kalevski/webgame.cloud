---
component: tc-nav
---

### tc-nav

Navigation strip.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `tabs\|pills\|underline` | — | Nav style |
| `fill` | boolean | false | Fill available width |
| `justified` | boolean | false | Equal-width items |
| `vertical` | boolean | false | Vertical layout |

```html
<tc-nav variant="tabs">
    <tc-nav-item href="#a" active>Tab A</tc-nav-item>
    <tc-nav-item href="#b">Tab B</tc-nav-item>
</tc-nav>
```

#### tc-nav-item

**Attributes:** `href`, `target`, `active`, `disabled`

**Events:** `tc-show`, `tc-shown` (when variant is tabs/pills and a tab activates)

---