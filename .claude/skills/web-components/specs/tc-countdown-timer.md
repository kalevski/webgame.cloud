---
component: tc-countdown-timer
---

### tc-countdown-timer

Counts down to a target date/time in configurable units (days, hours, minutes, seconds). Visibility-aware: pauses ticking when the tab is hidden and immediately recomputes on resume. Fires a `tc-expire` CustomEvent once when the remaining time reaches zero.

**Tag:** `tc-countdown-timer`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `target` | string | — | Deadline as a millisecond epoch integer or an ISO 8601 date string (e.g. `"2026-12-31T23:59:59Z"`). Required for any countdown to show. |
| `units` | string | `"days,hours,minutes,seconds"` | Comma-separated subset of units to display, in display order. Valid values: `days`, `hours`, `minutes`, `seconds`. Unrecognised values are ignored. |
| `label` | string | — | Optional heading shown above the unit cells (e.g. `"Launch in"`). Rendered as text — no HTML. |
| `sub-label` | string | — | Optional caption shown below the unit cells. Rendered as text — no HTML. |
| `compact` | boolean | `false` | Renders units inline separated by `:` colons with smaller values and no per-unit tile labels. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `target` | `Date \| number` | `0` | Deadline as a `Date` object or a millisecond epoch number. Setting re-initialises the interval. |
| `units` | `CountdownUnit[]` | `['days','hours','minutes','seconds']` | Array controlling which units are displayed and in what order. Setting re-renders. |
| `label` | `string \| null` | `null` | Reflects the `label` attribute. |
| `subLabel` | `string \| null` | `null` | Reflects the `sub-label` attribute. |
| `compact` | `boolean` | `false` | Reflects the `compact` attribute. |
| `onexpire` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-expire` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-expire` | `{}` | Dispatched once when remaining time reaches zero. `bubbles: true`, `composed: true`. |

**Slots**

None. `tc-countdown-timer` is a purely attribute/property-driven component.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-countdown-timer-gap` | `0.5rem` | Gap between unit cells in normal mode. |
| `--bs-countdown-timer-label-color` | `var(--tc-text-muted)` | Color of the optional `label` text. |
| `--bs-countdown-timer-label-font-size` | `0.6875rem` | Font size of the label. |
| `--bs-countdown-timer-label-letter-spacing` | `0.08em` | Letter-spacing of the label. |
| `--bs-countdown-timer-unit-bg` | `var(--tc-surface)` | Background of each unit cell. |
| `--bs-countdown-timer-unit-border` | `var(--tc-border)` | 1px border color of each unit cell. |
| `--bs-countdown-timer-unit-padding-x` | `0.875rem` | Horizontal padding inside unit cells. |
| `--bs-countdown-timer-unit-padding-y` | `0.75rem` | Vertical padding inside unit cells. |
| `--bs-countdown-timer-unit-min-width` | `3.5rem` | Minimum width for each unit cell. |
| `--bs-countdown-timer-value-color` | `var(--tc-text)` | Color of the countdown digit. |
| `--bs-countdown-timer-value-font-size` | `2rem` | Font size of the countdown digit (normal mode). |
| `--bs-countdown-timer-value-font-weight` | `600` | Font weight of the countdown digit. |
| `--bs-countdown-timer-unit-label-color` | `var(--tc-text-muted)` | Color of the DAYS/HRS/MIN/SEC micro-label. |
| `--bs-countdown-timer-unit-label-font-size` | `0.625rem` | Font size of the unit micro-label. |
| `--bs-countdown-timer-unit-label-letter-spacing` | `0.1em` | Letter-spacing of the unit micro-label. |
| `--bs-countdown-timer-sub-color` | `var(--tc-text-muted)` | Color of the optional `sub-label`. |
| `--bs-countdown-timer-sub-font-size` | `0.75rem` | Font size of the `sub-label`. |
| `--bs-countdown-timer-compact-value-font-size` | `1.25rem` | Digit font size in compact mode. |
| `--bs-countdown-timer-sep-color` | `var(--tc-text-muted)` | Color of the `:` separator in compact mode. |

```html
<!-- Standard countdown with label and sub-label -->
<tc-countdown-timer
  target="2026-12-31T23:59:59Z"
  label="New year in"
  sub-label="UTC midnight"
></tc-countdown-timer>

<!-- Compact mode — inline with colon separators -->
<tc-countdown-timer
  target="2026-12-31T23:59:59Z"
  compact
  label="Expires"
></tc-countdown-timer>

<!-- Custom units via attribute (hours and minutes only) -->
<tc-countdown-timer
  target="2026-12-31T23:59:59Z"
  units="hours,minutes"
></tc-countdown-timer>

<!-- Custom units + expire event via JS -->
<tc-countdown-timer id="ct"></tc-countdown-timer>
<script>
  const el = document.getElementById('ct')
  el.units = ['hours', 'minutes', 'seconds']
  el.target = new Date(Date.now() + 3600 * 1000) // 1 hour from now
  el.addEventListener('tc-expire', () => console.log('Countdown finished!'))
</script>
```

---