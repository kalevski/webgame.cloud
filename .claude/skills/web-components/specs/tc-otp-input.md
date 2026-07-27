---
component: tc-otp-input
---

### tc-otp-input

One-time-password input with per-digit cells, paste support, keyboard navigation, and optional masked mode.

**Tag:** `tc-otp-input`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `length` | number | `6` | Number of digit cells (1–20) |
| `value` | string | `''` | Current entered string (≤ length); distributes characters across cells |
| `name` | string | — | Renders a hidden `<input name>` holding the combined value for form submission |
| `mode` | `'numeric' \| 'alphanumeric'` | `'numeric'` | Restricts allowed characters; sets `inputmode` on each cell |
| `masked` | boolean | `false` | Renders cells as `type="password"` (browser-native bullet masking) |
| `label` | string | — | Visible label rendered above the cells; links via `aria-labelledby` |
| `error` | string | — | Error message displayed below the cells; sets error border color and `aria-invalid` |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `length` | `number` | Get/set the number of cells |
| `value` | `string \| null` | Get/set the combined OTP value programmatically |
| `name` | `string \| null` | Get/set the hidden input name |
| `mode` | `'numeric' \| 'alphanumeric'` | Get/set the character mode |
| `masked` | `boolean` | Get/set masked display |
| `label` | `string \| null` | Get/set the label text |
| `error` | `string \| null` | Get/set the error message |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired on every change (mirrors `tc-change`) |
| `onComplete` | `((value: string) => void) \| null` | Optional callback fired when all cells are filled (mirrors `tc-complete`) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired whenever the combined value changes (typing, paste, backspace) |
| `tc-complete` | `{ value: string }` | Fired when all cells are filled with allowed characters |

**Slots:** none

**Keyboard behaviour**

- Typing a character fills the cell and auto-advances focus to the next cell.
- `Backspace` clears the focused cell; if already empty, moves to and clears the previous cell.
- `ArrowLeft` / `ArrowRight` move focus between cells.
- `Delete` clears the focused cell without moving focus.
- Pasting distributes characters across cells starting at the focused cell (filtered by `mode`), then advances focus.

**Accessibility**

- The cell group carries `role="group"` with `aria-labelledby` (when `label` is set) or `aria-label="One-time password"`.
- Each cell carries `aria-label="Digit N of M"`.
- Error state sets `aria-invalid="true"` on the group and all cells; error message linked via `aria-describedby`.
- Masked cells use `type="password"` — browser-native masking that still exposes value to assistive technology correctly.
- All cells gain `autocomplete="one-time-code"` for mobile autofill.
- Focus is always visible; `prefers-reduced-motion` is honoured.

```html
<!-- Numeric OTP (default) -->
<tc-otp-input label="Verification code" mode="numeric"></tc-otp-input>

<!-- Alphanumeric, 8 cells -->
<tc-otp-input label="Invite code" mode="alphanumeric" length="8"></tc-otp-input>

<!-- Masked PIN -->
<tc-otp-input label="PIN" mode="numeric" length="4" masked></tc-otp-input>

<!-- Pre-filled value -->
<tc-otp-input label="Backup code" value="AB12CD" mode="alphanumeric" length="8"></tc-otp-input>

<!-- Error state -->
<tc-otp-input label="Verification code" value="000000" error="Incorrect code. Try again."></tc-otp-input>

<!-- With hidden form input -->
<tc-otp-input label="OTP" name="otp_code"></tc-otp-input>

<script>
  const el = document.querySelector('tc-otp-input')

  // Listen for changes
  el.addEventListener('tc-change', e => console.log('value:', e.detail.value))

  // Act when all cells are filled
  el.addEventListener('tc-complete', e => console.log('complete:', e.detail.value))

  // Or via callback properties:
  el.onChange = value => console.log('changed:', value)
  el.onComplete = value => submitOTP(value)

  // Set value programmatically
  el.value = '123456'
</script>
```

---