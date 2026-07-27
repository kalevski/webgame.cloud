---
component: tc-report-dialog
---

### tc-report-dialog

Player-report moderation modal with a reason radio group, an optional comment textarea, and Cancel / Submit Report actions. Styled to the slate design system (sharp corners, 1px hairline, overlay-tier shadow, danger-red submit). Controlled component — fires `tc-cancel` or `tc-submit`; the consumer sets `open` to `false` to dismiss. Focus trap, scroll lock, and keyboard (`Escape`) handling included. No shadow root; light DOM; `display: block`.

**Tag:** `tc-report-dialog`

---

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `open` | boolean | `false` | Shows the dialog when present; remove to hide. Handled by `_applyOpenState` — CSS transition plays on change. |
| `player-name` | string | `''` | Display name of the player being reported. Rendered as the dialog title. |

---

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | `false` | Mirrors the `open` attribute. |
| `playerName` | `string` | `''` | Mirrors the `player-name` attribute. |
| `reasons` | `string[]` | Default reason list | Array of report-reason strings rendered as the radio group. Resetting this property clears any selected reason. |
| `onCancel` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-cancel`. |
| `onSubmit` | `((reason: string, comment: string) => void) \| null` | `null` | Optional callback fired alongside `tc-submit`. |

---

#### Events

| Event | Detail shape | Fired when |
|---|---|---|
| `tc-cancel` | `{}` | User clicks Cancel, the × close button, the backdrop, or presses Escape. |
| `tc-submit` | `{ reason: string, comment: string }` | User clicks Submit Report with a reason selected. `comment` is an empty string when the textarea is left blank. |

---

#### Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-report-dialog-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-report-dialog-border-color` | `var(--tc-border)` | Panel border colour. |
| `--bs-report-dialog-shadow` | `var(--tc-shadow-lg)` | Panel box-shadow (overlay tier). |
| `--bs-report-dialog-width` | `460px` | Default panel width. |
| `--bs-report-dialog-max-width` | `calc(100vw - 2rem)` | Maximum panel width (viewport responsive). |
| `--bs-report-dialog-max-height` | `calc(100vh - 4rem)` | Maximum panel height. |
| `--bs-report-dialog-padding` | `1.25rem` | Header, body, and actions padding. |
| `--bs-report-dialog-gap` | `0.75rem` | Gap between action buttons and body items. |
| `--bs-report-dialog-eyebrow-color` | `var(--tc-text-muted)` | "Report Player" eyebrow micro-label colour. |
| `--bs-report-dialog-eyebrow-size` | `0.6875rem` | Eyebrow font size. |
| `--bs-report-dialog-title-color` | `var(--tc-text)` | Player name heading colour. |
| `--bs-report-dialog-title-size` | `1rem` | Player name heading font size. |
| `--bs-report-dialog-z-backdrop` | `var(--tc-z-modal-backdrop)` | Backdrop z-index. |
| `--bs-report-dialog-z-panel` | `var(--tc-z-modal)` | Panel z-index. |
| `--bs-report-dialog-backdrop-bg` | `#0f172a` | Backdrop scrim colour. |
| `--bs-report-dialog-backdrop-opacity` | `0.5` | Backdrop opacity when open. |
| `--bs-report-dialog-message-color` | `var(--tc-text-muted)` | Instruction message text colour. |
| `--bs-report-dialog-reason-color` | `var(--tc-text)` | Reason label text colour. |
| `--bs-report-dialog-reason-hover-bg` | `var(--tc-surface-muted)` | Reason row hover background. |
| `--bs-report-dialog-reason-checked-bg` | `var(--tc-surface-hover)` | Reason row background when selected. |
| `--bs-report-dialog-reason-checked-color` | `var(--tc-app-accent)` | Reason label colour when selected. |
| `--bs-report-dialog-radio-size` | `1rem` | Custom radio indicator diameter. |
| `--bs-report-dialog-radio-border` | `1px solid var(--tc-border-strong)` | Radio indicator border. |
| `--bs-report-dialog-radio-checked-bg` | `var(--tc-app-accent)` | Radio fill colour when checked. |
| `--bs-report-dialog-btn-submit-bg` | `var(--tc-danger, #dc2626)` | Submit button background (danger red). |
| `--bs-report-dialog-btn-submit-color` | `#fff` | Submit button text colour. |

---

#### Slots

None. All content is driven by attributes and the `reasons` JS property.

---

#### Example

```html
<tc-report-dialog id="rp-dialog" player-name="ShadowStriker99"></tc-report-dialog>

<button onclick="document.getElementById('rp-dialog').setAttribute('open', '')">
  Report ShadowStriker99
</button>

<script>
  const dialog = document.getElementById('rp-dialog')

  // Optional: override the default reason list
  dialog.reasons = ['Cheating', 'Toxic chat', 'AFK farming', 'Other']

  dialog.addEventListener('tc-cancel', () => {
    dialog.removeAttribute('open')
  })

  dialog.addEventListener('tc-submit', e => {
    console.log('Reason:', e.detail.reason)
    console.log('Comment:', e.detail.comment)
    dialog.removeAttribute('open')
  })
</script>
```

---