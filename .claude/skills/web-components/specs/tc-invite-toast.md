---
component: tc-invite-toast
---

### tc-invite-toast

Transient invite popup pinned to the top-right corner, overlay tier. Styled to the slate design system (white surface, sharp corners, 1px hairline, an ink accent stripe, the single hard overlay shadow). Shows an inviter, a body message, accept / decline actions, and a depleting countdown bar that auto-declines when it lapses. Hidden until `open`; corner placement, width, and z-index all flow through `--bs-invite-toast-*` custom properties. Controlled component — fires `tc-accept` or `tc-decline`; the consumer sets `open` to `false` to dismiss.

**Tag:** `tc-invite-toast`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state — add/remove to show/hide. Opening (re)starts the countdown. |
| `inviter` | string | `Unknown` | Name of the inviter, shown in prose |
| `body` | string | `Wants to invite you to a party.` | Body message under the inviter |
| `timeout-seconds` | number | `15` | Seconds before the toast auto-declines; drives the depleting bar. Non-positive/invalid values fall back to 15. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `open` | boolean | Reflects the `open` attribute |
| `inviter` | string | Reflects `inviter` |
| `body` | string | Reflects `body` |
| `timeoutSeconds` | number | Reflects `timeout-seconds` |
| `onAccept` | `(() => void) \| null` | Callback fired on accept (alongside the `tc-accept` event) |
| `onDecline` | `(() => void) \| null` | Callback fired on decline (alongside the `tc-decline` event) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-accept` | `{}` | Fired by the Accept button. Host does **not** self-close — set `open=false` in the handler. |
| `tc-decline` | `{}` | Fired by the Decline button **or** when the countdown lapses. Host does **not** self-close — set `open=false` in the handler. |

**Slots:** None — content is supplied entirely through attributes.

```html
<button onclick="document.querySelector('#party-invite').setAttribute('open','')">Send invite</button>
<tc-invite-toast
    id="party-invite"
    inviter="Ada Lovelace"
    body="Wants to invite you to the Analytical Engine party."
    timeout-seconds="15"
></tc-invite-toast>
<script>
    const toast = document.querySelector('#party-invite')
    toast.addEventListener('tc-accept', () => {
        toast.removeAttribute('open')
        // …join the party…
    })
    toast.addEventListener('tc-decline', () => toast.removeAttribute('open'))
</script>
```

---