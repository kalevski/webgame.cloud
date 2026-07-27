---
component: tc-aspect-ratio-box
---

### tc-aspect-ratio-box

Layout primitive that holds its slotted content at a fixed intrinsic aspect ratio (e.g. 16:9). Uses the modern CSS `aspect-ratio` property with a `padding-bottom` percentage fallback for older engines. Purely structural — no visible chrome, no shadows, sharp corners. Constrain the width (e.g. via `max-width` or a grid column) and the height follows the ratio automatically.

**Tag:** `tc-aspect-ratio-box`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `ratio` | string | `16 / 9` | Width/height ratio. Accepts the CSS `aspect-ratio` syntax (`16 / 9`) or a colon pair (`16:9`). The fallback percentage is derived automatically. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `ratio` | `string` | Reflects the `ratio` attribute; returns `16 / 9` when absent. Setting an empty/falsy value removes the attribute (restoring the default). |

**Events**

None. `tc-aspect-ratio-box` is a purely presentational layout element.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Content to size. Rendered into the inner `.tc-aspect-ratio-box__content` wrapper, which fills the ratio box. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-aspect-ratio-box-ratio` | `16 / 9` | The applied aspect ratio. Set automatically from the `ratio` attribute; can also be themed directly. |
| `--bs-aspect-ratio-box-fallback` | `56.25%` | `padding-bottom` percentage used by the no-`aspect-ratio` fallback. Derived automatically from `ratio`. |
| `--bs-aspect-ratio-box-bg` | `transparent` | Background fill of the box. |
| `--bs-aspect-ratio-box-border` | `0` | Border shorthand for the box (e.g. `1px solid var(--tc-border)`). |

```html
<!-- 16:9 video frame -->
<tc-aspect-ratio-box style="max-width: 480px">
    <iframe src="https://www.youtube.com/embed/…" style="width:100%;height:100%"></iframe>
</tc-aspect-ratio-box>

<!-- 4:3 image (colon syntax) -->
<tc-aspect-ratio-box ratio="4:3" style="max-width: 360px">
    <img src="photo.jpg" alt="" style="width:100%;height:100%;object-fit:cover">
</tc-aspect-ratio-box>

<!-- Square placeholder -->
<tc-aspect-ratio-box ratio="1 / 1" style="max-width: 220px">
    <div>1 : 1</div>
</tc-aspect-ratio-box>
```

---