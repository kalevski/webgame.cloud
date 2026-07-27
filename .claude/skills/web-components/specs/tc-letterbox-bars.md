---
component: tc-letterbox-bars
---

### tc-letterbox-bars

Animated cinematic letterbox bars for cutscenes and reveal transitions. Styled to the web-components design system — flat `var(--tc-ink)` bars. The host fills its nearest positioned ancestor (`position: absolute; inset: 0`) and renders two bar spans that slide in/out when `[show]` is toggled. Purely structural and passive: no shadow root, no slots, no events. All cosmetics flow through `--bs-letterbox-bars-*` custom properties; the free-form CSS value attributes (`bar-height`, `bar-color`, `duration`) write through to those properties as inline overrides.

**Tag:** `tc-letterbox-bars`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `show` | boolean | false | Slides the bars into the visible area when present; slides them out when removed |
| `bar-height` | CSS length | `80px` | Height of each bar (any CSS length, e.g. `100px`, `10vh`) |
| `bar-color` | CSS color | `var(--tc-ink)` | Fill color of each bar (any CSS color value) |
| `duration` | CSS time | `0.4s` | Slide transition duration (any CSS `<time>` value) |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `show` | boolean | Reflects the `show` attribute |
| `barHeight` | string | Reflects the `bar-height` attribute (default `80px`) |
| `barColor` | string | Reflects the `bar-color` attribute (default `var(--tc-ink)`) |
| `duration` | string | Reflects the `duration` attribute (default `0.4s`) |

**Events**

None. `tc-letterbox-bars` is a passive overlay — the consumer sets and removes `[show]` to drive the animation.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-letterbox-bars-height` | `80px` | Bar height (overridden inline by the `bar-height` attribute). |
| `--bs-letterbox-bars-color` | `var(--tc-ink)` | Bar fill color (overridden inline by the `bar-color` attribute). |
| `--bs-letterbox-bars-duration` | `0.4s` | Slide transition duration (overridden inline by the `duration` attribute). |
| `--bs-letterbox-bars-z` | `1` | Stacking order within the positioned parent container. |

**Slots:** None.

```html
<!-- Wrap a positioned container; tc-letterbox-bars fills it absolutely -->
<div style="position: relative; width: 100%; height: 300px; overflow: hidden;">
    <video src="cutscene.mp4" autoplay style="width: 100%; height: 100%; object-fit: cover;"></video>
    <tc-letterbox-bars id="bars"></tc-letterbox-bars>
</div>
<script>
    const bars = document.querySelector('#bars')
    // Trigger cutscene bars
    bars.show = true
    // Remove after cutscene ends
    setTimeout(() => { bars.show = false }, 5000)
</script>
```

---