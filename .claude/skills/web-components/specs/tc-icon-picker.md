---
component: tc-icon-picker
---

### tc-icon-picker

Searchable icon-grid dropdown for selecting a lucide icon by name.

**Tag:** `tc-icon-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Optional field label rendered above the trigger button. |
| `value` | string | — | Currently selected lucide icon name (kebab-case, e.g. `star`). Reflected back to the attribute on selection. |
| `columns` | number | `6` | Number of columns in the icon grid. |
| `loading` | boolean | false | When set, renders an animated skeleton placeholder grid and disables interaction. |
| `max-height` | number \| CSS length | `240px` | Caps how tall the icon grid grows before it scrolls. A bare number is read as px (`max-height="320"`); any CSS length (`50vh`, `20rem`) is honoured as-is. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `icons` | `IconOption[]` | Required. Array of `{ value: string; label?: string }` where `value` is a kebab-case lucide icon name. Set via JS — not an attribute. |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired alongside the `tc-change` event on every selection. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired (bubbles, composed) whenever the selected icon changes — on cell click or Enter on a highlighted cell. |

**Slots**

None. All content is generated from attributes and JS properties.

**Keyboard navigation**

- `ArrowRight` / `ArrowLeft` — move roving highlight one cell left or right.
- `ArrowDown` / `ArrowUp` — move roving highlight one row down or up (respects `columns`).
- `Enter` / `Space` — select the currently highlighted icon.
- `Escape` — close the popup and return focus to the trigger.
- `Tab` — close the popup without refocusing the trigger.
- Typing in the search field filters the grid; highlight resets to none.

**Accessibility**

- Trigger has `aria-haspopup="listbox"` and `aria-expanded`.
- Popup has `role="listbox"`. Each option has `role="option"` and `aria-selected`.
- Loading popup has `role="status"` and `aria-busy="true"` with a visually-hidden "Loading…" label.
- Search input is a native `<input type="search">`.
- Focus visible throughout via `:focus-visible`.
- `prefers-reduced-motion` disables the skeleton pulse animation.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-icon-picker-trigger-bg` | `var(--tc-surface)` | Trigger button background |
| `--bs-icon-picker-trigger-border` | `var(--tc-border-strong)` | Trigger border color |
| `--bs-icon-picker-trigger-color` | `var(--tc-text)` | Trigger text color |
| `--bs-icon-picker-popup-bg` | `var(--tc-surface)` | Popup overlay background |
| `--bs-icon-picker-popup-border` | `var(--tc-border)` | Popup border color |
| `--bs-icon-picker-popup-shadow` | `var(--tc-shadow-lg)` | Popup drop-shadow |
| `--bs-icon-picker-popup-z` | `var(--tc-z-dropdown)` | Popup z-index |
| `--bs-icon-picker-popup-min-width` | `200px` | Popup minimum width |
| `--bs-icon-picker-popup-padding` | `0.5rem` | Popup inner padding |
| `--bs-icon-picker-option-size` | `2rem` (44px on coarse pointer) | Option cell size |
| `--bs-icon-picker-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton cell background |

**Examples**

```html
<!-- Basic usage (set icons via JS) -->
<tc-icon-picker id="ip" label="Choose an icon" value="star"></tc-icon-picker>
<script>
    const ip = document.getElementById('ip')
    ip.icons = [
        { value: 'star', label: 'Star' },
        { value: 'heart', label: 'Heart' },
        { value: 'home', label: 'Home' },
        { value: 'search', label: 'Search' },
        { value: 'settings', label: 'Settings' },
    ]
    ip.addEventListener('tc-change', e => console.log('selected:', e.detail.value))
</script>

<!-- Custom columns -->
<tc-icon-picker label="Icon" columns="4"></tc-icon-picker>

<!-- Loading skeleton -->
<tc-icon-picker label="Loading…" loading></tc-icon-picker>
```

---