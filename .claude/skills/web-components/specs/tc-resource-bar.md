---
component: tc-resource-bar
---

### tc-resource-bar

Value/max resource bar for a game HUD (HP, mana, stamina, …) — an ink fill over a flat slate track. Optionally renders a label row (a human-readable label plus a mono `value / max` readout), a ghost band behind the fill for recent loss, inline mono text inside the track, and evenly-spaced segment dividers. Purely presentational, no events, no slots. The fill is clamped to `[0, max]`. The `variant` attribute selects the fill color. The track / fill / ghost / tick DOM is shared across the resource-bar family through an internal helper. Renders as a flat slate HUD bar.

**Tag:** `tc-resource-bar`

**Preset aliases:** `tc-health-bar` (variant `health`, ink accent), `tc-mana-bar` (variant `mana`, cyan), `tc-stamina-bar` (variant `stamina`, green) are aliases of `tc-resource-bar` that default `variant` from their tag name. Use them as drop-in shorthands; everything below applies identically.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | number | `0` | Current value. Clamped to `[0, max]` for the fill width and `aria-valuenow`. Non-numeric values fall back to `0`. |
| `max` | number | `100` | Maximum value. Values `<= 0` (or non-numeric) fall back to `100`. |
| `ghost` | number | — | Optional "ghost" / recent-loss value drawn as a muted band behind the fill. Only shown when it resolves to a wider band than the current fill. |
| `segments` | number | `1` | Number of equal slots; `segments - 1` evenly-spaced divider ticks are drawn across the track. Values `< 1` (or non-numeric) fall back to `1`. |
| `show-text` | boolean | `false` | When present (and no `label` is set), draws a centred mono `value / max` readout inside the track. |
| `label` | string | `""` | When set, renders a label row above the track with the label and a trailing mono `value / max` readout. Also used as the `aria-label` for the progressbar (defaults to the variant name, or `"Resource"`). |
| `variant` | `health` \| `mana` \| `stamina` \| string | — | Selects the fill-color modifier. Known variants get a built-in fill (`health`/ink, `mana`/cyan, `stamina`/green); a custom variant is themable via `--bs-resource-bar-fill-bg`. The preset alias tags default this from their tag name. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Reflects the `value` attribute. |
| `max` | `number` | Reflects the `max` attribute. |
| `ghost` | `number \| null` | Reflects the `ghost` attribute; set to `null` to remove it. |
| `segments` | `number` | Reflects the `segments` attribute. |
| `showText` | `boolean` | Reflects the `show-text` boolean attribute. |
| `label` | `string` | Reflects the `label` attribute. |
| `variant` | `string` | Reflects the `variant` attribute. |

**Events**

None. `tc-resource-bar` is a purely presentational element.

**Slots**

None. `tc-resource-bar` is attribute-driven.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-resource-bar-gap` | `0.375rem` | Gap between the label row and the track. |
| `--bs-resource-bar-label-color` | `var(--tc-text)` | Label text color. |
| `--bs-resource-bar-label-font-size` | `0.8125rem` | Label font size. |
| `--bs-resource-bar-label-font-weight` | `500` | Label font weight (≤600). |
| `--bs-resource-bar-value-color` | `var(--tc-text-muted)` | `value / max` readout color. |
| `--bs-resource-bar-value-font-size` | `0.75rem` | `value / max` readout font size. |
| `--bs-resource-bar-track-bg` | `var(--tc-slate-200)` | Track background. |
| `--bs-resource-bar-track-height` | `0.625rem` | Track height. |
| `--bs-resource-bar-fill-bg` | `var(--tc-app-accent)` | Value-fill color. Overridden per variant (`--mana` → `--tc-accent`, `--stamina` → `--tc-success`); set directly for a custom variant. |
| `--bs-resource-bar-fill-transition` | `width var(--tc-transition-base)` | Fill-width transition (disabled under reduced motion). |
| `--bs-resource-bar-ghost-bg` | `var(--tc-slate-400)` | Ghost / recent-loss band color. |
| `--bs-resource-bar-tick-color` | `var(--tc-surface)` | Segment-divider color. |
| `--bs-resource-bar-inline-text-color` | `var(--tc-text-muted)` | Inline `value / max` text color. |

**Example**

```html
<!-- Variants -->
<tc-resource-bar variant="health" label="Health" value="72" max="100"></tc-resource-bar>
<tc-resource-bar variant="mana" label="Mana" value="60" max="100"></tc-resource-bar>
<tc-resource-bar variant="stamina" label="Stamina" value="45" max="100"></tc-resource-bar>

<!-- Preset alias tags (variant inferred from the tag name) -->
<tc-health-bar label="HP" value="640" max="1000"></tc-health-bar>
<tc-mana-bar value="30" max="100" show-text></tc-mana-bar>

<!-- Ghost band + segments -->
<tc-resource-bar label="Shield" value="3" max="4" segments="4" ghost="4"></tc-resource-bar>
```

---