---
component: tc-number-input
---

### tc-number-input

Controlled numeric input with increment/decrement steppers, arrow-key support, min/max clamping, precision formatting, and optional prefix/suffix addons.

**Tag:** `tc-number-input`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string (`number \| ''`) | `''` | Current numeric value; empty string means no value |
| `step` | number | `1` | Increment/decrement amount (also used by ArrowUp/Down) |
| `min` | number | — | Clamp floor; disables the decrement button at this boundary |
| `max` | number | — | Clamp ceiling; disables the increment button at this boundary |
| `precision` | number | — | Decimal places to round/format the committed value |
| `label` | string | — | Visible label rendered above the field; linked via `for`/`id` |
| `error` | string | — | Error message displayed below the field; also sets error border and `aria-invalid` |
| `prefix` | string | — | Text addon rendered before the input (e.g. `$`, `https://`) |
| `suffix` | string | — | Text addon rendered after the input (e.g. `USD`, `kg`) |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number \| ''` | Get/set the current value programmatically |
| `step` | `number` | Get/set the step increment |
| `min` | `number \| null` | Get/set the minimum |
| `max` | `number \| null` | Get/set the maximum |
| `precision` | `number \| null` | Get/set decimal precision |
| `label` | `string \| null` | Get/set the label text |
| `error` | `string \| null` | Get/set the error message |
| `prefix` | `string \| null` | Get/set the prefix addon text |
| `suffix` | `string \| null` | Get/set the suffix addon text |
| `onChange` | `((value: number \| '') => void) \| null` | Optional callback fired on every committed change (same as the `tc-change` event) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: number \| '' }` | Fired on blur, Enter, stepper click, or arrow-key step with the committed value |

**Slots:** none

**Accessibility**

- The `<input>` carries `role="spinbutton"` with `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`.
- Label is associated via `for`/`id`.
- Stepper buttons carry `aria-label="Increase"` / `aria-label="Decrease"`.
- Error links to the input via `aria-describedby` and sets `aria-invalid="true"`.
- Disabled steppers carry `aria-disabled="true"` and `pointer-events: none`.
- `prefers-reduced-motion` is honoured.

```html
<!-- Basic min/max/step -->
<tc-number-input label="Quantity" min="0" max="100" step="1" value="5"></tc-number-input>

<!-- Prefix / Suffix -->
<tc-number-input label="Budget" prefix="$" suffix="USD" min="0" step="10" precision="2" value="100"></tc-number-input>

<!-- Error state -->
<tc-number-input label="Age" min="18" max="120" value="16" error="Must be at least 18"></tc-number-input>

<script>
  const el = document.querySelector('tc-number-input')
  el.addEventListener('tc-change', e => console.log('value:', e.detail.value))
  // or via callback property:
  el.onChange = value => console.log('value:', value)
</script>
```

---