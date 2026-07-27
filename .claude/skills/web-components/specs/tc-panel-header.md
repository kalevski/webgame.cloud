---
component: tc-panel-header
---

### tc-panel-header

The header sub-element for `tc-panel`. Renders a heading row with an optional Lucide icon on the left and an optional action slot on the right. Gains a bottom hairline divider automatically when inside a `tc-panel--bordered` panel.

**Tag:** `tc-panel-header`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `heading` | `string` | `''` | Header text. |
| `icon` | `string` | — | Lucide icon name (PascalCase, e.g. `Settings`, `Activity`). |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `heading` | `string` | `''` | Reflects the `heading` attribute. |
| `icon` | `string \| null` | `null` | Reflects the `icon` attribute. |

#### Events

None. `tc-panel-header` is a presentational element with no interactive events.

#### Slots

| Slot | Description |
|---|---|
| `action` | Trailing action area (e.g. buttons, icon-buttons). Rendered inside `.tc-panel-header-action` on the right. |

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-panel-header-bg` | `var(--tc-surface)` | Header background color. |
| `--bs-panel-header-border-color` | `var(--tc-border)` | Color of the bottom hairline separator (shown in bordered panels). |
| `--bs-panel-header-color` | `var(--tc-text)` | Header text color. |
| `--bs-panel-header-padding-y` | `0.5rem` | Vertical padding. |
| `--bs-panel-header-padding-x` | `0.75rem` | Horizontal padding. |
| `--bs-panel-header-font-size` | `0.875rem` | Heading font size. |
| `--bs-panel-header-icon-size` | `1rem` | Icon width and height. |
| `--bs-panel-header-icon-color` | `var(--tc-text-muted)` | Icon color. |

#### Usage

```html
<!-- Heading only -->
<tc-panel-header heading="Panel Title"></tc-panel-header>

<!-- Heading with icon -->
<tc-panel-header heading="Settings" icon="Settings"></tc-panel-header>

<!-- Heading with action -->
<tc-panel-header heading="Activity" icon="Activity">
    <button slot="action" class="btn btn-sm btn-outline-secondary">View all</button>
</tc-panel-header>
```

---