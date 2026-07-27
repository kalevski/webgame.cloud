---
component: tc-anchor
---

### tc-anchor

Layout primitive that absolutely positions its slotted content at a corner, edge, or the centre of the nearest positioned ancestor. Purely structural — no visible chrome, no shadows, no border-radius. Set `position: relative` (or any non-static positioning) on the parent so the anchor pins to it.

**Tag:** `tc-anchor`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `position` | `top-left\|top\|top-right\|left\|center\|right\|bottom-left\|bottom\|bottom-right` | `top-left` | Where the content is pinned within the positioned ancestor. Edge positions (`top`, `left`, `center`, …) centre along the cross-axis via `transform`. An absent or unrecognised value falls back to `top-left`. |
| `inset` | string \| number | `0px` | Offset from the anchored edges. Bare numbers are treated as `px` (e.g. `inset="8"` → `8px`); any CSS length string is accepted (`1rem`, `12px`, …). Ignored along centred axes. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `position` | `AnchorPosition` | Reflects the `position` attribute; returns `top-left` when absent/invalid. |
| `inset` | `string` | Reflects the `inset` attribute; returns `0px` when absent. |

**Events**

None. `tc-anchor` is a purely presentational layout element.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Content to position. Rendered as light-DOM children of the absolutely-positioned host. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-anchor-inset` | `0px` | Edge offset consumed by every position. Set automatically from the `inset` attribute; can also be themed directly. |

```html
<!-- Badge pinned to the top-right corner of a card -->
<div style="position: relative">
    <tc-anchor position="top-right" inset="8">
        <tc-badge variant="danger">New</tc-badge>
    </tc-anchor>
    <!-- card body … -->
</div>

<!-- Centred overlay -->
<div style="position: relative; height: 200px">
    <tc-anchor position="center">
        <span>Centred</span>
    </tc-anchor>
</div>

<!-- Default position (top-left), zero inset -->
<div style="position: relative">
    <tc-anchor>
        <span>Corner</span>
    </tc-anchor>
</div>
```

---