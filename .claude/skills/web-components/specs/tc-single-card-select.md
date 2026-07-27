---
component: tc-single-card-select
---

### tc-single-card-select

Single-selection card grid (radiogroup pattern). Options are set via the `options` JS property; the selected key is the `value` attribute (controlled). Fires `tc-change` when the selection changes. Fully keyboard-accessible: Arrow keys move focus between cards (with wrap), Space/Enter selects the focused card, roving tabindex keeps a single tab stop. When `name` is set, a hidden form input is rendered with the selected key so the control submits inside a native form.

**Tag:** `tc-single-card-select`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | — | The selected option key (controlled); update it on `tc-change` to keep the selection |
| `name` | string | — | When set, renders `<input type="hidden" name="{name}" value="{value}">` for native form submission |
| `columns` | number | auto-fill | Number of grid columns; when omitted, the grid auto-fills with `minmax(200px, 1fr)` (matches React) |
| `loading` | boolean | false | Show animated skeleton placeholders instead of options |
| `loading-count` | number | `4` | Number of skeleton cards shown while `loading` is set |
| `aria-label` | string | `"Select an option"` | Accessible label for the radiogroup |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `options` | `SingleCardSelectOption[]` | Array of option objects (set via JS, not attribute); setting re-renders the grid |
| `value` | `string \| null` | Selected option key; mirrors the `value` attribute |
| `onChange` | `((selected: string) => void) \| null` | Optional callback fired alongside `tc-change` with the newly selected key |

Each `SingleCardSelectOption`:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique key for this option; included in the `tc-change` detail and form submission |
| `title` | string | Visible card title |
| `description` | string? | Optional sub-label rendered below the title |

**Events:** `tc-change` with `{ detail: { value: string } }` — the newly selected key

**Slots:** none — the option grid is generated from the `options` property.

```html
<tc-single-card-select id="framework" columns="2" name="framework" aria-label="Choose a framework"></tc-single-card-select>
<script>
const el = document.getElementById('framework')
el.options = [
    { key: 'react',   title: 'React',   description: 'A library for building user interfaces' },
    { key: 'vue',     title: 'Vue',     description: 'The progressive JavaScript framework' },
    { key: 'angular', title: 'Angular', description: 'Platform for web, mobile & desktop' },
    { key: 'svelte',  title: 'Svelte',  description: 'Cybernetically enhanced web apps' },
]
el.value = 'react'
el.addEventListener('tc-change', e => { el.value = e.detail.value })
</script>
```