---
component: tc-heading
---

### tc-heading

Semantic heading element (h1–h6) with optional slate-ink gradient text treatment. Renders a real `<hN>` element for a correct document outline.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `as` | `h1\|h2\|h3\|h4\|h5\|h6` | `h2` | Which heading level to render |
| `gradient` | boolean | false | Apply slate-ink gradient text treatment |

**Slots**

| Slot | Description |
|------|-------------|
| (default) | Heading text or inline content |

```html
<tc-heading as="h1">Page title</tc-heading>
<tc-heading as="h2" gradient>Section with gradient</tc-heading>
<tc-heading>Default h2 heading</tc-heading>
```

---