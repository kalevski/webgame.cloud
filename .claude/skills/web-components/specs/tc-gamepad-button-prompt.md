---
component: tc-gamepad-button-prompt
---

### tc-gamepad-button-prompt

Gamepad button glyph prompt — a sharp slate key-cap holding a glyph (A / B / X / Y or generic such as `RT`, `LB`) with an optional caption label. Purely presentational, attribute-driven, no slots. Styled to the toolcase design system — a JetBrains Mono cap on a `--tc-surface-muted` fill with a hairline border, a faint heavier bottom edge (mirroring `tc-kbd`), sharp corners, and an Inter muted caption. The host reflects a normalised `data-button` attribute (e.g. `data-button="A"`) as a theming hook. The `size` attribute (px) drives the cap dimension via inline custom properties.

**Tag:** `tc-gamepad-button-prompt`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `glyph` | string | — | The glyph shown inside the cap (e.g. `A`, `B`, `X`, `Y`, `RT`). |
| `label` | string | — | Optional caption label shown beside the cap. |
| `size` | number | — | Cap size in pixels. When set, writes `--bs-gamepad-button-prompt-size` (and a derived `--bs-gamepad-button-prompt-glyph-size` at ~0.5×) as inline host styles. When absent, the SCSS defaults apply. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `glyph` | string | Reflects the `glyph` attribute. |
| `label` | string | Reflects the `label` attribute. |
| `size` | number \| null | Reflects the `size` attribute; `null` when unset or non-numeric. |

**Slots**

None. `tc-gamepad-button-prompt` is purely attribute-driven.

**Events**

None. `tc-gamepad-button-prompt` is a purely presentational element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-gamepad-button-prompt-size` | `1.75rem` | Cap dimension (min-width + height). Set via the `size` attribute or override in CSS. |
| `--bs-gamepad-button-prompt-glyph-size` | `0.8125rem` | Glyph font size. Derived from `size` when that attribute is set. |
| `--bs-gamepad-button-prompt-gap` | `0.5rem` | Gap between cap and label. |
| `--bs-gamepad-button-prompt-cap-bg` | `var(--tc-surface-muted)` | Cap background fill. |
| `--bs-gamepad-button-prompt-cap-color` | `var(--tc-text)` | Glyph text color. |
| `--bs-gamepad-button-prompt-cap-border-color` | `var(--tc-border-strong)` | Cap hairline border color. |
| `--bs-gamepad-button-prompt-cap-border-width` | `1px` | Cap border width. |
| `--bs-gamepad-button-prompt-glyph-weight` | `600` | Glyph font weight (≤600). |
| `--bs-gamepad-button-prompt-label-size` | `0.8125rem` | Caption label font size (~13px). |
| `--bs-gamepad-button-prompt-label-color` | `var(--tc-text-muted)` | Caption label color. |

```html
<!-- Face buttons -->
<tc-gamepad-button-prompt glyph="A"></tc-gamepad-button-prompt>
<tc-gamepad-button-prompt glyph="B"></tc-gamepad-button-prompt>

<!-- With a caption label -->
<tc-gamepad-button-prompt glyph="A" label="Jump"></tc-gamepad-button-prompt>

<!-- Generic / trigger prompts -->
<tc-gamepad-button-prompt glyph="RT" label="Fire"></tc-gamepad-button-prompt>

<!-- Custom size -->
<tc-gamepad-button-prompt glyph="A" size="44" label="Interact"></tc-gamepad-button-prompt>
```

---