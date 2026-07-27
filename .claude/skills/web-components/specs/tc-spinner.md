---
component: tc-spinner
---

### tc-spinner

Animated loading indicator.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `border\|grow\|dots\|bars\|pulse\|orbit` | `border` | Spinner shape |
| `variant` | `primary\|secondary\|…` | — | Color |
| `size` | `sm` | — | Small size |
| `label` | string | `Loading…` | Visually-hidden label |

Shapes: `border` (ring with colored arc), `grow` (pulsing dot), `dots` (bouncing trio), `bars` (equalizer bars), `pulse` (sonar ping), `orbit` (dashed ring with satellite dot).

```html
<tc-spinner type="border" variant="primary"></tc-spinner>
<tc-spinner type="grow" size="sm"></tc-spinner>
<tc-spinner type="dots" variant="info"></tc-spinner>
<tc-spinner type="bars"></tc-spinner>
<tc-spinner type="pulse" variant="success"></tc-spinner>
<tc-spinner type="orbit" size="sm"></tc-spinner>
```

---