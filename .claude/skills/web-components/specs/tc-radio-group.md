---
component: tc-radio-group
---

### tc-radio-group

Group of radio buttons with optional label, inline layout, disabled options, and roving-tabindex keyboard navigation. Form-associated — add `name` to participate in `<form>` submission and `form.reset()`.

**Tag:** `tc-radio-group`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Group label (renders as `<legend>`) |
| `value` | string | — | Currently selected option value |
| `name` | string | — | Form field name — consumed by `ElementInternals` for submission; inner radios use an internal name for grouping |
| `inline` | boolean | false | Render options in a horizontal row |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `options` | `RadioGroupOption[]` | Array of option objects (set via JS, not attribute) |
| `onChange` | `((value: string) => void) \| null` | Optional callback invoked with the new value on selection |

Each `RadioGroupOption`:

```ts
{ value: string; label: string; disabled?: boolean }
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired when the selected option changes (click or arrow-key navigation) |

**Slots:** none

**Keyboard behaviour:** Arrow Down/Right → next enabled option (wrapping); Arrow Up/Left → previous enabled option (wrapping). Only the selected (or first enabled) radio is in the tab order (`tabindex` roving).

```html
<tc-radio-group id="framework-picker" label="Preferred framework" name="framework"></tc-radio-group>
<script>
  const el = document.getElementById('framework-picker')
  el.options = [
    { value: 'react', label: 'React' },
    { value: 'vue',   label: 'Vue' },
    { value: 'solid', label: 'Solid', disabled: true },
  ]
  el.value = 'react'
  el.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---