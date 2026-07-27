---
component: tc-brand
---

### tc-brand

Branded wordmark with primary/secondary text, a customisable accent underline bar, and an optional micro-label chip. The primary wordmark renders in JetBrains Mono weight 700 (uppercase, tracked); secondary text uses the muted slate ladder; the label is a sharp-cornered mono micro-chip. The underline defaults to the toolcase signature cyan (`--tc-accent`) and is overridable via the `color` attribute.

**Tag:** `tc-brand`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `primary-text` | string | — | Primary wordmark text rendered as the branded mark |
| `secondary-text` | string | — | Secondary text rendered inline after the primary mark |
| `label` | string | — | Micro-label text rendered as a small chip beside the wordmark |
| `color` | string (CSS color) | `var(--tc-accent)` | CSS color for the underline accent bar (hex, oklch, named, etc.) |
| `xlarge` | boolean | false | Scales primary and secondary text to 2rem |

**Slots**

| Slot | Description |
|------|-------------|
| `primary` | Rich content for the primary wordmark region (overrides `primary-text` attribute when both present) |
| `secondary` | Rich content for the secondary text region (overrides `secondary-text` attribute) |
| `label` | Rich content for the label chip region (overrides `label` attribute) |

**Events**

None.

```html
<!-- Primary text via attribute -->
<tc-brand primary-text="ToolCase"></tc-brand>

<!-- Primary + secondary text -->
<tc-brand primary-text="Tool" secondary-text="Case"></tc-brand>

<!-- With label chip -->
<tc-brand primary-text="ToolCase" label="beta"></tc-brand>

<!-- Custom underline color -->
<tc-brand primary-text="ToolCase" color="#e85d04"></tc-brand>

<!-- Xlarge scale -->
<tc-brand primary-text="ToolCase" xlarge></tc-brand>

<!-- Rich slotted content -->
<tc-brand>
    <strong slot="primary">ToolCase</strong>
    <span slot="secondary">Platform</span>
    <em slot="label">v2</em>
</tc-brand>
```

---