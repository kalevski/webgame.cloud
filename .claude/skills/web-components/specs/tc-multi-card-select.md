---
component: tc-multi-card-select
---

### tc-multi-card-select

Multi-select card grid (checkgroup pattern). Options are set via the `options` JS property; selected values via the `value` JS property. Fires `tc-change` when the selection changes. Fully keyboard-accessible: Arrow keys move focus between cards, Space/Enter toggles the focused card, disabled cards are skipped. When `name` is set, hidden form inputs are rendered for each selected value so the control submits inside a native form.

**Tag:** `tc-multi-card-select`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | When set, renders `<input type="hidden" name="{name}" value="{optionValue}">` for each selected option, enabling native form submission |
| `columns` | number | `2` | Number of grid columns |
| `loading` | boolean | false | Show animated skeleton placeholders instead of options |
| `loading-count` | number | `4` | Number of skeleton cards shown while `loading` is set |
| `aria-label` | string | `"Select options"` | Accessible label for the group (defaults to "Select options" if not provided) |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `options` | `MultiCardSelectOption[]` | Array of option objects (set via JS, not attribute); setting re-renders the grid |
| `value` | `string[]` | Currently selected option values; setting updates which cards appear selected |
| `onChange` | `((value: string[]) => void) \| null` | Optional callback fired alongside `tc-change` with the new selected array |

Each `MultiCardSelectOption`:

| Field | Type | Description |
|-------|------|-------------|
| `value` | string | Unique value for this option; included in the `tc-change` detail and form submission |
| `label` | string | Visible card title |
| `description` | string? | Optional sub-label rendered below the title |
| `icon` | string? | Lucide icon name, PascalCase or kebab-case (e.g. `"Shield"`, `"shield-check"`) |
| `disabled` | boolean? | When true, the card is non-interactive and aria-disabled |

**Events:** `tc-change` with `{ detail: { value: string[] } }` — the full new selection array

**Slots:** none — the option grid is generated from the `options` property.

```html
<tc-multi-card-select id="features" columns="3" name="features" aria-label="Select features"></tc-multi-card-select>
<script>
const el = document.getElementById('features')
el.options = [
    { value: 'auth',     label: 'Authentication', icon: 'Shield',    description: 'OAuth2 + sessions' },
    { value: 'db',       label: 'Database',        icon: 'Database',  description: 'Postgres or SQLite' },
    { value: 'storage',  label: 'Storage',         icon: 'HardDrive', description: 'File uploads' },
    { value: 'email',    label: 'Email',            icon: 'Mail',      description: 'Transactional mail' },
    { value: 'legacy',   label: 'Legacy API',       icon: 'Plug',      disabled: true },
]
el.value = ['auth', 'db']
el.addEventListener('tc-change', e => console.log('selected:', e.detail.value))
</script>
```