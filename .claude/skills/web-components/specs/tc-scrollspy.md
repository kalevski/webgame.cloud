---
component: tc-scrollspy
---

### tc-scrollspy

Scroll-position tracker (IntersectionObserver based).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | string | — | CSS selector of nav to highlight |
| `offset` | number | 0 | Offset from top (px) |
| `smooth-scroll` | boolean | false | Smooth scroll to sections |

**Events:** `tc-activate`

```html
<tc-scrollspy target="#navbar" style="height:200px; overflow-y:auto;">
    <h4 id="section-1">Section 1</h4>
    <p>...</p>
    <h4 id="section-2">Section 2</h4>
    <p>...</p>
</tc-scrollspy>
```

---