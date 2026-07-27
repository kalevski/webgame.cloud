---
component: tc-rich-page-header
---

### tc-rich-page-header

Page-level hero element with an optional square icon tile, chip row, title (`<h1>`), subtitle, description, and a trailing actions area. The icon tile is decorative (`aria-hidden`) — status meaning is conveyed by visible text. Slotted actions are real interactive elements with their own focus visibility. Purely presentational — no events.

**Tag:** `tc-rich-page-header`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title-text` | `string` | `""` | The page title rendered as an `<h1>`. Uses `title-text` (not `title`) to avoid the native `HTMLElement.title` tooltip attribute. |
| `sub` | `string` | — | Optional subtitle rendered below the title in muted text. |
| `description` | `string` | — | Optional description paragraph rendered below the subtitle in faint text. |
| `icon-name` | `string` | — | Lucide icon name (PascalCase, e.g. `Database`, `ShieldCheck`). Renders an inline SVG glyph inside the icon tile. Omit to hide the tile entirely. |
| `icon-color` | `RichPageHeaderIconColor` | `"slate"` | Tint applied to the icon tile background and stroke. One of: `violet`, `cyan`, `emerald`, `amber`, `pink`, `blue`, `slate`, `rose`. Defaults to `slate` (neutral muted surface). |

**JS Properties**

| Property | Type | Reflects | Description |
|----------|------|----------|-------------|
| `titleText` | `string \| null` | `title-text` attr | Gets/sets the `title-text` attribute. |
| `sub` | `string \| null` | `sub` attr | Gets/sets the `sub` attribute. |
| `description` | `string \| null` | `description` attr | Gets/sets the `description` attribute. |
| `iconName` | `string \| null` | `icon-name` attr | Gets/sets the `icon-name` attribute. |
| `iconColor` | `RichPageHeaderIconColor` | `icon-color` attr | Gets/sets the `icon-color` attribute. Defaults to `"slate"` when the attribute is absent or invalid. |

**Events**

None. `tc-rich-page-header` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `chips` | Named slot for chip/badge children rendered in a flex row above the title. Use `<… slot="chips">` on any child element. |
| `actions` | Named slot for action buttons rendered to the right of the header body (stacks below on narrow screens). Use `<… slot="actions">` on any child element. |

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-rich-page-header-bg` | `var(--tc-surface)` | Header background color. |
| `--bs-rich-page-header-border-color` | `var(--tc-border)` | Bottom hairline border color. |
| `--bs-rich-page-header-padding-y` | `1.5rem` | Vertical padding. |
| `--bs-rich-page-header-padding-x` | `1.5rem` | Horizontal padding. |
| `--bs-rich-page-header-gap` | `1rem` | Gap between icon tile and body, and between main and actions. |
| `--bs-rich-page-header-body-gap` | `0.5rem` | Gap between chips, title, sub, and description. |
| `--bs-rich-page-header-title-color` | `var(--tc-text)` | Title text color. |
| `--bs-rich-page-header-title-font-size` | `1.25rem` | Title font size (1.5rem on md+). |
| `--bs-rich-page-header-title-weight` | `600` | Title font weight (capped at 600). |
| `--bs-rich-page-header-sub-color` | `var(--tc-text-muted)` | Subtitle text color. |
| `--bs-rich-page-header-sub-font-size` | `0.9375rem` | Subtitle font size. |
| `--bs-rich-page-header-description-color` | `var(--tc-text-faint)` | Description text color. |
| `--bs-rich-page-header-description-font-size` | `0.875rem` | Description font size. |
| `--bs-rich-page-header-icon-size` | `3rem` | Icon tile width and height (square). |
| `--bs-rich-page-header-icon-glyph-size` | `1.25rem` | SVG glyph size inside the tile. |
| `--bs-rich-page-header-icon-bg` | `var(--tc-surface-muted)` | Icon tile background (overridden per color variant). |
| `--bs-rich-page-header-icon-color` | `var(--tc-text)` | Icon tile SVG stroke color (overridden per color variant). |
| `--bs-rich-page-header-icon-border-color` | `var(--tc-border)` | Icon tile border color (overridden per color variant). |
| `--bs-rich-page-header-chips-gap` | `0.5rem` | Gap between chip children. |
| `--bs-rich-page-header-actions-gap` | `0.5rem` | Gap between action children. |

```html
<!-- Full example: icon + chips + title + sub + description + actions -->
<tc-rich-page-header
    icon-name="Database"
    icon-color="blue"
    title-text="Projects"
    sub="Manage your active projects and archives"
    description="All projects are automatically backed up every 24 hours."
>
    <tc-badge slot="chips" variant="info">Beta</tc-badge>
    <tc-button slot="actions" variant="primary">New project</tc-button>
    <tc-button slot="actions" variant="secondary">Import</tc-button>
</tc-rich-page-header>

<!-- Title only (no icon) -->
<tc-rich-page-header title-text="Settings"></tc-rich-page-header>

<!-- All icon color variants -->
<tc-rich-page-header icon-name="Star" icon-color="violet" title-text="Violet"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="cyan"   title-text="Cyan"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="emerald" title-text="Emerald"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="amber"  title-text="Amber"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="pink"   title-text="Pink"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="blue"   title-text="Blue"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="slate"  title-text="Slate"></tc-rich-page-header>
<tc-rich-page-header icon-name="Star" icon-color="rose"   title-text="Rose"></tc-rich-page-header>

<!-- JS property access -->
<tc-rich-page-header id="ph"></tc-rich-page-header>
<script>
    const el = document.getElementById('ph')
    el.titleText = 'Dynamic Title'
    el.iconName = 'Layers'
    el.iconColor = 'emerald'
    el.sub = 'Updated via JS'
</script>
```

---