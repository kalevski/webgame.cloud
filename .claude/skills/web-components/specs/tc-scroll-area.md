---
component: tc-scroll-area
---

### tc-scroll-area

Scrollable container with configurable max dimensions and scroll axis. The slotted children are placed into an inner content element; overflow is applied to the wrapper based on `axis`. Sharp corners and a thin slate scrollbar (Firefox `scrollbar-*` + WebKit `::-webkit-scrollbar`); no outer border by default — wrap it yourself, or switch on the optional 1px hairline via `--bs-scroll-area-border`.

**Tag:** `tc-scroll-area`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `axis` | `x\|y\|both` | `y` | Which axis can scroll. `y` → `overflow-y:auto; overflow-x:hidden`; `x` → `overflow-x:auto; overflow-y:hidden`; `both` → `overflow:auto`. |
| `max-height` | number \| CSS length | — | Maximum height of the scrollable area. A bare number is treated as `px` (`max-height="240"` → `240px`); any other value (`60vh`, `100%`, `20rem`) passes through unchanged. Applied inline only when provided. |
| `max-width` | number \| CSS length | — | Maximum width of the scrollable area, with the same number→`px` resolution. Applied inline only when provided. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `axis` | `'x' \| 'y' \| 'both'` | Reflects the `axis` attribute. |
| `maxHeight` | `string \| number \| null` | Reflects the `max-height` attribute (number coerced to a string). |
| `maxWidth` | `string \| number \| null` | Reflects the `max-width` attribute (number coerced to a string). |

**Events**

None.

**Slots**

The default slot holds the scrollable content; it is moved into the inner `.tc-scroll-area-content` element and preserved across re-renders.

**Accessibility**

When the content overflows, the scroll container receives `tabindex="0"` so it is keyboard-scrollable (arrow keys, Page Up/Down); the `tabindex` is removed automatically when content fits. Native scrolling is always intact. Focus is visible (`:focus-visible` outline), the scrollbar uses the strong-border slate token for contrast, and reduced motion is honoured.

```html
<tc-scroll-area axis="y" max-height="240" style="border:1px solid var(--tc-border)">
    <p>Long content…</p>
    <p>…that overflows vertically.</p>
</tc-scroll-area>

<tc-scroll-area axis="both" max-height="60vh" max-width="100%">
    <div style="width:900px">Wide and tall content scrolls on both axes.</div>
</tc-scroll-area>
```

---