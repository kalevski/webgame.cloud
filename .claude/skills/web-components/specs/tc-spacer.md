---
component: tc-spacer
---

### tc-spacer

Purely structural spacing element. Fills available space in a flex container when `size` is omitted, or provides a fixed dimension along the given axis when `size` is set. The element is `aria-hidden` and carries no visible chrome.

**Tag:** `tc-spacer`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | string \| number | — | Fixed size along the axis. Bare numbers are treated as `px` (e.g. `size="24"` → `24px`). Any CSS length string is accepted (`1rem`, `50%`, …). When omitted the spacer sets `flex: 1 1 auto` and expands to fill available space. |
| `axis` | `horizontal\|vertical` | `vertical` | Axis along which space is applied. `vertical` sets a fixed/flexible height; `horizontal` sets a fixed/flexible width. |

**Events**

None. `tc-spacer` is a purely presentational element.

**Slots**

None.

```html
<!-- Fixed vertical gap (32px) between two blocks -->
<tc-spacer size="32"></tc-spacer>

<!-- Fixed horizontal gap (1rem) between inline items -->
<tc-spacer size="1rem" axis="horizontal"></tc-spacer>

<!-- Flexible spacer — pushes siblings apart in a flex row -->
<div style="display:flex">
    <span>Left</span>
    <tc-spacer axis="horizontal"></tc-spacer>
    <span>Right</span>
</div>
```

---