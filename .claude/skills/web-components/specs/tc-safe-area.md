---
component: tc-safe-area
---

### tc-safe-area

Layout wrapper that insets its content by the device's `env(safe-area-inset-*)` CSS environment variables (the areas carved out by notches, rounded corners, and home indicators). An optional `extra` attribute adds a uniform extra padding on top of the env insets on every side. No visible chrome — purely structural.

**Tag:** `tc-safe-area`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `extra` | string | — | Extra padding added uniformly on all four sides on top of `env(safe-area-inset-*)`. Accepts any CSS length string (`16px`, `1rem`, `5%`, …). When omitted only the env insets are applied (zero on most desktop browsers). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `extra` | `string` | Mirrors the `extra` attribute. Set to `''` to remove the override. |

**Events**

None. `tc-safe-area` is a purely structural layout element.

**Slots**

| Name | Description |
|------|-------------|
| *(default)* | Content to render inside the safe-area padding. Children are direct descendants of the host element. |

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-safe-area-extra` | `0px` | The extra padding value. Overridden by the element's inline style when the `extra` attribute is set; override it directly via `style` if you need richer control. |

```html
<!-- Env insets only (0 on desktop) -->
<tc-safe-area>
  <div>HUD content</div>
</tc-safe-area>

<!-- 16px extra padding on every side on top of env insets -->
<tc-safe-area extra="16px">
  <div>HUD content with extra padding</div>
</tc-safe-area>

<!-- CSS-length values are accepted -->
<tc-safe-area extra="1.5rem">
  <div>Content</div>
</tc-safe-area>
```

---