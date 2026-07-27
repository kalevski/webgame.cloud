---
component: tc-asset-row
---

### tc-asset-row

Single row displaying an asset with a leading icon, primary name label, optional tag chips, and a trailing size. Non-interactive; dispatches no events. Sharp corners (`border-radius: 0`); slate neutrals throughout — `--tc-text` for the name, `--tc-text-muted` for the size and icon, 1px `--tc-border` bottom hairline for row separation, hover to `--tc-surface-hover`. Size and tags rendered in mono.

**Tag:** `tc-asset-row`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `icon` | string | — | Lucide icon name (e.g. `"FileText"`). When present, renders the glyph inline. When absent, `slot="icon"` child is used |
| `name` | string | — | Asset name text. When present, rendered as escaped text. When absent, `slot="name"` child is used |
| `size` | string | — | Trailing size / meta text (e.g. `"4.2 KB"`). When present, rendered in mono. When absent, `slot="size"` child is used |
| `class` | string | — | Extra CSS classes on the host element (pass-through) |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tags` | `string[]` | `[]` | Array of tag strings rendered as neutral slate chips beside the name. Set via JS: `el.tags = ['v1.0', 'stable']` |

**Events**

None. `tc-asset-row` is a purely presentational element.

**Slots**

| Slot | Description |
|------|-------------|
| `icon` | Optional leading icon node. Used when the `icon` attribute is absent |
| `name` | Primary label content. Used when the `name` attribute is absent |
| `size` | Trailing size/meta content. Used when the `size` attribute is absent |

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-asset-row-padding-x` | `0.8125rem` | Horizontal padding |
| `--bs-asset-row-padding-y` | `0.625rem` | Vertical padding |
| `--bs-asset-row-gap` | `0.625rem` | Gap between row children |
| `--bs-asset-row-name-color` | `var(--tc-text)` | Name text color |
| `--bs-asset-row-size-color` | `var(--tc-text-muted)` | Size text color |
| `--bs-asset-row-tag-bg` | `var(--tc-surface-muted)` | Tag chip background |
| `--bs-asset-row-tag-color` | `var(--tc-text)` | Tag chip text color |
| `--bs-asset-row-tag-border-color` | `var(--tc-border)` | Tag chip hairline |
| `--bs-asset-row-tag-font-size` | `0.72rem` | Tag chip font size |
| `--bs-asset-row-separator-color` | `var(--tc-border)` | Bottom hairline color between consecutive rows |
| `--bs-asset-row-hover-bg` | `var(--tc-surface-hover)` | Row hover background |
| `--bs-asset-row-icon-size` | `1rem` | Leading icon size |

```html
<!-- Attribute-driven row -->
<tc-asset-row icon="FileText" name="README.md" size="4.2 KB"></tc-asset-row>

<!-- With tags (set via JS property) -->
<tc-asset-row id="row1" icon="Package" name="@toolcase/base" size="12 KB"></tc-asset-row>
<script>
    document.getElementById('row1').tags = ['v1.2.0', 'stable']
</script>

<!-- Slotted name and icon -->
<tc-asset-row size="8 KB">
    <img slot="icon" src="custom-icon.svg" width="16" height="16" alt="" />
    <strong slot="name">custom-name.json</strong>
</tc-asset-row>

<!-- Consecutive rows with hairline separators -->
<div style="border: 1px solid var(--tc-border)">
    <tc-asset-row icon="FileText" name="index.ts" size="2.1 KB"></tc-asset-row>
    <tc-asset-row icon="Image" name="logo.png" size="18 KB"></tc-asset-row>
    <tc-asset-row icon="Music" name="track.mp3" size="3.8 MB"></tc-asset-row>
</div>
```
```

---