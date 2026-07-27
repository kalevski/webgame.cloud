---
component: tc-boss-bar
---

### tc-boss-bar

Wide top-of-screen boss health bar — a boss name, an optional epithet, a phase indicator, an ink health fill over a flat slate track, and a mono `hp / hp-max` readout. Purely presentational, no events, no slots. The health fill is clamped to `[0, hp-max]`. Phase boundaries can be marked with thin vertical ticks via the `phaseTicks` JS property. Renders as a flat slate HUD panel; the track / fill / tick DOM is shared with the rest of the resource-bar family through an internal helper.

**Tag:** `tc-boss-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `""` | Boss name, rendered as the leading heading. |
| `epithet` | string | `""` | Optional descriptor shown in muted slate next to the name. |
| `phase` | number | `1` | Current phase, rendered as a `Phase N` mono micro-label. Non-numeric values fall back to `1`. |
| `hp` | number | `0` | Current health. Clamped to `[0, hp-max]` for the fill width and `aria-valuenow`. |
| `hp-max` | number | `100` | Maximum health. Values `<= 0` (or non-numeric) fall back to `100`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Reflects the `name` attribute. |
| `epithet` | `string` | Reflects the `epithet` attribute. |
| `phase` | `number` | Reflects the `phase` attribute. |
| `hp` | `number` | Reflects the `hp` attribute. |
| `hpMax` | `number` | Reflects the `hp-max` attribute. |
| `phaseTicks` | `number[]` | Phase-boundary marker positions as fractions in the open interval `(0, 1)`. Values outside that range are ignored. Set as a JS property (not an attribute); re-renders the bar. |

**Events**

None. `tc-boss-bar` is a purely presentational element.

**Slots**

None. `tc-boss-bar` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-boss-bar-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-boss-bar-border-color` | `var(--tc-border)` | 1px hairline border color. |
| `--bs-boss-bar-shadow` | `none` | Panel box shadow (flat by default). |
| `--bs-boss-bar-padding-y` | `0.625rem` | Vertical inner padding. |
| `--bs-boss-bar-padding-x` | `0.875rem` | Horizontal inner padding. |
| `--bs-boss-bar-gap` | `0.5rem` | Gap between header, track, and numeric readout. |
| `--bs-boss-bar-name-color` | `var(--tc-text)` | Boss-name color. |
| `--bs-boss-bar-name-font-size` | `0.95rem` | Boss-name font size. |
| `--bs-boss-bar-name-font-weight` | `600` | Boss-name font weight (≤600). |
| `--bs-boss-bar-epithet-color` | `var(--tc-text-muted)` | Epithet color. |
| `--bs-boss-bar-epithet-font-size` | `0.8125rem` | Epithet font size. |
| `--bs-boss-bar-phase-color` | `var(--tc-text-muted)` | Phase micro-label color. |
| `--bs-boss-bar-phase-font-size` | `0.6875rem` | Phase micro-label font size. |
| `--bs-boss-bar-phase-letter-spacing` | `0.12em` | Phase micro-label letter spacing. |
| `--bs-boss-bar-track-bg` | `var(--tc-slate-200)` | Health-track background. |
| `--bs-boss-bar-track-height` | `0.625rem` | Health-track height. |
| `--bs-boss-bar-fill-bg` | `var(--tc-app-accent)` | Health-fill color (ink accent). |
| `--bs-boss-bar-fill-transition` | `width var(--tc-transition-base)` | Fill-width transition (disabled under reduced motion). |
| `--bs-boss-bar-ghost-bg` | `var(--tc-slate-400)` | Ghost / recent-damage band color (shared resource-bar contract). |
| `--bs-boss-bar-tick-color` | `var(--tc-surface)` | Phase-tick divider color. |
| `--bs-boss-bar-numeric-color` | `var(--tc-text-muted)` | `hp / hp-max` readout color. |
| `--bs-boss-bar-numeric-font-size` | `0.75rem` | `hp / hp-max` readout font size. |

**Example**

```html
<!-- Boss with epithet -->
<tc-boss-bar name="Malphas" epithet="the Devourer" phase="1" hp="820" hp-max="1000"></tc-boss-bar>

<!-- Later phase, lower health -->
<tc-boss-bar name="Vault Sentinel" phase="3" hp="180" hp-max="1000"></tc-boss-bar>

<!-- Phase-boundary ticks via the phaseTicks JS property -->
<tc-boss-bar id="boss" name="Hollow King" phase="2" hp="640" hp-max="1000"></tc-boss-bar>
<script>
    document.getElementById('boss').phaseTicks = [0.25, 0.5, 0.75]
</script>
```

---