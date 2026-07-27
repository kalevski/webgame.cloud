---
component: tc-newsletter-signup
---

### tc-newsletter-signup

Email subscription form with async status management. Drives its own state (`idle → submitting → success` or `error`) from the optional `onSubmit` Promise. Fires `tc-submit` on valid submission. Optionally renders a privacy-policy link below the input.

**Tag:** `tc-newsletter-signup`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Optional heading rendered above the form. |
| `description` | string | — | Optional sub-text rendered below the heading (uses `--tc-text-muted`). |
| `placeholder` | string | `'you@example.com'` | Email input placeholder text. |
| `cta-label` | string | `'Subscribe'` | Submit button label. |
| `success-message` | string | `'Thanks for subscribing!'` | Message shown in the success state after the `onSubmit` Promise resolves. |
| `privacy-href` | string | — | When set, renders a small privacy-policy link below the input field. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onSubmit` | `((email: string) => Promise<void> \| void) \| null` | `null` | Optional callback fired alongside `tc-submit`. If it returns a `Promise`, the component transitions to `success` on resolve or `error` on reject (with the rejection message shown inline). If it returns `void` or is not set, the component transitions to `success` immediately. |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-submit` | `{ email: string }` | Dispatched (bubbles, composed) when a valid email is submitted. Fired before the `onSubmit` Promise is awaited. |

**Slots**

None. Driven entirely by attributes and the `onSubmit` JS property.

**Accessibility**

- Email `<input>` is associated with a visually-hidden `<label>` via `for`/`id`.
- Validation errors set `aria-invalid="true"` and `aria-describedby` on the input; the error paragraph uses `aria-live="assertive"`.
- The submit button is a native `<button type="submit">` — keyboard submittable.
- The spinner inside the button carries `role="status"` and `aria-label="Submitting…"`.
- The success region uses `aria-live="polite"` + `aria-atomic="true"`; focus moves into it on transition.
- Disabled-while-submitting is applied via the `disabled` HTML attribute + `pointer-events: none`.
- `prefers-reduced-motion` is honoured — spinner slows (does not vanish), transitions are frozen.
- 44 px minimum touch targets on coarse-pointer devices.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-newsletter-signup-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-newsletter-signup-border` | `1px solid var(--tc-border)` | Outer hairline border. |
| `--bs-newsletter-signup-color` | `var(--tc-text)` | Primary text color. |
| `--bs-newsletter-signup-muted-color` | `var(--tc-text-muted)` | Description / secondary text color. |
| `--bs-newsletter-signup-input-border` | `var(--tc-border-strong)` | Email input border color. |
| `--bs-newsletter-signup-input-focus-ring` | `var(--tc-focus-ring)` | Focus ring box-shadow on the input. |
| `--bs-newsletter-signup-submit-bg` | `linear-gradient(135deg, var(--tc-app-accent), #2b3a51)` | Submit button background gradient. |
| `--bs-newsletter-signup-error-color` | `var(--tc-danger)` | Validation / error text color. |
| `--bs-newsletter-signup-success-color` | `var(--tc-success)` | Success state icon and text color. |
| `--bs-newsletter-signup-success-bg` | `rgba(22, 163, 74, 0.07)` | Success state background tint. |
| `--bs-newsletter-signup-success-border` | `var(--tc-success)` | Success state left accent border color. |
| `--bs-newsletter-signup-padding` | `1.5rem` | Panel padding. |

```html
<tc-newsletter-signup
  id="newsletter"
  title="Stay in the loop"
  description="Get product updates and release notes — no spam."
  placeholder="you@example.com"
  cta-label="Subscribe"
  success-message="You're subscribed!"
  privacy-href="/privacy"
></tc-newsletter-signup>
<script>
  const el = document.getElementById('newsletter')
  // onSubmit may return a Promise; the component drives idle → submitting → success/error
  el.onSubmit = email => fetch('/api/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
    headers: { 'Content-Type': 'application/json' },
  }).then(r => { if (!r.ok) throw new Error('Subscription failed. Try again.') })
  el.addEventListener('tc-submit', e => console.log('submitted:', e.detail.email))
</script>
```

---