---
component: tc-section-card
---

### tc-section-card

Card wrapper with a header containing an optional icon chip, title, and a named `action` slot. Body content is distributed via the default (unnamed) slot. Supports a `danger` variant for destructive/alert sections.

**Tag:** `tc-section-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | `''` | Card heading text rendered inside the header `<h3>`. Required for a meaningful card. |
| `icon` | `string` | — | Lucide icon name in PascalCase (e.g. `"Key"`, `"Trash2"`). When present, renders an inline SVG chip beside the title. Omit to show no icon. |
| `variant` | `'default' \| 'danger'` | `'default'` | Visual variant. `danger` adds a 4 px left border in `--tc-danger`, tints the header, and colors the title in the danger emphasis shade. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Reflects the `title` attribute. |
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `variant` | `SectionCardVariant` | Reflects the `variant` attribute. |

**Events**

None. `tc-section-card` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Card body content. Any child element without a `slot` attribute is distributed into the `.tc-section-card-body` container. |
| `action` | Action element(s) placed in the header, right-aligned beside the title. Add `slot="action"` to a child (e.g. `<tc-button slot="action">`). Omit to render no action area. |

**Accessibility**

- Card title is rendered as a real `<h3>` element for heading semantics.
- The icon chip carries `aria-hidden="true"` — it is purely decorative.
- The `danger` variant communicates state through color and a left border accent, not color alone (the heading text also changes to a dark-red emphasis color).
- Icon chip transition respects `prefers-reduced-motion`.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-section-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-section-card-border-color` | `var(--tc-border)` | Card 1 px hairline border color. |
| `--bs-section-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-section-card-header-bg` | ink gradient | Faint ink-gradient header background. |
| `--bs-section-card-header-border-color` | `var(--tc-border)` | Header bottom hairline color. |
| `--bs-section-card-header-padding-y` | `0.75rem` | Header vertical padding. |
| `--bs-section-card-header-padding-x` | `1.25rem` | Header horizontal padding. |
| `--bs-section-card-body-padding` | `1.25rem` | Card body padding (all sides). |
| `--bs-section-card-title-color` | `var(--tc-text)` | Card heading text color. |
| `--bs-section-card-title-font-size` | `0.9375rem` | Card heading font size. |
| `--bs-section-card-icon-color` | `var(--tc-text-muted)` | Icon stroke color. |
| `--bs-section-card-icon-size` | `1rem` | Icon SVG width/height. |
| `--bs-section-card-icon-chip-size` | `1.75rem` | Icon chip width/height. |
| `--bs-section-card-icon-chip-bg` | `var(--tc-surface-hover)` | Icon chip background. |
| `--bs-section-card-icon-chip-border-color` | `var(--tc-border)` | Icon chip border color. |
| `--bs-section-card-danger-border-color` | `var(--tc-danger)` | Danger left-border accent color. |
| `--bs-section-card-danger-header-bg` | faint red gradient | Danger variant header background tint. |
| `--bs-section-card-danger-header-border-color` | `rgba(220,38,38,0.25)` | Danger header bottom hairline. |
| `--bs-section-card-danger-title-color` | `#991b1b` | Danger variant title color (dark red emphasis). |
| `--bs-section-card-danger-icon-color` | `var(--tc-danger)` | Danger icon stroke color. |
| `--bs-section-card-danger-icon-chip-bg` | `#fee2e2` | Danger icon chip background. |
| `--bs-section-card-danger-icon-chip-border-color` | `rgba(220,38,38,0.25)` | Danger icon chip border. |

```html
<!-- Default — title only -->
<tc-section-card title="General Settings">
    <p>Configure your account preferences.</p>
</tc-section-card>

<!-- With icon -->
<tc-section-card title="API Keys" icon="Key">
    <p>Manage your API keys and access tokens.</p>
</tc-section-card>

<!-- With action slot -->
<tc-section-card title="Webhooks" icon="Webhook">
    <tc-button slot="action" variant="primary" size="sm">Add Webhook</tc-button>
    <p>Configure webhook endpoints for event notifications.</p>
</tc-section-card>

<!-- Danger variant -->
<tc-section-card title="Delete Account" icon="Trash2" variant="danger">
    <tc-button slot="action" variant="danger" size="sm">Delete</tc-button>
    <p>This action cannot be undone.</p>
</tc-section-card>
```

---