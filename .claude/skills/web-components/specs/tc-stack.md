---
component: tc-stack
---

### tc-stack

Flexbox row/column layout primitive. Children are composed along a single axis with configurable gap, alignment, justification, and optional wrapping. The element has no visible chrome; it is purely structural.

**Tag:** `tc-stack`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `direction` | `vertical\|horizontal` | `vertical` | Flex axis. `vertical` → `flex-direction: column`; `horizontal` → `flex-direction: row`. |
| `gap` | string | `var(--bs-stack-gap, 0px)` | CSS gap between children (e.g. `8px`, `1rem`). When absent the `--bs-stack-gap` custom property applies. |
| `align` | string | `var(--bs-stack-align, stretch)` | `align-items` value (e.g. `center`, `flex-start`). When absent the `--bs-stack-align` custom property applies. |
| `justify` | string | `var(--bs-stack-justify, flex-start)` | `justify-content` value (e.g. `space-between`, `center`). When absent the `--bs-stack-justify` custom property applies. |
| `wrap` | boolean | `false` | When present enables `flex-wrap: wrap`. |
| `inline` | boolean | `false` | When present switches the host to `display: inline-flex`. |

**CSS custom properties (theming contract)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-stack-gap` | `0px` | Default gap when the `gap` attribute is absent. |
| `--bs-stack-align` | `stretch` | Default `align-items` when the `align` attribute is absent. |
| `--bs-stack-justify` | `flex-start` | Default `justify-content` when the `justify` attribute is absent. |

**Events**

None. `tc-stack` is a purely structural element.

**Slots**

Default slot — all child elements are laid out in the flex container.

```html
<!-- Vertical stack with 8px gap (default) -->
<tc-stack gap="8px">
    <div>Item A</div>
    <div>Item B</div>
    <div>Item C</div>
</tc-stack>

<!-- Horizontal row, centered, space-between -->
<tc-stack direction="horizontal" justify="space-between" align="center">
    <span>Left</span>
    <span>Right</span>
</tc-stack>

<!-- Wrapping horizontal row -->
<tc-stack direction="horizontal" gap="8px" wrap>
    <div>Alpha</div>
    <div>Beta</div>
    <div>Gamma</div>
</tc-stack>

<!-- Inline-flex stack inside a paragraph -->
<p>
    Before
    <tc-stack inline direction="horizontal" gap="4px" align="center">
        <span>A</span><span>B</span>
    </tc-stack>
    after.
</p>
```

---