---
component: tc-eyebrow
---

### tc-eyebrow

Small uppercase micro-label shown above a heading. Machine-facing JetBrains Mono, wide letter-spacing, slate-muted ink, sharp corners. Content is provided via the default slot — no attributes, properties, or events.

**Slots**

| Slot | Description |
|------|-------------|
| (default) | Label text or inline content (rendered uppercase) |

**Theming (`--bs-eyebrow-*`)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-eyebrow-font-family` | `'JetBrains Mono', var(--bs-font-monospace, monospace)` | Label font family |
| `--bs-eyebrow-font-size` | `0.6875rem` | Label font size |
| `--bs-eyebrow-font-weight` | `500` | Label font weight |
| `--bs-eyebrow-line-height` | `1.4` | Label line height |
| `--bs-eyebrow-letter-spacing` | `0.12em` | Letter spacing |
| `--bs-eyebrow-color` | `var(--tc-text-muted)` | Label text color |

```html
<tc-eyebrow>What's new</tc-eyebrow>
<tc-heading as="h2">Release 2.0 is here</tc-heading>
```

---