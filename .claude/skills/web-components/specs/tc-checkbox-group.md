---
component: tc-checkbox-group
---

### tc-checkbox-group

Coordinated group of checkboxes with an optional group label, inline layout, disabled per-option support, and required validation. Options are set via the `options` JS property. Fires `tc-change` when the selection changes. Works controlled (consumer sets `value`) or uncontrolled (internal state). Form-associated — add `name` to participate in `<form>` submission and `form.reset()`. Multiple selections are submitted as multiple entries under the same key; use `new FormData(form).getAll('fieldname')` to read them.

**Tag:** `tc-checkbox-group`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Group legend text |
| `inline` | boolean | false | Lay checkboxes out horizontally |
| `name` | string | — | Form field name — consumed by `ElementInternals` for submission; inner checkboxes use an internal name for grouping |
| `id` | string | — | Standard HTML `id` on the host element |
| `required` | boolean | false | Group is invalid until at least one option is checked; sets `aria-required` and `aria-invalid` on the fieldset |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `options` | `CheckboxGroupOption[]` | Array of option objects (set via JS, not attribute) |
| `value` | `string[]` | Currently checked values; setting updates the checkboxes and re-renders |
| `onChange` | `((checkedValues: string[]) => void) \| null` | Optional callback fired alongside `tc-change` |

Each `CheckboxGroupOption`:

| Field | Type | Description |
|-------|------|-------------|
| `value` | string | Option value, submitted with the form |
| `label` | string | Visible label text |
| `disabled` | boolean? | When true, the option is non-interactive |

**Events:** `tc-change` with `{ detail: { value: string[] } }` — the new set of checked values

**Slots:** none — the option list is generated from the `options` property.

```html
<tc-checkbox-group id="lang-picker" label="Preferred languages" name="languages"></tc-checkbox-group>
<script>
const el = document.getElementById('lang-picker')
el.options = [
    { value: 'js',  label: 'JavaScript' },
    { value: 'ts',  label: 'TypeScript' },
    { value: 'go',  label: 'Go', disabled: true },
]
el.value = ['js'] // pre-select
el.addEventListener('tc-change', e => console.log('selected:', e.detail.value))
</script>
```

---