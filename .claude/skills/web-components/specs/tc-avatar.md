---
component: tc-avatar
---

### tc-avatar

Circular user avatar. Displays an image, 1–2 initials derived from a name, or a placeholder user glyph when neither is provided. Optionally shows a colour-coded status dot at the bottom-right corner.

**Tag:** `tc-avatar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | — | Image URL. When present, renders an `<img>`. Falls back to initials or placeholder on load error. |
| `alt` | string | — | Image alt / accessible label override. Defaults to the `name` attribute when absent. |
| `name` | string | — | Display name. Used to derive 1–2 initials when `src` is absent. Also used as the host's `aria-label`. |
| `size` | `small\|default\|large` | `default` | Avatar diameter: 28 px / 40 px / 56 px. |
| `status` | `online\|offline\|busy\|away` | — | When set, renders a coloured dot at the bottom-right corner with an `aria-label` for the status value. |
| `variant` | `primary\|secondary\|success\|danger\|warning\|info` | `secondary` | Background tint for initials / placeholder. Soft tint + dark emphasis text. |

**JS Properties**

Each attribute is reflected as a same-named JS property (getter/setter).

**Events**

None.

**Slots**

None.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-avatar-size` | `40px` | Diameter of the circle. Overridden per size. |
| `--bs-avatar-font-size` | `0.875rem` | Initials font size. |
| `--bs-avatar-bg` | `var(--tc-surface-muted)` | Background colour (overridden by variant). |
| `--bs-avatar-color` | `var(--tc-text-muted)` | Initials / glyph colour (overridden by variant). |
| `--bs-avatar-status-size` | `9px` | Status dot diameter. |
| `--bs-avatar-status-ring` | `2px` | Width of the tc-surface ring around the status dot. |
| `--bs-avatar-status-offset` | `2px` | Distance from bottom/right edge to the status dot. |

```html
<!-- Image avatar -->
<tc-avatar src="https://example.com/photo.jpg" name="Alice Johnson"></tc-avatar>

<!-- Initials only -->
<tc-avatar name="Bob Smith" variant="primary"></tc-avatar>

<!-- Placeholder glyph -->
<tc-avatar variant="secondary"></tc-avatar>

<!-- With status -->
<tc-avatar name="Carol Davis" status="online" size="large"></tc-avatar>

<!-- Sizes -->
<tc-avatar name="S" size="small" variant="success"></tc-avatar>
<tc-avatar name="D" variant="info"></tc-avatar>
<tc-avatar name="L" size="large" variant="danger"></tc-avatar>
```

---