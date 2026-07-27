---
component: tc-text
---

### tc-text

Flexible text element with semantic HTML tags and style variants. Renders as a `<p>`, `<span>`, `<small>`, or `<div>` controlled by the `as` attribute.

**Tag:** `tc-text`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `default\|muted\|code\|mono\|truncate` | `default` | Visual style: default prose, muted color, inline code chip, monospace, or single-line truncation |
| `size` | `small\|default\|large` | `default` | Type scale: small ≈ 0.8rem, default ≈ 0.925rem, large ≈ 1.0625rem |
| `as` | `p\|span\|small\|div` | `p` | Semantic HTML tag rendered as the inner element |

**Events**

None. `tc-text` is a purely presentational element.

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Text content — arbitrary inline markup, preserved across re-renders inside `.tc-text-content` |

```html
<tc-text>Default paragraph text.</tc-text>
<tc-text variant="muted">Secondary, muted note.</tc-text>
<tc-text variant="code">inline.code()</tc-text>
<tc-text variant="mono">mono spaced output</tc-text>
<tc-text variant="truncate" as="div" style="width:200px">Long text truncated with ellipsis.</tc-text>
<tc-text size="small" variant="muted">Small muted caption.</tc-text>
<tc-text size="large">Large body text.</tc-text>
<tc-text as="span">Inline span text.</tc-text>
```

---