---
component: tc-basic-layout
---

### tc-basic-layout

Two-section page layout: an optional brand header region followed by a full-height main content area. Flat structural surface — no shadows, no border-radius, slate neutrals only.

**Tag:** `tc-basic-layout`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `brand` | string | — | Text content for the brand header. When set, renders a `<header>` with the attribute value. When omitted and no `slot="brand"` children are present, the header is hidden entirely. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `brand` | `string \| null` | Reflects the `brand` attribute. |

**Events**

None. `tc-basic-layout` is a purely presentational layout element.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Main page content. Rendered inside `<main class="tc-basic-layout-main">`. |
| `brand` | Rich brand header content (logos, nav, custom markup). Used when the `brand` attribute is absent. Rendered inside `<header class="tc-basic-layout-brand">`. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-basic-layout-brand-bg` | `var(--tc-surface)` | Brand header background. |
| `--bs-basic-layout-brand-color` | `var(--tc-text)` | Brand header text color. |
| `--bs-basic-layout-brand-border` | `var(--tc-border)` | Color of the 1px hairline beneath the brand header. |
| `--bs-basic-layout-main-bg` | `transparent` | Main content area background. |
| `--bs-basic-layout-main-color` | `var(--tc-text)` | Main content area text color. |

```html
<!-- Brand via attribute -->
<tc-basic-layout brand="My App">
    <p>Page content here.</p>
</tc-basic-layout>

<!-- Rich brand via slot -->
<tc-basic-layout>
    <div slot="brand">
        <img src="logo.svg" alt="My App" />
    </div>
    <p>Page content here.</p>
</tc-basic-layout>

<!-- No header -->
<tc-basic-layout>
    <p>Full-height main area, no brand header.</p>
</tc-basic-layout>
```

---