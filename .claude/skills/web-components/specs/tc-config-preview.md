---
component: tc-config-preview
---

### tc-config-preview

**Tag:** `tc-config-preview`

JSON-like configuration preview with syntax-highlighted key-value pairs rendered on a dark code surface. Purely presentational — no callbacks or events.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `live-label` | string | — | Text for the "live" status badge shown in the header strip. When absent and no `slot="live-label"` children are provided, the header strip is hidden. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `liveLabel` | `string \| null` | `null` | Reflects the `live-label` attribute. |
| `entries` | `ConfigPreviewEntry[]` | `[]` | Array of key-value entries to render as syntax-highlighted lines. Each entry: `{ key: string; value: string \| number \| boolean \| null; comment?: string }`. Setting this property triggers a re-render. |

**Events**

None. `tc-config-preview` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Custom body content. When present, it is rendered inside the preview body alongside (or instead of) the auto-generated `entries` lines. Preserved across re-renders. |
| `live-label` | Rich content for the live badge label. Used when the `live-label` attribute is absent. A named-slot child with `slot="live-label"` goes into the badge label area and causes the header strip to appear. |

**Accessibility**

`<pre>` content is readable text. The live-badge label text (from attribute or slot) provides the accessible label for the badge; the decorative dot is `aria-hidden="true"`. Focus is never suppressed. `prefers-reduced-motion` freezes the live-dot pulse animation while retaining the static dot color.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-config-preview-bg` | `var(--tc-ink)` | Panel background (dark code surface). |
| `--bs-config-preview-border` | `1px solid var(--tc-border)` | Outer 1px hairline frame. |
| `--bs-config-preview-font-size` | `0.85rem` | Mono body font size. |
| `--bs-config-preview-line-height` | `1.6` | Body line height. |
| `--bs-config-preview-padding-y` | `0.875rem` | Vertical padding of the code body. |
| `--bs-config-preview-padding-x` | `1rem` | Horizontal padding of the code body. |
| `--bs-config-preview-header-bg` | `var(--tc-ink-2)` | Header strip background (slightly lighter ink). |
| `--bs-config-preview-header-border` | `1px solid var(--tc-border)` | Header bottom hairline. |
| `--bs-config-preview-header-padding` | `0.375rem 0.75rem` | Header strip padding. |
| `--bs-config-preview-text-color` | `var(--tc-text-inverse)` | Default code text color. |
| `--bs-config-preview-key-color` | `oklch(0.75 0.06 220)` | Syntax token color for keys (muted slate-blue). |
| `--bs-config-preview-string-color` | `oklch(0.78 0.1 150)` | Syntax token color for string values (muted green). |
| `--bs-config-preview-number-color` | `oklch(0.80 0.1 75)` | Syntax token color for number values (muted amber). |
| `--bs-config-preview-boolean-color` | `oklch(0.75 0.1 300)` | Syntax token color for boolean values (muted purple). |
| `--bs-config-preview-null-color` | `oklch(0.68 0.08 30)` | Syntax token color for null values (muted red-orange). |
| `--bs-config-preview-comment-color` | `oklch(0.55 0.01 250)` | Syntax token color for inline comments (muted slate gray). |
| `--bs-config-preview-live-badge-bg` | `var(--tc-accent-soft)` | Live badge pill background. |
| `--bs-config-preview-live-badge-color` | `var(--tc-accent-fg)` | Live badge text color. |
| `--bs-config-preview-live-badge-border` | `1px solid var(--tc-accent)` | Live badge pill border. |
| `--bs-config-preview-live-dot-color` | `var(--tc-accent)` | Live status dot color (cyan). |
| `--bs-config-preview-live-dot-size` | `6px` | Live status dot diameter. |

```html
<!-- Basic entries (string, number, boolean, null) -->
<tc-config-preview id="cp1"></tc-config-preview>
<script>
    document.getElementById('cp1').entries = [
        { key: 'host', value: 'db.internal', comment: 'primary host' },
        { key: 'port', value: 5432 },
        { key: 'ssl', value: true },
        { key: 'timeout', value: null },
    ]
</script>

<!-- With live-label attribute -->
<tc-config-preview id="cp2" live-label="Live"></tc-config-preview>
<script>
    document.getElementById('cp2').entries = [
        { key: 'region', value: 'us-east-1' },
        { key: 'workers', value: 4 },
    ]
</script>

<!-- live-label via slot -->
<tc-config-preview id="cp3">
    <span slot="live-label">Connected</span>
</tc-config-preview>
<script>
    document.getElementById('cp3').entries = [
        { key: 'status', value: 'healthy' },
    ]
</script>

<!-- Children-based body (custom content, no entries) -->
<tc-config-preview live-label="Custom">
    <span style="font-family: var(--tc-font-mono); color: var(--tc-text-inverse)">
        region: us-east-1
    </span>
</tc-config-preview>
```

---