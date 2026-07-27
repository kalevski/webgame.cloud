---
component: tc-build
---

### tc-build

Build status card showing name, date, size, duration, a status icon, an optional badge, and an action menu (kebab). The status icon and badge are the only places colour appears — the card body uses the slate neutral ladder throughout.

**Tag:** `tc-build`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | — | Build name / reference (e.g. `"main / production"`). |
| `date` | `string` | — | Display date string (ISO or human-readable). |
| `size` | `number` | — | Artifact size in bytes. Formatted as B / KB / MB / GB in the rendered meta row. |
| `duration` | `number` | — | Build duration in milliseconds. Formatted as ms / s / m s / h m in the meta row. |
| `status` | `'pass' \| 'fail' \| 'running' \| 'queued'` | `'queued'` | Determines the status icon and its colour. |
| `badge` | `string` | — | Optional badge label rendered below the name. |
| `badge-variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'secondary'` | Badge colour variant. |
| `loading` | boolean | `false` | Renders a shimmer skeleton instead of content. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `menuItems` | `ActionItem[]` | Array of action items for the kebab dropdown. Each item: `{ key, label, disabled?, danger?, divider? }`. Setting re-renders the menu. |
| `onClick` | `(() => void) \| null` | Optional callback fired on card click (alongside the `tc-click` event). Setting also toggles the `tc-build--clickable` hover-lift affordance. |
| `onMenuItemClick` | `((key: string) => void) \| null` | Optional callback fired when a menu item is selected (alongside `tc-menu-select`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-click` | — | Dispatched when the card body is clicked or activated via keyboard. Bubbles. Does not fire for clicks inside the menu. |
| `tc-menu-select` | `{ key: string }` | Dispatched when a menu item is selected. Bubbles. |

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

- Status is conveyed by icon + an accessible `aria-label` on the icon wrapper, not colour alone.
- The card div gains `role="button"` and `tabindex="0"` when `onClick` is set; Enter/Space also trigger the click.
- The menu trigger is a real `<button>` with `aria-haspopup="menu"` and `aria-expanded`.
- The open menu uses `role="menu"` / `role="menuitem"` with roving focus (Arrow keys, Home, End, Enter, Space, Escape).
- Focus returns to the trigger on menu close.
- The running spinner carries its status via the icon wrapper's `aria-label` (`"Running"`).
- `prefers-reduced-motion`: the spinner animation and card-lift transition are disabled.
- Touch targets ≥ 44px (coarse pointer).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-build-bg` | `var(--tc-surface)` | Card background. |
| `--bs-build-border-color` | `var(--tc-border)` | Card border colour. |
| `--bs-build-shadow` | `var(--tc-shadow-sm)` | Resting card shadow. |
| `--bs-build-shadow-hover` | `var(--tc-shadow-hover)` | Hover shadow (clickable only). |
| `--bs-build-padding-y` | `0.875rem` | Vertical card padding. |
| `--bs-build-padding-x` | `1rem` | Horizontal card padding. |
| `--bs-build-name-color` | `var(--tc-text)` | Build name text colour. |
| `--bs-build-meta-color` | `var(--tc-text-muted)` | Meta row (date/size/duration) colour. |
| `--bs-build-status-icon-size` | `1.25rem` | Status icon diameter. |
| `--bs-build-status-icon-pass-color` | `var(--tc-success)` | Pass icon colour. |
| `--bs-build-status-icon-fail-color` | `var(--tc-danger)` | Fail icon colour. |
| `--bs-build-status-icon-running-color` | `var(--tc-info)` | Running spinner colour. |
| `--bs-build-status-icon-queued-color` | `var(--tc-text-faint)` | Queued clock colour. |

```html
<!-- Basic status card -->
<tc-build name="main / production" date="2026-06-14" size="4194304" duration="87500" status="pass"></tc-build>

<!-- With badge -->
<tc-build name="main / production" date="2026-06-14" size="4194304" duration="87500" status="pass" badge="latest" badge-variant="success"></tc-build>

<!-- Loading skeleton -->
<tc-build loading></tc-build>

<!-- Menu items via JS property -->
<tc-build id="b1" name="main" status="pass" date="2026-06-14"></tc-build>
<script>
const el = document.getElementById('b1')
el.menuItems = [
    { key: 'retry', label: 'Retry build' },
    { key: 'logs', label: 'View logs' },
    { key: 'delete', label: 'Delete', danger: true },
]
el.addEventListener('tc-menu-select', e => console.log('selected', e.detail.key))
</script>

<!-- Clickable card -->
<tc-build id="b2" name="main" status="pass" date="2026-06-14"></tc-build>
<script>
const el = document.getElementById('b2')
el.onClick = () => console.log('card clicked')
el.addEventListener('tc-click', () => console.log('tc-click event fired'))
</script>
```

---