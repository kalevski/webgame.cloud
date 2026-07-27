---
component: tc-artboard-backdrop
---

### tc-artboard-backdrop

Decorative full-bleed backdrop surface for staging artwork, previews, or hero content. Styled to the web-components design system — the slate neutral ramp, sharp corners (`border-radius: 0`), and a 1px hairline. Purely structural: slotted children are projected as light-DOM children of the host; no shadow root, no shadow (this is a base surface, not an overlay tier).

**Tag:** `tc-artboard-backdrop`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `kind` | `dark\|scene\|parch` | `dark` | Surface tone. `dark` → ink surface with inverse (white) text; `scene` → muted slate well with a hairline; `parch` → light paper surface with a hairline. An absent or unrecognised value falls back to `dark`. |
| `padding` | `none\|sm\|md\|lg\|xl` | `md` | Inner padding step (`0`, `0.75rem`, `1.5rem`, `2.5rem`, `4rem`). An absent or unrecognised value falls back to `md`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `kind` | `ArtboardBackdropKind` | Reflects the `kind` attribute; returns `dark` when absent/invalid. |
| `padding` | `ArtboardBackdropPadding` | Reflects the `padding` attribute; returns `md` when absent/invalid. |

**Events**

None. `tc-artboard-backdrop` is a purely presentational surface.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Content staged on the backdrop. Rendered as light-DOM children of the host. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-artboard-backdrop-bg` | `var(--tc-ink)` | Surface background (overridden per `kind`). |
| `--bs-artboard-backdrop-color` | `var(--tc-text-inverse)` | Text colour (overridden per `kind`). |
| `--bs-artboard-backdrop-border-color` | `transparent` | Hairline border colour (overridden per `kind`). |
| `--bs-artboard-backdrop-radius` | `0` | Corner radius — sharp by mandate. |
| `--bs-artboard-backdrop-padding` | `1.5rem` | Inner padding (set by the `padding` step). |

```html
<!-- Dark ink backdrop (default) -->
<tc-artboard-backdrop>
    <h3>Featured artwork</h3>
</tc-artboard-backdrop>

<!-- Muted scene tone with extra padding -->
<tc-artboard-backdrop kind="scene" padding="xl">
    <img src="preview.png" alt="preview">
</tc-artboard-backdrop>

<!-- Light paper, flush content -->
<tc-artboard-backdrop kind="parch" padding="none">
    <canvas></canvas>
</tc-artboard-backdrop>
```

---