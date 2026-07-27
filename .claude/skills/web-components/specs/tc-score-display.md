---
component: tc-score-display
---

### tc-score-display

Score readout HUD — a prominent JetBrains Mono value with an optional mono micro-label and an optional multiplier chip. Purely presentational; attribute-driven with no slots. All cosmetics flow through `--bs-score-display-*` custom properties.

**Tag:** `tc-score-display`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `score` | number | `0` | Numeric score to display; rendered via `toLocaleString()`. |
| `multiplier` | number \| null | `null` | Score multiplier. When present and not equal to `1`, rendered as `×N` in ink accent. |
| `label` | string | `""` | Optional uppercase micro-label shown above the score row. |
| `align` | `"left"` \| `"center"` \| `"right"` | `"left"` | Horizontal alignment of both the label and value row. |
| `font-size` | number | `28` | Score font size in pixels. Written as `--bs-score-display-font-size` on the host. |

#### Events

None. `tc-score-display` is a purely presentational element.

#### Slots

None. All content is driven by attributes.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-score-display-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-score-display-border-color` | `var(--tc-border-strong)` | 1px hairline border color. |
| `--bs-score-display-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-score-display-padding-y` | `0.625rem` | Vertical inner padding. |
| `--bs-score-display-padding-x` | `0.875rem` | Horizontal inner padding. |
| `--bs-score-display-min-width` | `6rem` | Minimum readout width. |
| `--bs-score-display-label-color` | `var(--tc-text-muted)` | Micro-label text color. |
| `--bs-score-display-label-font-size` | `0.6875rem` | Micro-label font size (~11px). |
| `--bs-score-display-label-letter-spacing` | `0.12em` | Micro-label letter spacing. |
| `--bs-score-display-value-color` | `var(--tc-text)` | Score value text color. |
| `--bs-score-display-font-size` | *(set by `font-size` attr)* | Score value font size; written inline by the element per instance. |
| `--bs-score-display-value-font-weight` | `600` | Score value font weight. |
| `--bs-score-display-multiplier-color` | `var(--tc-app-accent)` | Multiplier chip color. |
| `--bs-score-display-multiplier-font-size` | `1rem` | Multiplier chip font size. |

#### Example

```html
<tc-score-display label="Score" score="12450" multiplier="2" align="left"></tc-score-display>

<script>
  const el = document.querySelector('tc-score-display')
  // update programmatically
  el.score = 99999
  el.multiplier = 3
  el.label = 'Final Score'
</script>
```

---