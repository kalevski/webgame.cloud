---
component: tc-stamp
---

### tc-stamp

Decorative stamp badge pinned to a corner of a relatively-positioned ancestor element. Uses the status tint palette (soft background + dark emphasis text). Sharp rectangular corners; mono uppercase micro-label type. Non-interactive — no hover/active states or events.

**Tag:** `tc-stamp`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Stamp text. When present, renders as escaped text inside `.tc-stamp-content`. When absent, slotted children are used instead |
| `color` | `primary\|secondary\|success\|danger\|warning\|info` | `primary` | Color variant. Drives the soft bg tint and dark emphasis text from the status palette |
| `position` | `top-left\|top-right\|bottom-left\|bottom-right` | `top-right` | Corner of the nearest relatively-positioned ancestor to pin the stamp to |

**JS Properties**

All three attributes are reflected as JS properties with the same names (`label`, `color`, `position`).

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Stamp content when the `label` attribute is absent. Preserved across re-renders inside `.tc-stamp-content` |

**Events**

None. `tc-stamp` is a purely presentational decorative element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-stamp-padding-x` | `0.4rem` | Horizontal padding |
| `--bs-stamp-padding-y` | `0.25rem` | Vertical padding |
| `--bs-stamp-font-size` | `0.6875rem` | Label font size (11px) |
| `--bs-stamp-font-weight` | `600` | Label font weight |
| `--bs-stamp-letter-spacing` | `0.08em` | Uppercase micro-label letter spacing |
| `--bs-stamp-border-width` | `1px` | Hairline border width |
| `--bs-stamp-corner-offset` | `0.75rem` | Distance from the anchor corner |
| `--bs-stamp-color` | _(set per color variant)_ | Text and border color |
| `--bs-stamp-bg` | _(set per color variant)_ | Background fill color |

```html
<!-- Status colors (position defaults to top-right) -->
<div style="position: relative; padding: 2rem;">
    Card content
    <tc-stamp color="success" label="New"></tc-stamp>
</div>

<div style="position: relative; padding: 2rem;">
    <tc-stamp color="danger" label="Sale"></tc-stamp>
</div>

<div style="position: relative; padding: 2rem;">
    <tc-stamp color="warning" label="Beta"></tc-stamp>
</div>

<!-- Corner positions -->
<div style="position: relative; padding: 2rem;">
    <tc-stamp color="info" position="top-left" label="New"></tc-stamp>
</div>

<div style="position: relative; padding: 2rem;">
    <tc-stamp color="success" position="bottom-right" label="Verified"></tc-stamp>
</div>

<!-- Slotted children (label attribute absent) -->
<div style="position: relative; padding: 2rem;">
    <tc-stamp color="danger" position="top-right"><strong>Sale</strong></tc-stamp>
</div>
```

---