---
component: tc-metal-button
---

### tc-metal-button

Primary call-to-action button styled to the toolcase design system. The button renders with slate neutrals, sharp corners (`border-radius: 0`), a 1px hairline border, and the ink primary gradient for the `primary` variant. Slotted children become the button label. Disabled state is enforced natively on the inner `<button>`. No shadow root; light DOM; `display: inline-block`.

> **Alias of `tc-button`.** `tc-metal-button` is a thin subclass of `tc-button` with `skin="metal"` baked in (equivalent to `<tc-button skin="metal">`). It keeps the metal `variant` (default / primary / danger / ghost) and `size` (sm / md / lg) sets and the `tc-metal-button__btn` class scheme.

**Tag:** `tc-metal-button`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'danger' \| 'ghost'` | `'default'` | Visual style. `primary` uses the ink gradient; `danger` uses the danger red; `ghost` is transparent with no border. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size controlling padding and font size. |
| `disabled` | boolean | absent | Disables the button. Sets `disabled` on the inner `<button>`, blocking all interaction. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `MetalButtonVariant` | `'default'` | Reflects the `variant` attribute. |
| `size` | `MetalButtonSize` | `'md'` | Reflects the `size` attribute. |
| `disabled` | `boolean` | `false` | Reflects the `disabled` boolean attribute. |

**Events**

`tc-metal-button` fires no custom events. The native `click` event bubbles from the inner `<button>` element and is suppressed when `disabled`.

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Button label — any inline content (text, icon, badge). |

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-metal-button-color` | `var(--tc-text)` | Text colour (default variant). |
| `--bs-metal-button-bg` | `transparent` | Background (default variant). |
| `--bs-metal-button-border-color` | `var(--tc-border-strong)` | Border colour. |
| `--bs-metal-button-hover-bg` | `var(--tc-surface-muted)` | Background on hover. |
| `--bs-metal-button-hover-color` | `var(--tc-text)` | Text colour on hover. |
| `--bs-metal-button-hover-border-color` | `var(--tc-border-strong)` | Border colour on hover. |
| `--bs-metal-button-active-bg` | `var(--tc-surface-muted)` | Background when pressed. |
| `--bs-metal-button-active-color` | `var(--tc-text)` | Text colour when pressed. |
| `--bs-metal-button-active-border-color` | `var(--tc-border-strong)` | Border colour when pressed. |
| `--bs-metal-button-focus-ring-color` | `rgba(30, 41, 59, 0.25)` | Focus ring colour (`:focus-visible`). |
| `--bs-metal-button-disabled-opacity` | `0.65` | Opacity when disabled. |
| `--bs-metal-button-padding-x` | `1rem` | Horizontal padding. |
| `--bs-metal-button-padding-y` | `0.5rem` | Vertical padding. |
| `--bs-metal-button-font-size` | `0.925rem` | Font size. |
| `--bs-metal-button-font-weight` | `500` | Font weight. |
| `--bs-metal-button-line-height` | `1.6` | Line height. |
| `--bs-metal-button-border-width` | `1px` | Border width. |
| `--bs-metal-button-border-radius` | `0` | Border radius (sharp by default). |

**Example**

```html
<tc-metal-button variant="primary">Start Game</tc-metal-button>
<tc-metal-button variant="danger">Delete Save</tc-metal-button>
<tc-metal-button variant="ghost">Cancel</tc-metal-button>
<tc-metal-button variant="primary" size="lg" disabled>Locked</tc-metal-button>

<!-- Custom theming -->
<tc-metal-button
    variant="primary"
    style="--bs-metal-button-bg: linear-gradient(135deg, #7c3aed, #4f46e5); --bs-metal-button-border-color: #7c3aed;"
>
    Custom Colour
</tc-metal-button>
```

---