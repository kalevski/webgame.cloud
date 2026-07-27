---
component: tc-modal
---

### tc-modal

Modal dialog.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state |
| `title` | string | — | Modal header title |
| `size` | `sm\|lg\|xl` | — | Dialog size |
| `centered` | boolean | false | Vertically centered |
| `scrollable` | boolean | false | Scrollable body |
| `static-backdrop` | boolean | false | Prevent close on backdrop click |
| `fullscreen` | `true\|sm\|md\|lg\|xl\|xxl` | — | Fullscreen breakpoint |
| `lazy` | boolean | false | Captured body/footer content enters the DOM on first open only, then stays mounted (open → close → open keeps form state). Prevents hidden mounted modals from leaking their content into selectors, queries, and duplicate ids. |

**Methods:** `show()`, `hide()`, `toggle()`

**Events:** `tc-show`, `tc-shown`, `tc-hide`, `tc-hidden`

**Slots:** default (body), `slot="footer"`

A closed `tc-modal` carries `inert` (independent of `lazy`) — its content sits outside the tab order and accessibility tree while hidden. The close button's `aria-label` resolves through the message registry (`close`).

**Footer conventions:** a labeled primary action plus a labeled cancel. Danger confirms must be a labeled `tc-button variant="danger"` — never icon-only (use `tc-icon-button show-label` if starting from an icon button).

```html
<button onclick="document.querySelector('#my-modal').show()">Open</button>
<tc-modal id="my-modal" title="Confirm Action" centered>
    <p>Are you sure you want to proceed?</p>
    <tc-button slot="footer" variant="primary">Confirm</tc-button>
    <tc-button slot="footer" variant="secondary">Cancel</tc-button>
</tc-modal>
```

---