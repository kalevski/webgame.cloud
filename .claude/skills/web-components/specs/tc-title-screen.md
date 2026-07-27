---
component: tc-title-screen
---

### tc-title-screen

Full-viewport game title / start screen. Covers the entire viewport when present in the DOM; add or remove it (or toggle `[hidden]`) to show or hide it. Styled to the toolcase design system — slate surface, sharp corners, 1px hairline divider, JetBrains Mono eyebrow. The eyebrow defaults to `"Press Start"` and is configurable via attribute. Purely presentational — no events, no slots, no shadow root; `display: block`.

**Tag:** `tc-title-screen`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `eyebrow` | string | `"Press Start"` | Mono uppercase micro-label shown above the title. |
| `title-text` | string | `""` | Main title heading (`<h1>`). Omitted when empty. |
| `subtitle` | string | `""` | Secondary text shown below the hairline divider. Omitted when empty. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `eyebrow` | `string` | `"Press Start"` | Reflects the `eyebrow` attribute. |
| `titleText` | `string` | `""` | Reflects the `title-text` attribute. |
| `subtitle` | `string` | `""` | Reflects the `subtitle` attribute. |

**Events**

None. `tc-title-screen` is a passive display element.

**Slots**

None. All content is attribute-driven.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-title-screen-bg` | `var(--tc-surface)` | Background colour of the full-screen surface. |
| `--bs-title-screen-z` | `var(--tc-z-modal)` | Stacking layer (fixed `--tc-z-*` scale). |
| `--bs-title-screen-fade` | `var(--tc-transition-base)` | Fade-in animation duration. |
| `--bs-title-screen-panel-max-width` | `520px` | Maximum width of the centred content column. |
| `--bs-title-screen-panel-padding-x` | `2rem` | Horizontal padding of the content panel. |
| `--bs-title-screen-panel-padding-y` | `3rem` | Vertical padding of the content panel. |
| `--bs-title-screen-panel-gap` | `1.25rem` | Gap between panel items. |
| `--bs-title-screen-eyebrow-color` | `var(--tc-cyan, #22d3ee)` | Eyebrow micro-label colour (cyan accent). |
| `--bs-title-screen-eyebrow-size` | `10.5px` | Eyebrow font size (JetBrains Mono). |
| `--bs-title-screen-title-color` | `var(--tc-text)` | Title heading colour. |
| `--bs-title-screen-title-size` | `2rem` | Title heading font size. |
| `--bs-title-screen-title-weight` | `700` | Title heading font weight. |
| `--bs-title-screen-divider-color` | `var(--tc-border)` | Hairline divider colour. |
| `--bs-title-screen-subtitle-color` | `var(--tc-text-muted)` | Subtitle text colour. |
| `--bs-title-screen-subtitle-size` | `0.9375rem` | Subtitle font size. |

```html
<!-- Eyebrow only -->
<tc-title-screen></tc-title-screen>

<!-- Title + default eyebrow -->
<tc-title-screen title-text="Realm of Ash"></tc-title-screen>

<!-- Full configuration -->
<tc-title-screen
    eyebrow="Press Start"
    title-text="Realm of Ash"
    subtitle="A world on the edge of ruin.">
</tc-title-screen>

<!-- Custom eyebrow for attract / credits screens -->
<tc-title-screen
    eyebrow="Click anywhere to begin"
    title-text="The Last Siege"
    subtitle="An epic strategy experience.">
</tc-title-screen>

<script>
    const screen = document.querySelector('tc-title-screen')
    // Override via JS property
    screen.titleText = 'New Game +'
    screen.subtitle  = 'All content unlocked.'
</script>
```

---