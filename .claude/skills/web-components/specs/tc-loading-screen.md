---
component: tc-loading-screen
---

### tc-loading-screen

Full-viewport loading screen with an eyebrow label, optional title, progress bar (determinate or indeterminate), and a cycling tip section. Voiced for the toolcase design system — slate surface, sharp corners, JetBrains Mono for all machine-facing text. The component covers the viewport when present in the DOM; add or remove it (or toggle `[hidden]`) to show or hide the loading state. No `[open]` attribute is needed.

**Tag:** `tc-loading-screen`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `eyebrow` | string | `'Loading'` | Mono micro-label above the title. |
| `title-text` | string | — | Human-readable heading shown below the eyebrow. |
| `label` | string | — | Descriptive text shown in the label row alongside the percentage. |
| `progress` | number (0–1) | — | Determinate progress value. Absent → indeterminate animation. |
| `tip-title` | string | `'Tip'` | Mono label above the cycling tip body. |
| `tip-interval` | number (ms) | `5000` | Milliseconds between automatic tip rotations. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `tips` | `string[]` | Array of tip strings to display and cycle through. Set at least two strings to activate cycling. Setting this resets the tip index and restarts the interval. |
| `progress` | `number \| null` | Reflects the `progress` attribute. |
| `label` | `string` | Reflects the `label` attribute. |
| `eyebrow` | `string` | Reflects the `eyebrow` attribute. |
| `titleText` | `string` | Reflects the `title-text` attribute. |
| `tipTitle` | `string` | Reflects the `tip-title` attribute. |
| `tipInterval` | `number` | Reflects the `tip-interval` attribute. |

**Events**

None. `tc-loading-screen` is a passive display element — all state is driven in by the consumer via attributes and the `tips` JS property.

**Slots**

None.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-loading-screen-bg` | `var(--tc-surface)` | Background colour of the full-screen surface. |
| `--bs-loading-screen-panel-max-width` | `480px` | Maximum width of the centred content column. |
| `--bs-loading-screen-panel-gap` | `1.5rem` | Gap between panel sections. |
| `--bs-loading-screen-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow label colour (mono). |
| `--bs-loading-screen-eyebrow-size` | `10.5px` | Eyebrow label font size. |
| `--bs-loading-screen-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-loading-screen-title-size` | `1.1875rem` | Title font size. |
| `--bs-loading-screen-title-weight` | `600` | Title font weight. |
| `--bs-loading-screen-label-color` | `var(--tc-text)` | Label text colour. |
| `--bs-loading-screen-label-size` | `0.925rem` | Label font size. |
| `--bs-loading-screen-pct-color` | `var(--tc-text-muted)` | Percentage readout colour. |
| `--bs-loading-screen-pct-size` | `0.8125rem` | Percentage font size (JetBrains Mono). |
| `--bs-loading-screen-bar-bg` | `var(--tc-border)` | Progress bar track colour. |
| `--bs-loading-screen-bar-fill` | `var(--tc-app-accent)` | Progress bar fill colour. |
| `--bs-loading-screen-bar-height` | `3px` | Progress bar track height. |
| `--bs-loading-screen-tip-label-color` | `var(--tc-text-faint)` | Tip section label colour. |
| `--bs-loading-screen-tip-label-size` | `10.5px` | Tip label font size. |
| `--bs-loading-screen-tip-body-color` | `var(--tc-text-muted)` | Tip body text colour. |
| `--bs-loading-screen-tip-body-size` | `0.8125rem` | Tip body font size (JetBrains Mono). |
| `--bs-loading-screen-z` | `var(--tc-z-modal)` | Stacking layer (fixed `--tc-z-*` scale). |
| `--bs-loading-screen-fade` | `var(--tc-transition-base)` | Fade-in animation duration. |

```html
<!-- Indeterminate (no progress attribute) -->
<tc-loading-screen
    eyebrow="Loading"
    title-text="Preparing your workspace">
</tc-loading-screen>

<!-- Determinate with label -->
<tc-loading-screen
    id="screen"
    eyebrow="Building"
    title-text="Compiling your project"
    label="Bundling assets"
    progress="0">
</tc-loading-screen>

<script>
    const screen = document.querySelector('#screen')
    // Advance progress
    screen.progress = 0.42
    // Complete — remove the element to dismiss
    screen.progress = 1
    screen.remove()
</script>

<!-- With cycling tips (JS property) -->
<tc-loading-screen
    id="tips-screen"
    eyebrow="Initialising"
    title-text="Please wait"
    tip-title="Did you know"
    tip-interval="3000">
</tc-loading-screen>

<script>
    document.querySelector('#tips-screen').tips = [
        'Compiling shaders…',
        'Loading assets…',
        'Connecting to server…',
    ]
</script>
```

---