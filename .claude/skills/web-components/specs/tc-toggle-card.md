---
component: tc-toggle-card
---

### tc-toggle-card

Clickable card with an integrated toggle switch for on/off states. The whole card is the click target — clicking anywhere (or pressing Space/Enter while focused) flips the switch and fires `tc-change`. Reuses the `tc-switch` motif (pill track + pure-circle knob, checked = ink gradient).

**Tag:** `tc-toggle-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `checked` | boolean | false | The on/off state. Reflected — toggling the card sets/removes the attribute. |
| `label` | string | — | Required card title (primary line). Also used as the `aria-label`. |
| `hint` | string | — | Optional secondary descriptive line. Linked to the card via `aria-describedby`. |
| `icon` | string | — | Optional leading [lucide](https://lucide.dev) icon name (e.g. `bell`, `moon`). A `bi-` prefix is stripped for React-prop parity. Rendered as decorative inline SVG. |
| `badge` | string | — | Optional badge text rendered with the badge motif (mono micro-label). |
| `name` | string | — | Forwarded to a hidden `<input>` for native form posts; present in form data only while `checked`. |
| `value` | string | `on` | Value submitted by the hidden input when `checked`. |
| `disabled` | boolean | false | Disables interaction (`opacity` + `pointer-events: none`). |
| `loading` | boolean | false | Shows a spinner in place of the switch, sets `aria-busy`, and blocks interaction. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `checked` | boolean | Get/set the on/off state. Reflected to the `checked` attribute. |
| `disabled` | boolean | Reflected boolean. |
| `loading` | boolean | Reflected boolean. |
| `label` | `string \| null` | Reflected. |
| `hint` | `string \| null` | Reflected. |
| `icon` | `string \| null` | Reflected. |
| `badge` | `string \| null` | Reflected. |
| `name` | `string \| null` | Reflected. |
| `value` | string | Reflected (defaults to `on`). |
| `onChange` | `((checked: boolean) => void) \| null` | Optional callback fired alongside the `tc-change` event on every toggle. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ checked: boolean }` | Fired (bubbles, composed) whenever the user toggles the card (click or Space/Enter). `detail.checked` is the new state. Not fired while `disabled` or `loading`. |

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

- The card exposes `role="switch"` with `aria-checked`, is focusable (`tabindex="0"`), and toggles on Space/Enter.
- The leading icon is decorative (`aria-hidden`); the hint is linked via `aria-describedby`.
- Disabled removes the card from the tab order (`tabindex="-1"`) and sets `aria-disabled`; loading sets `aria-busy`.
- Focus is always visible; `prefers-reduced-motion` is honoured (the knob slide is frozen, colour transitions kept).

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-toggle-card-bg` | `var(--tc-surface)` | Card background |
| `--bs-toggle-card-border-color` | `var(--tc-border)` | Hairline border color |
| `--bs-toggle-card-hover-bg` | `var(--tc-surface-hover)` | Hover well |
| `--bs-toggle-card-on-accent` | `var(--tc-app-accent)` | Checked marker, switch gradient, focus outline |
| `--bs-toggle-card-label-color` | `var(--tc-text)` | Label text color |
| `--bs-toggle-card-hint-color` | `var(--tc-text-muted)` | Hint text color |
| `--bs-toggle-card-switch-track-off` | `var(--tc-border-strong)` | Switch track color when off |

**Examples**

```html
<!-- Basic with icon + hint -->
<tc-toggle-card label="Notifications" hint="Receive email and push notifications" icon="bell"></tc-toggle-card>

<!-- Checked, with a badge -->
<tc-toggle-card label="Beta Features" hint="Try experimental features" icon="rocket" badge="Beta" checked></tc-toggle-card>

<!-- Disabled and loading -->
<tc-toggle-card label="Two-Factor Auth" hint="Managed by your organization" icon="shield" checked disabled></tc-toggle-card>
<tc-toggle-card label="Syncing settings" icon="refresh-cw" loading></tc-toggle-card>

<!-- Inside a form (name submitted only while checked) -->
<form>
    <tc-toggle-card name="notify" value="email" label="Email me" checked></tc-toggle-card>
</form>

<!-- Listening for changes -->
<tc-toggle-card id="tc" label="Dark Mode" icon="moon"></tc-toggle-card>
<script>
  document.getElementById('tc').addEventListener('tc-change', e => console.log(e.detail.checked))
</script>
```

---