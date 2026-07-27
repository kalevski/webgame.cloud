---
component: tc-queued-file
---

### tc-queued-file

File-queue item row displaying a leading file icon, the file name with extension, a rectangular format badge, and a human-formatted byte size. Trailing dismiss button dispatches `tc-dismiss` and optionally invokes the `onDismiss` callback property. Sharp corners everywhere (`border-radius: 0`); slate neutrals throughout; format badge rendered in JetBrains Mono uppercase. Non-slotted — all content is attribute-driven.

**Tag:** `tc-queued-file`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Base file name (without extension), e.g. `"report"` |
| `extension` | string | — | File extension including optional dot, e.g. `".pdf"` or `"pdf"`. Appended to `name` in the display label |
| `format` | string | — | Format label shown in the rectangular badge, e.g. `"pdf"`. Rendered uppercase in JetBrains Mono |
| `size` | number (string attr) | `0` | File size in bytes. Formatted as human-readable (e.g. `1.2 MB`). `0` renders `—` |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onDismiss` | `() => void \| null` | `null` | Optional callback invoked alongside the `tc-dismiss` event when the dismiss button is activated |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-dismiss` | — | Fired (bubbles, composed) when the dismiss button is clicked or activated via keyboard. The element is **not** removed from the DOM automatically — the host controls removal. |

**Slots**

None. All content is driven by attributes.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-queued-file-bg` | `var(--tc-surface)` | Row background |
| `--bs-queued-file-border-color` | `var(--tc-border)` | 1px outer hairline |
| `--bs-queued-file-padding-x` | `0.875rem` | Horizontal row padding |
| `--bs-queued-file-padding-y` | `0.625rem` | Vertical row padding |
| `--bs-queued-file-gap` | `0.625rem` | Gap between leading icon, body, and dismiss button |
| `--bs-queued-file-icon-size` | `1.125rem` | File icon size |
| `--bs-queued-file-icon-color` | `var(--tc-text-muted)` | File icon color |
| `--bs-queued-file-name-color` | `var(--tc-text)` | File name text color |
| `--bs-queued-file-name-font-size` | `0.9rem` | File name font size |
| `--bs-queued-file-size-color` | `var(--tc-text-faint)` | Byte size text color |
| `--bs-queued-file-size-font-size` | `0.75rem` | Byte size font size |
| `--bs-queued-file-format-bg` | `var(--tc-surface-muted)` | Format badge fill |
| `--bs-queued-file-format-color` | `var(--tc-text-muted)` | Format badge text color |
| `--bs-queued-file-format-border-color` | `var(--tc-border)` | Format badge hairline |
| `--bs-queued-file-format-font-size` | `0.6875rem` | Format badge font size |
| `--bs-queued-file-dismiss-size` | `2rem` | Dismiss button square size |
| `--bs-queued-file-dismiss-color` | `var(--tc-text-muted)` | Dismiss button icon color |
| `--bs-queued-file-dismiss-hover-bg` | `var(--tc-surface-muted)` | Dismiss button hover fill |
| `--bs-queued-file-dismiss-hover-color` | `var(--tc-text)` | Dismiss button icon color on hover |
| `--bs-queued-file-dismiss-icon-size` | `0.875rem` | Dismiss (×) icon size |

```html
<!-- Basic file entry -->
<tc-queued-file name="Q3-Report" extension=".pdf" format="pdf" size="1258291"></tc-queued-file>

<!-- Listen for tc-dismiss to remove from queue -->
<tc-queued-file id="f1" name="hero-image" extension=".jpg" format="jpg" size="3407872"></tc-queued-file>
<script>
    document.getElementById('f1').addEventListener('tc-dismiss', e => {
        e.target.remove()
    })
</script>

<!-- onDismiss callback property -->
<tc-queued-file id="f2" name="dataset" extension=".csv" format="csv" size="45056"></tc-queued-file>
<script>
    const el = document.getElementById('f2')
    el.onDismiss = () => el.remove()
</script>
```

---