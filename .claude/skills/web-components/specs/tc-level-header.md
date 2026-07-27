---
component: tc-level-header
---

### tc-level-header

Level / stage title header banner — a compact ink badge displaying the current level number, an optional title, a flat-slate XP progress bar with a `value / max XP` mono readout, and an optional next-unlock label. Purely presentational; no events, no slots. The XP fill is clamped to `[0, xp-max]`. Flat slate HUD aesthetics.

**Tag:** `tc-level-header`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | number | `1` | Current level shown in the ink badge. Non-numeric values fall back to `1`. |
| `title` | string | `""` | Optional character or stage title displayed above the XP bar. |
| `xp` | number | `0` | Current XP value. Clamped to `[0, xp-max]` for the fill and `aria-valuenow`. |
| `xp-max` | number | `100` | Maximum XP for this level. Values `<= 0` (or non-numeric) fall back to `100`. |
| `next-label` | string | `""` | Optional label for the next unlock (e.g. `"Mystic Blade"`), shown right-aligned in the meta row. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `level` | `number` | Reflects the `level` attribute. |
| `xp` | `number` | Reflects the `xp` attribute. |
| `xpMax` | `number` | Reflects the `xp-max` attribute. |
| `nextLabel` | `string` | Reflects the `next-label` attribute. |

**Events**

None. `tc-level-header` is a purely presentational element.

**Slots**

None. `tc-level-header` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-level-header-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-level-header-border-color` | `var(--tc-border)` | 1px hairline border color. |
| `--bs-level-header-padding-y` | `0.75rem` | Vertical inner padding. |
| `--bs-level-header-padding-x` | `1rem` | Horizontal inner padding. |
| `--bs-level-header-gap` | `0.75rem` | Gap between the badge and body. |
| `--bs-level-header-badge-bg` | `var(--tc-app-accent)` | Ink badge background. |
| `--bs-level-header-badge-color` | `#fff` | Badge text color. |
| `--bs-level-header-badge-size` | `3rem` | Badge square dimension. |
| `--bs-level-header-badge-label-size` | `0.5625rem` | "LVL" micro-label font size. |
| `--bs-level-header-badge-value-size` | `1.125rem` | Level number font size. |
| `--bs-level-header-badge-letter-spacing` | `0.1em` | Micro-label letter spacing. |
| `--bs-level-header-title-color` | `var(--tc-text)` | Title text color. |
| `--bs-level-header-title-font-size` | `0.9375rem` | Title font size. |
| `--bs-level-header-title-font-weight` | `600` | Title font weight (≤600). |
| `--bs-level-header-track-bg` | `var(--tc-slate-200)` | XP track background. |
| `--bs-level-header-track-height` | `0.5rem` | XP track height. |
| `--bs-level-header-fill-bg` | `var(--tc-app-accent)` | XP fill color. |
| `--bs-level-header-fill-transition` | `width var(--tc-transition-base)` | Fill-width transition (disabled under reduced motion). |
| `--bs-level-header-xp-color` | `var(--tc-text-muted)` | XP readout color. |
| `--bs-level-header-xp-font-size` | `0.75rem` | XP readout font size. |
| `--bs-level-header-next-color` | `var(--tc-text-faint)` | Next-unlock label color. |
| `--bs-level-header-next-font-size` | `0.75rem` | Next-unlock label font size. |

**Example**

```html
<!-- Minimal: level + XP bar -->
<tc-level-header level="1" xp="30" xp-max="100"></tc-level-header>

<!-- With character title -->
<tc-level-header level="12" title="Scout" xp="4200" xp-max="8000"></tc-level-header>

<!-- Full: title + next-unlock label -->
<tc-level-header level="42" title="Aldric of the Vale" xp="6480" xp-max="9000" next-label="Mystic Blade"></tc-level-header>

<!-- Update via JS properties -->
<tc-level-header id="hdr" level="5" xp="0" xp-max="1000"></tc-level-header>
<script>
    const hdr = document.getElementById('hdr')
    hdr.xp = 650
    hdr.nextLabel = 'Iron Shield'
</script>
```

---