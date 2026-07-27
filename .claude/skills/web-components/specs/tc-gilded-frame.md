---
component: tc-gilded-frame
---

### tc-gilded-frame

Hairline-framed surface that wraps its slotted content. Styled to the toolcase voice — sharp corners, slate neutrals, 1px hairline borders, no decorative shadow. The three tones map onto the neutral ramp: `dark` = ink fill with light text, `leather` = muted slate fill, `transparent` = no fill with a hairline border only.

**Tag:** `tc-gilded-frame`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `tone` | `'dark' \| 'leather' \| 'transparent'` | `dark` | Surface treatment. `dark` = ink fill / light text; `leather` = muted slate fill; `transparent` = borderless fill, hairline border, inherited text color. Unknown values fall back to `dark`. Reflected as a class on the host. |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `md` | Inner padding step (`0` / `0.5rem` / `1rem` / `1.5rem` / `2rem`). Unknown values fall back to `md`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `tone` | `GildedFrameTone` | Reflects the `tone` attribute; returns `dark` when absent or invalid. |
| `padding` | `GildedFramePadding` | Reflects the `padding` attribute; returns `md` when absent or invalid. |

**Events**

None. `tc-gilded-frame` is a purely presentational wrapper.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Content to frame. Rendered into the inner `.tc-gilded-frame-content` wrapper. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-gilded-frame-bg` | `var(--tc-ink)` | Surface fill. Overridden per tone (`dark` ink, `leather` muted slate, `transparent`). |
| `--bs-gilded-frame-color` | `rgba(248, 250, 252, 0.92)` | Text color. Overridden per tone. |
| `--bs-gilded-frame-border-color` | `rgba(255, 255, 255, 0.1)` | Hairline border color. Overridden per tone. |
| `--bs-gilded-frame-border-width` | `1px` | Border width. |
| `--bs-gilded-frame-padding` | `1rem` | Inner padding. Set by the `padding` attribute's modifier class. |

```html
<!-- Dark framed panel (defaults) -->
<tc-gilded-frame>
    Framed content.
</tc-gilded-frame>

<!-- Muted slate surface with large padding -->
<tc-gilded-frame tone="leather" padding="lg">
    <h5>Framed panel</h5>
    <p>Any markup can be slotted inside.</p>
</tc-gilded-frame>

<!-- Borderless transparent tone, tight padding -->
<tc-gilded-frame tone="transparent" padding="sm">
    Hairline outline only.
</tc-gilded-frame>
```

---