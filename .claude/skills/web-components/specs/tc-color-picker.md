---
component: tc-color-picker
---

### tc-color-picker

Color picker dropdown with a preset swatch grid, a hex text input, and selection management.

**Tag:** `tc-color-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Optional field label rendered above the trigger button. |
| `value` | string | — | Currently selected hex color (e.g. `#0f172a`). Reflected back to the attribute on selection. |
| `columns` | number | `8` | Number of columns in the swatch grid. |
| `loading` | boolean | false | When set, renders an animated skeleton placeholder instead of swatches. |
| `disabled` | boolean | false | Disables the trigger and all interactive elements. Applies `opacity: 0.5; pointer-events: none`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `colors` | `ColorOption[] \| string[]` | Required. Swatch list. Each entry is either a hex string or `{ value: string; label?: string }`. Both shapes are normalised internally. Set via JS — not an attribute. |
| `onChange` | `((color: string) => void) \| null` | Optional callback fired alongside the `tc-change` event on every selection. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired (bubbles, composed) whenever the selected color changes — on swatch click, Enter on a focused swatch, or a committed hex input (Enter / blur with a valid hex). |

**Slots**

None. All content is generated from attributes and JS properties.

**Keyboard navigation**

- `Arrow keys` — move focus between swatches (left/right within a row, up/down by column count).
- `Enter` — select the focused swatch.
- `Escape` — close the panel and return focus to the trigger.
- `Tab` — close the panel without refocusing the trigger.
- In the hex input: `Enter` commits a valid hex and closes the panel; `blur` also commits if the value changed.

**Accessibility**

- Trigger has `aria-haspopup="listbox"` and `aria-expanded`.
- Panel has `role="dialog"`. Swatch grid has `role="listbox"`; each swatch has `role="option"` and `aria-selected`.
- Hex input has a visually-hidden `<label>` for accessible name.
- Focus visible throughout via `:focus-visible` outline.
- `prefers-reduced-motion` disables the skeleton pulse animation.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-color-picker-trigger-bg` | `var(--tc-surface)` | Trigger button background |
| `--bs-color-picker-trigger-border` | `var(--tc-border-strong)` | Trigger border color |
| `--bs-color-picker-trigger-color` | `var(--tc-text)` | Trigger text color |
| `--bs-color-picker-panel-bg` | `var(--tc-surface)` | Panel overlay background |
| `--bs-color-picker-panel-border` | `var(--tc-border)` | Panel border color |
| `--bs-color-picker-panel-shadow` | `var(--tc-shadow-lg)` | Panel drop-shadow |
| `--bs-color-picker-panel-z` | `var(--tc-z-dropdown)` | Panel z-index |
| `--bs-color-picker-panel-width` | `260px` | Panel width |
| `--bs-color-picker-panel-padding` | `0.625rem` | Panel inner padding |
| `--bs-color-picker-swatch-size` | `24px` (44px on coarse pointer) | Swatch cell size |
| `--bs-color-picker-hex-border` | `var(--tc-border-strong)` | Hex input border color |

**Examples**

```html
<!-- Hex string array (set via JS) -->
<tc-color-picker id="cp" label="Background color"></tc-color-picker>
<script>
    const cp = document.getElementById('cp')
    cp.colors = ['#0f172a', '#334155', '#dc2626', '#16a34a', '#0284c7', '#7c3aed']
    cp.value = '#334155'
    cp.addEventListener('tc-change', e => console.log('selected:', e.detail.value))
</script>

<!-- ColorOption[] with labels -->
<tc-color-picker id="cp2" label="Accent color"></tc-color-picker>
<script>
    document.getElementById('cp2').colors = [
        { value: '#dc2626', label: 'Red' },
        { value: '#16a34a', label: 'Green' },
        { value: '#0284c7', label: 'Blue' },
    ]
</script>

<!-- Custom columns -->
<tc-color-picker label="Theme color" columns="4"></tc-color-picker>

<!-- Loading skeleton -->
<tc-color-picker label="Loading…" loading></tc-color-picker>

<!-- Disabled -->
<tc-color-picker label="Locked" value="#64748b" disabled></tc-color-picker>
```

---