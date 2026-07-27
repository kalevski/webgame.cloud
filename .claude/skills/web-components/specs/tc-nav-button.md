---
component: tc-nav-button
---

### tc-nav-button

Back / close navigation button, styled to the toolcase design system. Renders as a compact square icon button (chevron-left for `back`, × for `close`) with slate neutrals, sharp corners (`border-radius: 0`). The `size` attribute overrides the button dimensions in px. No shadow root; light DOM; `display: inline-block`.

**Tag:** `tc-nav-button`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `kind` | `'back' \| 'close'` | `'back'` | Icon rendered. `back` shows a chevron-left; `close` shows an ×. |
| `label` | `string` | — | Overrides the default `aria-label` ("Back" for `back`, "Close" for `close`). |
| `size` | `number` | — | Square button dimension in px. Overrides `--bs-nav-button-size`. Omit to use the CSS default (2 rem). |
| `disabled` | boolean | absent | Disables the button — sets `disabled` on the inner `<button>` and applies reduced opacity. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `kind` | `NavButtonKind` | `'back'` | Reflects the `kind` attribute. |
| `label` | `string` | `''` | Reflects the `label` attribute. |
| `size` | `number \| null` | `null` | Reflects the `size` attribute (parsed float, or `null` when absent). |
| `disabled` | `boolean` | `false` | Reflects the `disabled` boolean attribute. |

**Events**

`tc-nav-button` fires no custom events. The native `click` event bubbles from the inner `<button>` element and is suppressed when `disabled`.

**Slots**

None — the icon is determined by the `kind` attribute.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-nav-button-size` | `2rem` | Square button dimension. Overridden inline by the `size` attribute. |
| `--bs-nav-button-color` | `var(--tc-text-muted)` | Icon colour at rest. |
| `--bs-nav-button-bg` | `transparent` | Background at rest. |
| `--bs-nav-button-border-color` | `transparent` | Border colour at rest. |
| `--bs-nav-button-hover-color` | `var(--tc-text)` | Icon colour on hover. |
| `--bs-nav-button-hover-bg` | `var(--tc-surface-muted)` | Background on hover. |
| `--bs-nav-button-hover-border-color` | `transparent` | Border colour on hover. |
| `--bs-nav-button-active-color` | `var(--tc-text)` | Icon colour when pressed. |
| `--bs-nav-button-active-bg` | `var(--tc-surface-muted)` | Background when pressed. |
| `--bs-nav-button-active-border-color` | `transparent` | Border colour when pressed. |
| `--bs-nav-button-focus-ring-color` | `rgba(30, 41, 59, 0.25)` | Focus ring colour (`:focus-visible`). |
| `--bs-nav-button-disabled-opacity` | `0.65` | Opacity when disabled. |
| `--bs-nav-button-border-radius` | `0` | Border radius (sharp by default). |
| `--bs-nav-button-icon-size` | `1rem` | Width and height of the SVG glyph. |

**Example**

```html
<!-- default back button -->
<tc-nav-button></tc-nav-button>

<!-- close button with custom aria-label -->
<tc-nav-button kind="close" label="Dismiss"></tc-nav-button>

<!-- custom 48 px size -->
<tc-nav-button kind="back" size="48"></tc-nav-button>

<!-- disabled -->
<tc-nav-button kind="back" disabled></tc-nav-button>
```

---