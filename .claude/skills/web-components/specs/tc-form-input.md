---
component: tc-form-input
---

### tc-form-input

Universal form-input dispatcher. The `type` attribute selects which native control to render, with built-in validation, a helper line, a danger-toned error line, and full ARIA wiring. Composes the shared form classes (`.form-control`, `.form-select`, `.form-check`, `.form-range`) so it stays self-contained. On every input/change it reads the control value, coerces it to the right JS type (boolean for checkbox/switch/single-radio, number for number/range, string otherwise), runs each `validate` function, computes the error message (preferring the `error` attribute, then a validator message, then `onErrorMessage`), then fires `tc-change` and calls `onChange(value, hasError)`. Visible error chrome (`is-invalid` + `aria-invalid` + the error line) is gated by `validate-on` (default `blur` — no errors until the user leaves the field); validity is always reflected into the ElementInternals immediately, so `form.checkValidity()` and submit gating stay accurate from the first render.

**Tag:** `tc-form-input`

**`type` values (18):** `text`, `email`, `password`, `number`, `tel`, `url`, `search`, `textarea`, `dropdown` (alias `select`), `checkbox`, `radio`, `switch`, `date`, `time`, `datetime`, `color`, `range`, `file`. `datetime` renders a native `datetime-local` input; `radio` renders a single boolean radio unless `options` are supplied, in which case it renders a radiogroup.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | `text` | Which control to render (see list above) |
| `label` | string | — | Field label; gets a required asterisk when `required` |
| `help` / `helper` | string | — | Helper/hint text shown under the control |
| `error` | string | — | Externally-forced error message (overrides validators) |
| `name` | string | — | `name` applied to the inner control(s) |
| `id` | string | — | Standard HTML `id` on the host element |
| `placeholder` | string | — | Placeholder text (text controls; first option for dropdown) |
| `disabled` | boolean | false | Disables the control and dims the field |
| `required` | boolean | false | Participates in validation; sets `aria-required` |
| `loading` | boolean | false | Renders a spinner placeholder and disables interaction |
| `min` / `max` / `step` | string | — | Forwarded to number/range/date controls |
| `rows` | string | — | Forwarded to the `textarea` control |
| `validate-on` | `blur\|input\|submit\|mount` | `blur` | When validation feedback becomes **visible**: `blur` after the field is touched (focusout), `input` after any edit (or touch), `submit` only after a form submit / `reportValidity()`, `mount` always (the old eager behaviour). Validity is always reflected into the ElementInternals immediately, so form gating works regardless. |
| `required-message` | string | — | Per-instance override of the message registry's `fieldRequired` copy for the required-empty error. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `unknown` | Current value (string/number/boolean by type). Setting re-seeds the control |
| `defaultValue` | `unknown` | Seeds the control on first render when `value` is unset |
| `validate` | `FormInputValidator \| FormInputValidator[]` | Each `(value) => true \| string \| { valid: boolean; message?: string }` — `true` is valid, a string is an error message |
| `onErrorMessage` | `(result) => string` | Derives the display message from a validation result |
| `onChange` | `((value: unknown, hasError: boolean) => void) \| null` | Optional callback fired alongside `tc-change` |
| `options` | `{ value: string; label: string; disabled?: boolean }[]` | Options for `dropdown`/`radio` (also accepts slotted `<option>` children) |

**Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `reportValidity()` | `boolean` | Marks the field submitted, shows any error, and (when invalid) triggers the browser's native report UI. Returns `true` when valid. Mirrors `HTMLInputElement.reportValidity`. |
| `checkValidity()` | `boolean` | ElementInternals validity check — no visual side effects. |
| `resetValidity()` | `void` | Returns the field to its pristine state (hides visible errors) without touching the value. |

**Validation lifecycle:** pristine → touched (focusout) → dirty (input) → submitted (form submit, `reportValidity()`, or the element's native `invalid` event). Errors render only after the `validate-on` gate passes; a consumer-set `error` attribute always shows immediately. A native form reset (`formResetCallback`) restores the first-connect value and returns the field to pristine.

**Events:** `tc-change` with `{ detail: { value: unknown } }` — fired on input/change after validation (`hasError` stays available through the `onChange` callback).

**Slots:** `<option>` children are accepted for `dropdown`/`radio` types when the `options` property is not set.

```html
<tc-form-input type="email" label="Email" help="We'll never share it." required></tc-form-input>
<script>
const el = document.querySelector('tc-form-input')
el.validate = (v) => /.+@.+\..+/.test(String(v)) ? true : 'Enter a valid email'
el.addEventListener('tc-change', (e) => console.log(e.detail.value))
el.onChange = (value, hasError) => console.log(value, hasError)

// Dropdown via the options property
const country = document.createElement('tc-form-input')
country.type = 'dropdown'
country.label = 'Country'
country.options = [{ value: 'us', label: 'United States' }, { value: 'jp', label: 'Japan' }]
document.body.append(country)
</script>
```

---