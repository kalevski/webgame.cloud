---
component: tc-subtitle
---

### tc-subtitle

Subtitle / secondary heading text line. Styled to the toolcase design system: slate neutrals, sharp corners, 1px hairline border (boxed variant), JetBrains Mono for the optional speaker micro-label. All content is driven by attributes — no slots or events. No shadow root; light DOM; `display: block`.

**Tag:** `tc-subtitle`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | `string` | `''` | The subtitle text to display. |
| `speaker` | `string` | `''` | Optional speaker name shown as an uppercase mono micro-label above the text. |
| `boxed` | `boolean` | `false` | When present, adds a 1px hairline border and surface background. |
| `align` | `'left' \| 'center' \| 'right'` | `'center'` | Text alignment. Center also applies `margin: auto` for constrained max-widths. |
| `font-size` | `number` | — | Optional font size override in pixels (bare integer). Sets `--bs-subtitle-font-size` inline. |
| `max-width` | `number` | — | Optional max-width in pixels (bare integer). Sets `--bs-subtitle-max-width` inline. |

**JS Properties**

All attributes are also exposed as JS properties with the same names (`text`, `speaker`, `boxed`, `align`). The numeric attributes use camelCase equivalents:

| Property | Type | Description |
|----------|------|-------------|
| `fontSize` | `number \| null` | Get/set the `font-size` attribute as a number. |
| `maxWidth` | `number \| null` | Get/set the `max-width` attribute as a number. |

**Events**

None. `tc-subtitle` is purely presentational.

**Slots**

None. All content is supplied via attributes.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-subtitle-color` | `var(--tc-text)` | Main text color. |
| `--bs-subtitle-font-size` | `0.925rem` | Main text font size (overridden inline by `font-size` attribute). |
| `--bs-subtitle-font-weight` | `400` | Main text font weight. |
| `--bs-subtitle-line-height` | `1.6` | Main text line height. |
| `--bs-subtitle-max-width` | `none` | Host max-width (overridden inline by `max-width` attribute). |
| `--bs-subtitle-speaker-color` | `var(--tc-text-muted)` | Speaker label color. |
| `--bs-subtitle-speaker-font-size` | `0.6875rem` | Speaker label font size. |
| `--bs-subtitle-speaker-letter-spacing` | `0.08em` | Speaker label letter-spacing. |
| `--bs-subtitle-speaker-margin-bottom` | `0.25rem` | Gap between speaker and text. |
| `--bs-subtitle-bg` | `var(--tc-surface)` | Boxed variant background. |
| `--bs-subtitle-border-color` | `var(--tc-border)` | Boxed variant border color. |
| `--bs-subtitle-padding-y` | `0.625rem` | Boxed variant vertical padding. |
| `--bs-subtitle-padding-x` | `1rem` | Boxed variant horizontal padding. |

**Example**

```html
<!-- Basic centered subtitle -->
<tc-subtitle text="The journey of a thousand miles begins with a single step." />

<!-- With speaker label -->
<tc-subtitle speaker="Narrator" text="The kingdom fell silent as the last light faded." />

<!-- Left-aligned, no speaker -->
<tc-subtitle align="left" text="Left-aligned subtitle for content-heavy layouts." />

<!-- Boxed variant with max-width -->
<tc-subtitle boxed speaker="System" text="Initialising quantum resonance array…" max-width="480" />

<!-- Custom danger theme -->
<tc-subtitle
    boxed
    speaker="Warning"
    text="This action cannot be undone."
    style="--bs-subtitle-border-color: var(--tc-danger); --bs-subtitle-speaker-color: var(--tc-danger);"
/>
```

---