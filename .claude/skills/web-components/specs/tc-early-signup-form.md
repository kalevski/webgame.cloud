---
component: tc-early-signup-form
---

### tc-early-signup-form

Email signup panel with a benefits list, inline validation, and a confirmation success state. Set `benefits` via JS property. Fires `tc-submit` on valid email submission, then switches to the success state.

**Tag:** `tc-early-signup-form`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | `'Get early access'` | Panel heading. |
| `subtitle` | string | — | Optional paragraph below the heading. |
| `eyebrow` | string | — | Monospace micro-label rendered above the title. |
| `helper-text` | string | — | Small text rendered below the submit button. |
| `cta-label` | string | `'Notify me'` | Submit button label. |
| `placeholder` | string | `'you@email.com'` | Email input placeholder. |
| `success-title` | string | `"You're on the list."` | Heading shown in the success state. |
| `success-message` | string | — | Body text in the success state. Defaults to `"We'll email {email} when access opens up."` |
| `variant` | `'light' \| 'dark'` | `'light'` | Light variant on `--tc-surface`; dark variant on `--tc-ink` with white text. |
| `loading` | boolean | `false` | Disables the input and shows a spinner in the submit button. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `benefits` | `string[]` | `[]` | Array of benefit strings rendered as a check-icon list. Set via JS (`el.benefits = [...]`). Re-renders when changed. |
| `onSubmit` | `((email: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-submit` CustomEvent. |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-submit` | `{ email: string }` | Dispatched (bubbles, composed) when a valid email is submitted. The component immediately transitions to the success state. |

**Slots**

None. Driven entirely by attributes and JS properties.

**Accessibility**

- Email `<input>` has an associated `<label>` (visually hidden when the panel has a title).
- Validation error is announced via `aria-live="assertive"` on a persistent error paragraph, and `aria-describedby` points the input at it.
- Submit button is a native `<button type="submit">` — keyboard submittable.
- Disabled/loading state applies the HTML `disabled` attribute (no pointer events, opacity 0.65).
- On success, focus moves to the success title (`tabindex="-1"`) so screen readers announce the confirmation.
- `prefers-reduced-motion` is honoured — all transitions and hover lifts are frozen.
- 44 px minimum touch targets on coarse-pointer devices.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-early-signup-form-bg` | `var(--tc-surface)` | Panel background (light) / `var(--tc-ink)` (dark). |
| `--bs-early-signup-form-border` | `1px solid var(--tc-border)` | Outer hairline border. |
| `--bs-early-signup-form-color` | `var(--tc-text)` | Primary text color. |
| `--bs-early-signup-form-muted-color` | `var(--tc-text-muted)` | Secondary/muted text. |
| `--bs-early-signup-form-eyebrow-color` | `var(--tc-text-faint)` | Eyebrow micro-label color. |
| `--bs-early-signup-form-input-border` | `var(--tc-border-strong)` | Email input border color. |
| `--bs-early-signup-form-input-focus-ring` | `var(--tc-focus-ring)` | Focus ring box-shadow on the input. |
| `--bs-early-signup-form-submit-bg` | `linear-gradient(135deg, var(--tc-app-accent), #2b3a51)` | Submit button background gradient. |
| `--bs-early-signup-form-check-color` | `var(--tc-success)` | Benefit check-icon color. |
| `--bs-early-signup-form-error-color` | `var(--tc-danger)` | Validation error text color. |
| `--bs-early-signup-form-success-color` | `var(--tc-success)` | Success state icon color. |
| `--bs-early-signup-form-padding` | `2rem` | Panel padding. |

```html
<!-- Light variant -->
<tc-early-signup-form
  id="signup"
  variant="light"
  title="Get early access"
  eyebrow="Early access"
  subtitle="Be first to know when we ship."
  cta-label="Join the waitlist"
  placeholder="you@example.com"
  helper-text="One email when we launch. No spam, ever."
></tc-early-signup-form>
<script>
  const el = document.getElementById('signup')
  el.benefits = [
    'Zero-config setup',
    'Framework-free: React, Vue, or plain HTML',
    'Full accessibility baked in',
  ]
  el.addEventListener('tc-submit', e => {
    console.log('signed up:', e.detail.email)
  })
</script>

<!-- Dark variant -->
<tc-early-signup-form
  variant="dark"
  title="Shape the product"
  eyebrow="Beta program"
  cta-label="Request access"
  success-title="Request received."
  success-message="We'll reach out within 48 hours."
></tc-early-signup-form>
```

---