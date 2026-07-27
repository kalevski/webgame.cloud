---
component: tc-label
---

### tc-label

Semantic form label with optional required indicator and info-icon tooltip.

**Tag:** `tc-label`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `required` | boolean | false | Appends a red asterisk (`*`) after the label text to indicate a required field. The asterisk is `aria-hidden` |
| `tooltip` | string | — | When set, renders an info icon button after the label. The string is used as both `aria-label` and `title` on the button |
| `size` | `small\|default\|large` | `default` | Font-size scale modifier. Maps to `tc-label-sm` / no class / `tc-label-lg` |
| `for` | string | — | Passed through as `for` on the inner `<label>` element to associate the label with a form control by id |

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Label text/content. Rendered inside `.tc-label-content` span |

**Events**

None. `tc-label` is a presentational element.

**Accessibility**

- Renders a real `<label>` element — `for` association works natively with any form control.
- The required asterisk carries `aria-hidden="true"` so screen readers are not confused by `*`.
- The info icon button has `aria-label` set to the `tooltip` string and `title` for hover/focus display.
- Focus on the info button is visible via `:focus-visible` outline.
- `prefers-reduced-motion` is honoured globally by the stylesheet.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-label-font-size` | `0.8125rem` (13px) | Default label font size |
| `--bs-label-font-weight` | `500` | Label font weight |
| `--bs-label-color` | `var(--tc-text)` | Label text color |
| `--bs-label-sm-font-size` | `0.75rem` (12px) | Font size for `size="small"` |
| `--bs-label-lg-font-size` | `0.9375rem` (15px) | Font size for `size="large"` |
| `--bs-label-gap` | `0.3125rem` (5px) | Gap between content, asterisk, and info button |
| `--bs-label-required-color` | `var(--tc-danger)` | Required asterisk color |
| `--bs-label-info-color` | `var(--tc-text-muted)` | Info icon button color |
| `--bs-label-info-hover-bg` | `var(--tc-surface-muted)` | Info icon button hover background |
| `--bs-label-info-icon-size` | `0.875em` | Info icon SVG size |

```html
<!-- Plain label -->
<tc-label for="name">Full name</tc-label>
<tc-input id="name" type="text"></tc-input>

<!-- Required -->
<tc-label for="email" required>Email address</tc-label>
<tc-input id="email" type="email"></tc-input>

<!-- With tooltip -->
<tc-label for="user" tooltip="Shown publicly on your profile">Username</tc-label>
<tc-input id="user" type="text"></tc-input>

<!-- All options + size -->
<tc-label for="pwd" required tooltip="At least 8 characters" size="small">Password</tc-label>
<tc-input id="pwd" type="password"></tc-input>
```

---