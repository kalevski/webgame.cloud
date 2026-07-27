---
component: tc-plugin-grid
---

### tc-plugin-grid

Responsive grid of plugin cards. Each card displays a logo (image or lucide icon), plugin name, description, monospace install command with a copy affordance, and a formatted download count. Column count is controlled by the `columns` attribute; layout collapses to fewer columns on narrow viewports. Entirely data-driven via the `items` JS property — no slot children.

**Tag:** `tc-plugin-grid`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | `2 \| 3 \| 4` | `3` | Number of grid columns. Invalid values fall back to `3`. Collapses to fewer columns on narrow viewports. |
| `title-text` | `string` | — | Optional section heading rendered above the grid. Chosen over the native `title` tooltip attribute to avoid conflict. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `PluginGridColumns` | Reflects the `columns` attribute as a number. |
| `titleText` | `string` | Reflects the `title-text` attribute. |
| `items` | `PluginItem[]` | Array of plugin data objects. Setting triggers a re-render. Default `[]`. |

**`PluginItem` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | Plugin name — rendered as the card heading (`<h3>`). |
| `description` | `string` | no | Short plugin description. |
| `logo` | `string` | no | Image URL for the plugin logo. Takes priority over `iconName`. |
| `iconName` | `string` | no | PascalCase lucide icon name (e.g. `"Shield"`) used when `logo` is absent. Decorative — `aria-hidden`. |
| `install` | `string` | no | Install command rendered as a monospace chip. Clicking the copy button dispatches `tc-copy`. |
| `downloads` | `number` | no | Download count formatted as `12.3k` / `1.2m`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-copy` | `{ install: string }` | Dispatched (bubbles, composed) when the user clicks the copy button beside an install command. |

**Slots**

None. `tc-plugin-grid` is purely data-driven via the `items` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-plugin-grid-gap` | `1rem` | Gap between cards. |
| `--bs-plugin-grid-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-plugin-grid-card-border` | `1px solid var(--tc-border)` | Card border. |
| `--bs-plugin-grid-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-plugin-grid-card-shadow-hover` | `var(--tc-shadow-hover)` | Card hover shadow. |
| `--bs-plugin-grid-card-padding` | `1.25rem` | Inner card padding. |
| `--bs-plugin-grid-name-color` | `var(--tc-text)` | Plugin name text color. |
| `--bs-plugin-grid-desc-color` | `var(--tc-text-muted)` | Description text color. |
| `--bs-plugin-grid-install-bg` | `var(--tc-surface-muted)` | Install command chip background. |
| `--bs-plugin-grid-install-color` | `var(--tc-text)` | Install command text color. |
| `--bs-plugin-grid-downloads-color` | `var(--tc-text-faint)` | Download count text color. |
| `--bs-plugin-grid-logo-size` | `2rem` | Logo image / icon size. |

```html
<!-- 3-column grid with title and tc-copy event -->
<tc-plugin-grid id="plugins" columns="3" title-text="Community Plugins"></tc-plugin-grid>
<script>
  const grid = document.getElementById('plugins')
  grid.items = [
    {
      name: 'tc-auth',
      description: 'Pluggable authentication middleware with JWT support.',
      iconName: 'Shield',
      install: 'npm install @toolcase/tc-auth',
      downloads: 48200,
    },
    {
      name: 'tc-logger',
      description: 'Structured logging plugin with OTLP exporter.',
      iconName: 'FileText',
      install: 'npm install @toolcase/tc-logger',
      downloads: 127000,
    },
    {
      name: 'tc-cache',
      description: 'In-process LRU cache with optional Redis fallback.',
      logo: 'https://example.com/tc-cache.png',
      install: 'npm install @toolcase/tc-cache',
      downloads: 3800,
    },
  ]
  grid.addEventListener('tc-copy', e => {
    navigator.clipboard.writeText(e.detail.install)
  })
</script>

<!-- 2-column grid -->
<tc-plugin-grid id="plugins2" columns="2"></tc-plugin-grid>

<!-- 4-column grid -->
<tc-plugin-grid id="plugins4" columns="4"></tc-plugin-grid>
```

---