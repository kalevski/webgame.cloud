---
component: tc-confirm-dialog
---

### tc-confirm-dialog

Centred yes/no confirmation modal. Styled to the slate design system (sharp corners, 1px hairline, the single hard overlay shadow). Focus trap, scroll lock, and keyboard handling included. Controlled component — fires `tc-confirm` or `tc-cancel`; the consumer sets `open` to `false` to actually close. Renders the panel hidden when closed.

**Tag:** `tc-confirm-dialog`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state — add/remove to show/hide |
| `dialog-title` | string | `Are you sure?` | Heading text |
| `eyebrow` | string | `Confirm` | Mono uppercase micro-label above the title; omit (empty string) to hide |
| `message` | string | — | Body text under the title; omitted when absent |
| `confirm-label` | string | `Confirm` | Confirm button label |
| `cancel-label` | string | `Cancel` | Cancel button label |
| `danger` | boolean | false | Paints the confirm button as `btn-danger` and tints the eyebrow with the danger colour |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `open` | boolean | Reflects the `open` attribute |
| `dialogTitle` | string | Reflects `dialog-title` |
| `eyebrow` | string | Reflects `eyebrow` |
| `message` | string | Reflects `message` |
| `confirmLabel` | string | Reflects `confirm-label` |
| `cancelLabel` | string | Reflects `cancel-label` |
| `danger` | boolean | Reflects `danger` |
| `onConfirm` | `(() => void) \| null` | Callback fired on confirm (alongside the `tc-confirm` event) |
| `onCancel` | `(() => void) \| null` | Callback fired on cancel (alongside the `tc-cancel` event) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-confirm` | `{}` | Fired by the confirm button or the Enter key. Host does **not** self-close — set `open=false` in the handler. |
| `tc-cancel` | `{}` | Fired by the cancel button, the Escape key, or a backdrop click. Host does **not** self-close — set `open=false` in the handler. |

**Slots:** None — content is supplied entirely through attributes.

```html
<button onclick="document.querySelector('#confirm-delete').setAttribute('open','')">Delete</button>
<tc-confirm-dialog
    id="confirm-delete"
    dialog-title="Delete this project?"
    eyebrow="Destructive"
    message="This permanently removes the project and all of its data."
    confirm-label="Delete project"
    cancel-label="Keep it"
    danger
></tc-confirm-dialog>
<script>
    const dialog = document.querySelector('#confirm-delete')
    dialog.addEventListener('tc-confirm', () => {
        dialog.removeAttribute('open')
        // …perform the deletion…
    })
    dialog.addEventListener('tc-cancel', () => dialog.removeAttribute('open'))
</script>
```

---