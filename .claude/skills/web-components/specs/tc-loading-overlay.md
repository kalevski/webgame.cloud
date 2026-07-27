---
component: tc-loading-overlay
---

### tc-loading-overlay

Full-surface loading overlay with a spinner ring, optional label, determinate or indeterminate progress bar, and an optional mono tip line. Styled to the toolcase design system: flat slate ink scrim, sharp panel. Visibility is driven by the `[open]` boolean attribute — the consumer sets it; the component never self-closes. No slots; purely attribute-driven. Renders `role="status"` + `aria-live="polite"` on the host and a `role="progressbar"` on the inner bar.

**Tag:** `tc-loading-overlay`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | absent | Show the overlay when present; hide it when absent. |
| `progress` | number \| absent | absent | Progress value in the `0–1` range. When absent the bar is indeterminate (animated slide). Set to `0.5` for 50 %. |
| `label` | string | `''` | Descriptive label displayed above the progress bar. When absent and `progress` is also absent no label row is rendered. |
| `tip` | string | `''` | Secondary mono status line below the bar (e.g. a file path or phase name). Hidden when absent. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Reflects the `open` attribute. |
| `progress` | `number \| null` | `null` | Reflects the `progress` attribute. `null` = indeterminate. |
| `label` | `string` | `''` | Reflects the `label` attribute. |
| `tip` | `string` | `''` | Reflects the `tip` attribute. |

**Events**

None. `tc-loading-overlay` is a passive overlay — the consumer sets `open` to show and removes it to hide.

**Slots:** None. Entirely attribute-driven.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-loading-overlay-backdrop-bg` | `rgba(15,23,42,0.65)` | Semi-transparent ink wash behind the panel. |
| `--bs-loading-overlay-panel-bg` | `var(--tc-surface)` | Panel card background. |
| `--bs-loading-overlay-panel-border` | `1px solid var(--tc-border)` | Panel hairline border. |
| `--bs-loading-overlay-panel-shadow` | `var(--tc-shadow-lg)` | Panel elevation shadow (overlay tier). |
| `--bs-loading-overlay-panel-padding` | `2rem` | Panel internal padding. |
| `--bs-loading-overlay-panel-gap` | `1.25rem` | Gap between panel children. |
| `--bs-loading-overlay-panel-width` | `min(340px, calc(100vw - 2rem))` | Panel maximum width. |
| `--bs-loading-overlay-spinner-color` | `var(--tc-app-accent)` | Spinner arc colour. |
| `--bs-loading-overlay-spinner-size` | `36px` | Spinner ring diameter. |
| `--bs-loading-overlay-spinner-width` | `3px` | Spinner ring border width. |
| `--bs-loading-overlay-label-color` | `var(--tc-text)` | Label text colour. |
| `--bs-loading-overlay-label-size` | `0.925rem` | Label font size. |
| `--bs-loading-overlay-pct-color` | `var(--tc-text-muted)` | Percentage value colour. |
| `--bs-loading-overlay-pct-size` | `0.8125rem` | Percentage font size (JetBrains Mono). |
| `--bs-loading-overlay-bar-bg` | `var(--tc-border)` | Progress bar track colour. |
| `--bs-loading-overlay-bar-fill` | `var(--tc-app-accent)` | Progress bar fill colour. |
| `--bs-loading-overlay-bar-height` | `3px` | Progress bar track height. |
| `--bs-loading-overlay-tip-color` | `var(--tc-text-faint)` | Tip line text colour. |
| `--bs-loading-overlay-tip-size` | `0.8125rem` | Tip line font size (JetBrains Mono). |
| `--bs-loading-overlay-z` | `var(--tc-z-modal)` | Stacking layer (fixed `--tc-z-*` scale). |
| `--bs-loading-overlay-fade` | `var(--tc-transition-base)` | Fade-in animation duration. |

```html
<!-- Indeterminate spinner (no progress attribute) -->
<tc-loading-overlay id="loader" open></tc-loading-overlay>

<script>
    const loader = document.querySelector('#loader')
    // Hide after work is done
    loader.open = false
</script>

<!-- Determinate with label + tip -->
<tc-loading-overlay
    id="upload"
    open
    label="Uploading file"
    progress="0"
    tip="Connecting to storage…">
</tc-loading-overlay>

<script>
    const upload = document.querySelector('#upload')
    // Advance progress
    upload.progress = 0.42
    upload.tip = 'Transferring data…'
    // Complete
    upload.progress = 1
    upload.open = false
</script>
```

---