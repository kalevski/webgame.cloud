---
component: tc-drawer
---

### tc-drawer

Slide-out panel with focus trap, keyboard handling, and optional pinned mode. Controlled component — fires `tc-close` when the user requests dismissal; the consumer sets `open` to `false` to actually close.

**Tag:** `tc-drawer`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state — add/remove to show/hide |
| `side` | `left\|right\|top\|bottom` | `right` | Edge the panel slides from |
| `size` | `small\|default\|large` | `default` | Panel width (left/right) or height (top/bottom) |
| `title` | string | — | Header title text |
| `pinned` | boolean | false | No backdrop, no body scroll lock; page stays interactive |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `onClose` | `(() => void) \| null` | Callback fired when close is requested (alongside `tc-close` event) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-close` | `{}` | Fired when the user closes via close button, Escape, or backdrop click. The host does **not** self-close — set `open=false` in this handler. |

**Slots:** default (panel body content)

```html
<button onclick="document.querySelector('#my-drawer').setAttribute('open','')">Open</button>
<tc-drawer id="my-drawer" title="Settings" side="right">
    <p>Drawer body content here.</p>
</tc-drawer>
<script>
    document.querySelector('#my-drawer').addEventListener('tc-close', () => {
        document.querySelector('#my-drawer').removeAttribute('open')
    })
</script>
```

---