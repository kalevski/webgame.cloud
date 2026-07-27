---
component: tc-section-flag
---

### tc-section-flag

Section header with a slate-ink accent marker bar, a title (rendered as an `<h2>` heading), and an optional subtitle. Supports left (default) and center alignment. All cosmetics are overridable via `--bs-section-flag-*` custom properties.

**Tag:** `tc-section-flag`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | `''` | Section heading text (HTML-escaped, rendered as `<h2>`) |
| `subtitle` | string | — | Optional secondary line below the title. Omitted when absent |
| `align` | `left\|center` | `left` | Text alignment; `center` repositions the marker as a horizontal bar above the text |

**JS Properties**

All three attributes are reflected as JS properties with the same names (`title`, `subtitle`, `align`).

**Events**

None. `tc-section-flag` is a purely presentational element.

**Slots**

None. Title and subtitle come from attributes only.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-section-flag-marker-color` | `var(--tc-app-accent)` | Accent bar color (slate-ink) |
| `--bs-section-flag-marker-width` | `3px` | Thickness of the accent bar |
| `--bs-section-flag-marker-height` | `1.25rem` | Length of the accent bar |
| `--bs-section-flag-gap` | `0.625rem` | Gap between marker and text block |
| `--bs-section-flag-title-size` | `1.1rem` | Title font size |
| `--bs-section-flag-title-weight` | `600` | Title font weight |
| `--bs-section-flag-title-color` | `var(--tc-text)` | Title text color |
| `--bs-section-flag-subtitle-size` | `0.875rem` | Subtitle font size |
| `--bs-section-flag-subtitle-color` | `var(--tc-text-muted)` | Subtitle text color |

```html
<!-- Left aligned (default) with subtitle -->
<tc-section-flag title="The Hall — ranked" subtitle="Top of the rolling 90-day board."></tc-section-flag>

<!-- Left aligned — title only -->
<tc-section-flag title="Points · continuous · never paused"></tc-section-flag>

<!-- Center aligned with subtitle -->
<tc-section-flag align="center" title="3 Briefs · rolled for Sprint 047" subtitle="Seeded RNG drew one easy + one medium + one hard from the master pool."></tc-section-flag>

<!-- Center aligned — title only -->
<tc-section-flag align="center" title="Season 4 — Leaderboard"></tc-section-flag>
```

---