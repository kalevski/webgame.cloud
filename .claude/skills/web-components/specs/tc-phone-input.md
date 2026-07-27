---
component: tc-phone-input
---

### tc-phone-input

International phone input with a searchable country-selector dropdown, dial-code prefix, and native form submission support via a hidden input.

**Tag:** `tc-phone-input`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | `''` | Full phone string including dial code (e.g. `+14155552671`); setting it parses the dial code to update the country selector |
| `name` | string | — | Renders a hidden `<input name>` carrying the full value for form submission |
| `default-country` | string | `'US'` | ISO 3166-1 alpha-2 code (e.g. `GB`) that pre-selects the country on first render; ignored if `value` is also set |
| `label` | string | — | Visible label rendered above the control; linked to the number input via `for`/`id` |
| `placeholder` | string | — | Placeholder text for the number field |
| `error` | string | — | Error message shown below the control; adds error border and `aria-invalid` to the number input |
| `max-height` | number \| CSS length | `280px` | Caps how tall the country dropdown grows before it scrolls. A bare number is read as px (`max-height="320"`); any CSS length (`50vh`, `20rem`) is honoured as-is |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string \| null` | Get the current full phone value or set it programmatically (triggers `attributeChangedCallback`) |
| `name` | `string \| null` | Get/set the hidden input name |
| `defaultCountry` | `string \| null` | Get/set the `default-country` attribute |
| `label` | `string \| null` | Get/set the label text |
| `placeholder` | `string \| null` | Get/set the number input placeholder |
| `error` | `string \| null` | Get/set the error message |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired on every change (mirrors `tc-change`) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired whenever the full phone value changes — on number input or country selection |

**Slots:** none

**Built-in countries**

Includes ~50 common countries (US, GB, CA, AU, DE, FR, IN, CN, JP, BR, and more). Each country has a 2-letter ISO code, display name, and dial code.

**Keyboard behaviour**

- Clicking the country trigger opens a searchable dropdown; search input is focused automatically.
- `ArrowDown` / `ArrowUp` highlights options in the list; `Enter` selects the highlighted option.
- `Escape` closes the dropdown and returns focus to the country trigger.
- `Tab` closes the dropdown without refocusing the trigger.
- Typing in the search field filters the country list in real time.
- After country selection, focus returns to the number input automatically.

**Accessibility**

- Country trigger carries `aria-haspopup="listbox"` and `aria-expanded`; its `aria-label` reflects the current country name and dial code.
- Dropdown has `role="listbox"`; each country option has `role="option"` and `aria-selected`.
- Number input is associated with the label via `for`/`id` and uses `type="tel"` + `inputmode="tel"`.
- Error state adds `aria-invalid="true"` to the number input and links the message via `aria-describedby`.
- Focus is always visible; `prefers-reduced-motion` is honoured.

```html
<!-- Default (US pre-selected) -->
<tc-phone-input label="Phone number" default-country="US" placeholder="(555) 000-0000"></tc-phone-input>

<!-- Pre-select a different country -->
<tc-phone-input label="Phone number" default-country="GB" placeholder="07700 900 000"></tc-phone-input>

<!-- Error state -->
<tc-phone-input label="Phone number" default-country="US" value="+1555" error="Please enter a valid phone number."></tc-phone-input>

<!-- With hidden form input for submission -->
<tc-phone-input label="Contact number" name="phone" default-country="US"></tc-phone-input>

<script>
  const el = document.querySelector('tc-phone-input')

  // Listen for changes
  el.addEventListener('tc-change', e => console.log('value:', e.detail.value))

  // Or via callback property:
  el.onChange = value => console.log('value:', value)

  // Set value programmatically (parses dial code to select country)
  el.value = '+441234567890'
</script>
```

---