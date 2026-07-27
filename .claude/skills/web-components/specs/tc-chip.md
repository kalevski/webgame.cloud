---
component: tc-chip
---

### tc-chip

Compact interactive chip/tag with optional leading icon, trailing count badge, and remove button. Built as a real `<button>` so it participates in keyboard navigation. Dispatches `tc-click` when the chip body is activated and `tc-remove` when the remove button is clicked. Selection state is consumer-controlled (reflected back via the `selected` attribute after handling `tc-click`). Sharp corners (`border-radius: 0`).

**Tag:** `tc-chip`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `primary\|secondary\|info\|success\|warning\|danger` | `secondary` | Color variant. `secondary` stays fully neutral (slate). Colored variants use a soft tint background + dark emphasis text + variant hairline. |
| `selected` | boolean | false | Marks the chip as selected/active (ink fill, white text). Also exposed as `aria-pressed` on the inner button. |
| `icon` | string | — | Lucide icon name (PascalCase or kebab-case, e.g. `"Tag"`, `"arrow-up"`). When set, renders a leading inline SVG icon inside `.tc-chip-icon`. |
| `count` | string \| number | — | Count badge text rendered after the label inside `.tc-chip-count`. |
| `removable` | boolean | false | When set, renders a trailing remove (×) button. The remove affordance also appears when the `onRemove` JS property is assigned. |
| `disabled` | boolean | false | Disables the chip body button and remove button, reduces opacity, and sets `pointer-events: none` on the host. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `selected` | `boolean` | `false` | Reflects the `selected` attribute. |
| `variant` | `ChipVariant` | `'secondary'` | Reflects the `variant` attribute. |
| `count` | `string \| number \| null` | `null` | Reflects the `count` attribute. Setter accepts number or string. |
| `removable` | `boolean` | `false` | Reflects the `removable` attribute. |
| `disabled` | `boolean` | `false` | Reflects the `disabled` attribute. |
| `onRemove` | `(() => void) \| null` | `null` | Optional callback invoked alongside `tc-remove`. Setting this property also shows the remove button (same as the `removable` attribute). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-click` | — | Fired (bubbles, composed) when the chip body button is clicked. The chip does **not** toggle `selected` automatically — reflect it back via `setAttribute('selected', '')` to confirm. |
| `tc-remove` | — | Fired (bubbles, composed) when the remove button is clicked. The element is **not** removed automatically. |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Chip label text or markup. Preserved across re-renders inside `.tc-chip-content`. |

**Accessibility**

- The chip body is a real `<button type="button">` with its label as the accessible name.
- `selected` state is exposed via `aria-pressed="true"/"false"` on the chip button.
- The remove button carries `aria-label="Remove"`.
- All icons are `aria-hidden="true"`.
- `disabled` applies the HTML `disabled` attribute to both buttons and blocks pointer events.
- Focus outlines use `2px solid var(--tc-app-accent)`.
- Reduced-motion: transitions removed.
- 44 px minimum coarse-pointer touch target on chip body and remove button.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-chip-bg` | `var(--tc-surface)` | Default chip background |
| `--bs-chip-bg-hover` | `var(--tc-surface-muted)` | Hover background |
| `--bs-chip-color` | `var(--tc-text)` | Default text and icon color |
| `--bs-chip-border-color` | `var(--tc-border)` | Chip and remove button border |
| `--bs-chip-border-width` | `1px` | Border width |
| `--bs-chip-padding-x` | `0.625rem` | Horizontal padding |
| `--bs-chip-padding-y` | `0.3125rem` | Vertical padding |
| `--bs-chip-font-size` | `0.8125rem` | Label font size (13 px) |
| `--bs-chip-font-weight` | `500` | Label font weight |
| `--bs-chip-gap` | `0.3125rem` | Gap between icon, label, and count |
| `--bs-chip-icon-size` | `0.875rem` | Leading icon SVG size |
| `--bs-chip-count-bg` | `var(--tc-surface-muted)` | Count badge background |
| `--bs-chip-count-color` | `var(--tc-text-muted)` | Count badge text color |
| `--bs-chip-count-font-size` | `0.6875rem` | Count badge font size |
| `--bs-chip-selected-bg` | `var(--tc-app-accent)` | Selected/active chip fill |
| `--bs-chip-selected-color` | `var(--tc-app-accent-contrast)` | Selected/active chip text |
| `--bs-chip-remove-icon-size` | `0.875rem` | Remove button icon SVG size |

```html
<!-- Static variants -->
<tc-chip>Secondary (default)</tc-chip>
<tc-chip variant="primary">Primary</tc-chip>
<tc-chip variant="success">Success</tc-chip>
<tc-chip variant="danger">Danger</tc-chip>
<tc-chip variant="warning">Warning</tc-chip>
<tc-chip variant="info">Info</tc-chip>

<!-- Selected state -->
<tc-chip selected>Active chip</tc-chip>

<!-- With leading icon -->
<tc-chip icon="Tag">Label</tc-chip>
<tc-chip icon="Shield" variant="success">Verified</tc-chip>

<!-- With count badge -->
<tc-chip count="12">Messages</tc-chip>
<tc-chip icon="Bell" count="3" variant="info">Notifications</tc-chip>

<!-- Removable — handle tc-remove to hide/delete -->
<tc-chip removable id="my-chip">Deploy</tc-chip>
<script>
    document.getElementById('my-chip').addEventListener('tc-remove', e => {
        e.target.hidden = true
    })
</script>

<!-- Consumer-controlled selection via tc-click -->
<tc-chip id="toggle-chip">Toggle me</tc-chip>
<script>
    const chip = document.getElementById('toggle-chip')
    chip.addEventListener('tc-click', () => {
        chip.selected = !chip.selected
    })
</script>

<!-- onRemove callback property -->
<tc-chip removable id="chip2">Beta</tc-chip>
<script>
    const el = document.getElementById('chip2')
    el.onRemove = () => el.remove()
</script>

<!-- Disabled -->
<tc-chip disabled>Disabled</tc-chip>
<tc-chip disabled removable>Disabled removable</tc-chip>
```

---