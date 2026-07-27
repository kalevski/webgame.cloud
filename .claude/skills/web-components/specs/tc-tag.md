---
component: tc-tag
---

### tc-tag

Badge-like rectangular tag with color variants and an optional remove button. Sharp corners (`border-radius: 0`). Default `secondary` uses the slate tint palette; colored variants use the soft tint background, dark emphasis text, and a hairline in the variant color. The remove button dispatches `tc-remove` and does **not** remove the element from the DOM — the host controls removal (controlled pattern).

> **Alias of `tc-chip`.** `tc-tag` is registered as a thin subclass of `tc-chip` that always renders the non-interactive (static `<span>`) form — no `tc-click`, no `aria-pressed`. It supports the same `variant` / `removable` attributes and `tc-remove` event; theme it via the `--bs-chip-*` custom properties.

**Tag:** `tc-tag`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `primary\|secondary\|info\|success\|warning\|danger` | `secondary` | Color variant |
| `removable` | boolean | false | When set, renders a trailing remove (×) button |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onremove` | `() => void \| null` | `null` | Optional callback invoked in addition to the `tc-remove` event when the remove button is activated |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-remove` | — | Fired (bubbles, composed) when the remove button is clicked or activated via keyboard. The element is **not** removed automatically. |

**Slots**

| Slot | Description |
|------|-------------|
| _(default)_ | Tag label text or markup. Preserved across re-renders inside `.tc-tag-content`. |

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-tag-padding-x` | `0.5rem` | Horizontal padding |
| `--bs-tag-padding-y` | `0.25rem` | Vertical padding |
| `--bs-tag-font-size` | `0.8125rem` | Tag label font size (13px) |
| `--bs-tag-font-weight` | `500` | Label font weight |
| `--bs-tag-border-width` | `1px` | Hairline border width |
| `--bs-tag-bg` | `var(--tc-surface-muted)` | Background fill (overridden per variant) |
| `--bs-tag-color` | `var(--tc-text)` | Text and icon color (overridden per variant) |
| `--bs-tag-border-color` | `var(--tc-border)` | Border color (overridden per variant) |
| `--bs-tag-remove-icon-size` | `0.75rem` | Size of the × icon inside the remove button |

```html
<!-- Static variants -->
<tc-tag>Default (secondary)</tc-tag>
<tc-tag variant="primary">Primary</tc-tag>
<tc-tag variant="success">Success</tc-tag>
<tc-tag variant="danger">Danger</tc-tag>
<tc-tag variant="warning">Warning</tc-tag>
<tc-tag variant="info">Info</tc-tag>

<!-- Removable — listen for tc-remove to hide/delete the element -->
<tc-tag variant="success" removable id="my-tag">Deployed</tc-tag>

<script>
    document.getElementById('my-tag').addEventListener('tc-remove', e => {
        e.target.hidden = true
    })
</script>

<!-- onremove callback property -->
<tc-tag variant="info" removable id="tag2">Beta</tc-tag>
<script>
    const el = document.getElementById('tag2')
    el.onremove = () => el.remove()
</script>