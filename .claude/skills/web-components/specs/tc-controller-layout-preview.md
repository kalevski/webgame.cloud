---
component: tc-controller-layout-preview
---

### tc-controller-layout-preview

A gamepad diagram with labeled face-button bindings. The four face buttons relabel per the `layout` attribute — Xbox (`A`/`B`/`X`/`Y`), PlayStation (`✕`/`◯`/`△`/`□`), Nintendo (the swapped `A`/`B`/`X`/`Y`), or the generic directional triangles (`△`/`▷`/`▽`/`◁`). Styled to the toolcase design system: a flat slate body, 1px hairline strokes, mono glyph labels outlined in the slate ink accent, and a mono uppercase platform micro-label beneath the diagram. Neutrals carry the diagram and the button bindings are the only information. The controller shell, thumbsticks, and face buttons are the sanctioned curves; the d-pad cross stays sharp. No slot children, no events — purely presentational.

**Tag:** `tc-controller-layout-preview`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | `'xbox' \| 'playstation' \| 'nintendo' \| 'generic'` | `'generic'` | Which controller's face-button glyphs to label. Unrecognised values fall back to `generic`. The diagram's `aria-label` reads `"<Platform> controller layout"`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `layout` | `ControllerLayout` | Mirrors the `layout` attribute. Setting it re-renders the diagram with the new bindings. |

**Events**

None. `tc-controller-layout-preview` is a purely presentational element.

**Slots**

None. The component owns its SVG body, d-pad, thumbsticks, face buttons, and platform label.

**CSS custom properties** (cosmetics flow through `--bs-controller-layout-preview-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-controller-layout-preview-width` | `260px` | Diagram width (`300px` under coarse pointers); the SVG scales to fit |
| `--bs-controller-layout-preview-gap` | `var(--tc-space-2, 0.5rem)` | Gap between the diagram and the platform label |
| `--bs-controller-layout-preview-shell-bg` | `var(--tc-surface-muted)` | Controller body fill |
| `--bs-controller-layout-preview-shell-border` | `var(--tc-border-strong)` | Controller body hairline stroke |
| `--bs-controller-layout-preview-detail-bg` | `var(--tc-text-faint)` | D-pad cross fill |
| `--bs-controller-layout-preview-stick-bg` | `var(--tc-surface)` | Thumbstick well fill |
| `--bs-controller-layout-preview-stick-border` | `var(--tc-border-strong)` | Thumbstick hairline stroke |
| `--bs-controller-layout-preview-stick-hub-color` | `var(--tc-text-faint)` | Thumbstick centre hub |
| `--bs-controller-layout-preview-button-bg` | `var(--tc-surface)` | Face-button well fill |
| `--bs-controller-layout-preview-button-border` | `var(--tc-app-accent)` | Face-button outline — the ink accent |
| `--bs-controller-layout-preview-glyph-color` | `var(--tc-text)` | Face-button glyph (mono) color |
| `--bs-controller-layout-preview-glyph-size` | `13px` | Face-button glyph size |
| `--bs-controller-layout-preview-label-color` | `var(--tc-text-muted)` | Platform micro-label color |
| `--bs-controller-layout-preview-label-size` | `11px` | Platform micro-label size |
| `--bs-controller-layout-preview-label-spacing` | `0.1em` | Platform micro-label letter-spacing |

**Example**

```html
<tc-controller-layout-preview id="pad" layout="playstation"></tc-controller-layout-preview>
<script>
  // relabel the face buttons for a different controller
  document.getElementById('pad').layout = 'nintendo'
</script>
```

---