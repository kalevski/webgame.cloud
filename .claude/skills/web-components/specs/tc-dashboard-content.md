---
component: tc-dashboard-content
---

### tc-dashboard-content

Scrollable main content area for the dashboard layout. A pure layout wrapper — no chrome, no elevation. Provides comfortable padding and `overflow-y: auto` for hosting cards, rows, and section headers inside a dashboard shell.

**Tag:** `tc-dashboard-content`

**Attributes**

None. `tc-dashboard-content` is a purely structural layout element with no configurable attributes.

**JS Properties**

None.

**Events**

None. `tc-dashboard-content` is a purely presentational layout element.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Main dashboard content (cards, rows, headers). Rendered inside `<div class="tc-dashboard-content-inner">` which sits inside `<main class="tc-dashboard-content">`. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-dashboard-content-bg` | `var(--tc-surface)` | Background of the scroll region. |
| `--bs-dashboard-content-color` | `var(--tc-text)` | Text color of the content area. |
| `--bs-dashboard-content-padding` | `1.5rem` | Inner padding applied to the content container. |
| `--bs-dashboard-content-max-width` | `none` | Optional max-width cap for the inner container. |

```html
<!-- Basic usage -->
<tc-dashboard-content>
    <h2>Overview</h2>
    <tc-basic-card title="Revenue" value="$12,400"></tc-basic-card>
</tc-dashboard-content>

<!-- Constrained width -->
<tc-dashboard-content style="--bs-dashboard-content-max-width: 960px">
    <p>Content centred within 960px.</p>
</tc-dashboard-content>
```

---