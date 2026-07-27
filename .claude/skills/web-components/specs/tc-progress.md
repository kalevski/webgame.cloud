---
component: tc-progress
---

### tc-progress

Progress bar.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | 0 | Current value |
| `min` | number | 0 | Minimum value |
| `max` | number | 100 | Maximum value |
| `variant` | `primary\|secondary\|…` | — | Bar color |
| `striped` | boolean | false | Striped style |
| `animated` | boolean | false | Animated stripe |
| `label` | boolean | false | Show percentage text |

Use `tc-progress-bar` children for stacked bars:

```html
<tc-progress value="60" variant="primary" label></tc-progress>

<!-- stacked -->
<tc-progress>
    <tc-progress-bar value="30" variant="primary"></tc-progress-bar>
    <tc-progress-bar value="40" variant="success"></tc-progress-bar>
</tc-progress>
```

#### tc-progress-bar

**Attributes:** `value` (0–100), `variant`, `striped`, `animated`, `label`

---