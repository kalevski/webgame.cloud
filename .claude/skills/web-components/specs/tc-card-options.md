---
component: tc-card-options
---

### tc-card-options

Grid of selectable card options (radiogroup). Options are set via the `options` JS property. Fires `tc-change` when the selection changes. Fully keyboard-accessible: Arrow keys move selection, Enter/Space confirms.

**Tag:** `tc-card-options`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | — | Key of the selected option |
| `columns` | number | `3` | Number of grid columns |
| `aria-label` | string | `"Options"` | Accessible label for the radiogroup |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `options` | `CardOption[]` | Array of option objects (set via JS, not attribute) |
| `onChange` | `((key: string) => void) \| null` | Optional callback fired alongside `tc-change` |

Each `CardOption`:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier; becomes the selected value |
| `label` | string | Visible card title |
| `description` | string? | Optional sub-label below the title |
| `icon` | string? | Lucide icon name, PascalCase or kebab-case (e.g. `"Shield"`, `"shield-check"`) |
| `image` | string? | Image `src` URL; used when `icon` is absent |

**Events:** `tc-change` with `{ detail: { key: string } }`

**Slots:** none — the option grid is generated from the `options` property.

```html
<tc-card-options id="plan-picker" value="starter" columns="3" aria-label="Choose a plan"></tc-card-options>
<script>
const el = document.getElementById('plan-picker')
el.options = [
    { key: 'starter', label: 'Starter', icon: 'Zap', description: 'Up to 3 projects' },
    { key: 'pro',     label: 'Pro',     icon: 'Star', description: 'Unlimited projects' },
    { key: 'enterprise', label: 'Enterprise', icon: 'Shield', description: 'Custom limits' },
]
el.addEventListener('tc-change', e => console.log('selected:', e.detail.key))
</script>
```

---