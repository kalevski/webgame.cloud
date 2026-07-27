---
component: tc-matchmaking-screen
---

### tc-matchmaking-screen

Matchmaking / searching status panel with a state indicator ring, eyebrow + title header, optional meta strip (Mode, Region, Elapsed, ETA), and accept/cancel action buttons. Styled to the toolcase design system: slate surface, sharp panel, 1px hairline borders, JetBrains Mono for machine-facing meta values, ink accent for the primary Accept action. The slate neutral ramp carries the panel. All cosmetics flow through `--bs-matchmaking-screen-*` custom properties.

**Tag:** `tc-matchmaking-screen`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | `'idle' \| 'searching' \| 'connecting' \| 'found' \| 'failed'` | `'idle'` | Current matchmaking state. Controls the ring icon, eyebrow, title, meta rows, and which action buttons appear. Invalid values fall back to `'idle'`. |
| `elapsed` | number | `0` | Seconds elapsed since matchmaking started. Shown as `M:SS` in the meta strip when `state` is `searching` or `connecting`. |
| `estimated` | number | `0` | Estimated total wait time in seconds. Shown as `M:SS` ETA when > 0 and `state` is `searching` or `connecting`. |
| `region` | string | `''` | Region label (e.g. `"EU-West"`). Shown in the meta strip when non-empty. Omit to hide the Region cell. |
| `mode` | string | `''` | Game mode label (e.g. `"3v3 Ranked"`). Shown in the meta strip when non-empty. Omit to hide the Mode cell. |
| `found-label` | string | `'Match Found'` | Title shown when `state="found"`. Override for localisation or custom copy. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `state` | `MatchmakingScreenState` | `'idle'` | Reflects the `state` attribute. |
| `elapsed` | `number` | `0` | Reflects the `elapsed` attribute. |
| `estimated` | `number` | `0` | Reflects the `estimated` attribute. |
| `region` | `string` | `''` | Reflects the `region` attribute. |
| `mode` | `string` | `''` | Reflects the `mode` attribute. |
| `foundLabel` | `string` | `'Match Found'` | Reflects the `found-label` attribute. |
| `onAccept` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-accept`. |
| `onCancel` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-cancel`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-accept` | `{}` | Fired when the Accept button is clicked (only shown when `state="found"`). Bubbles and is composed. |
| `tc-cancel` | `{}` | Fired when the Cancel button (or Decline / Close) is clicked. Bubbles and is composed. |

**Slots**

`tc-matchmaking-screen` has no slots. All content is driven by attributes and JS properties.

**State → UI mapping**

| `state` | Ring | Eyebrow | Title | Meta | Buttons |
|---------|------|---------|-------|------|---------|
| `idle` | static dot | Matchmaking | Idle | none | none |
| `searching` | spinning arc (accent) | Matchmaking | Searching for Match | Mode, Region, Elapsed, ETA | Cancel |
| `connecting` | spinning arc (accent) | Joining | Connecting | Mode, Region, Elapsed, ETA | Cancel |
| `found` | check circle (success green) | Ready | `found-label` value | Mode, Region | Accept + Decline |
| `failed` | × circle (danger red) | Error | Match Failed | Mode, Region | Close |

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-matchmaking-screen-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-matchmaking-screen-border` | `var(--tc-border)` | Outer 1px hairline border. |
| `--bs-matchmaking-screen-max-width` | `380px` | Maximum panel width. |
| `--bs-matchmaking-screen-padding-x` | `1.5rem` | Horizontal padding. |
| `--bs-matchmaking-screen-padding-y` | `2rem` | Vertical padding. |
| `--bs-matchmaking-screen-gap` | `1.25rem` | Gap between panel sections. |
| `--bs-matchmaking-screen-ring-size` | `4rem` | Diameter of the state indicator ring (sanctioned circle). |
| `--bs-matchmaking-screen-ring-border` | `var(--tc-border)` | Idle ring border colour. |
| `--bs-matchmaking-screen-ring-color` | `var(--tc-text-muted)` | Idle ring icon colour. |
| `--bs-matchmaking-screen-ring-spin-color` | `var(--tc-app-accent)` | Ring border + icon colour when searching or connecting. |
| `--bs-matchmaking-screen-ring-found-border` | `var(--tc-success)` | Ring border colour when `state="found"`. |
| `--bs-matchmaking-screen-ring-found-color` | `var(--tc-success)` | Check icon colour when `state="found"`. |
| `--bs-matchmaking-screen-ring-failed-border` | `var(--tc-danger)` | Ring border colour when `state="failed"`. |
| `--bs-matchmaking-screen-ring-failed-color` | `var(--tc-danger)` | × icon colour when `state="failed"`. |
| `--bs-matchmaking-screen-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow label colour. |
| `--bs-matchmaking-screen-eyebrow-size` | `10.5px` | Eyebrow font size. |
| `--bs-matchmaking-screen-title-color` | `var(--tc-text)` | Title colour. |
| `--bs-matchmaking-screen-title-size` | `1.0625rem` | Title font size. |
| `--bs-matchmaking-screen-title-weight` | `600` | Title font weight. |
| `--bs-matchmaking-screen-meta-bg` | `var(--tc-surface-muted)` | Meta strip background. |
| `--bs-matchmaking-screen-meta-border` | `var(--tc-border)` | Meta strip cell dividers. |
| `--bs-matchmaking-screen-meta-key-color` | `var(--tc-text-faint)` | Meta key label colour. |
| `--bs-matchmaking-screen-meta-val-color` | `var(--tc-text)` | Meta value colour. |
| `--bs-matchmaking-screen-btn-bg` | `var(--tc-surface)` | Default button background. |
| `--bs-matchmaking-screen-btn-color` | `var(--tc-text)` | Default button text colour. |
| `--bs-matchmaking-screen-btn-border` | `var(--tc-border)` | Default button border colour. |
| `--bs-matchmaking-screen-btn-hover-bg` | `var(--tc-surface-hover, var(--tc-surface-muted))` | Button hover background. |
| `--bs-matchmaking-screen-btn-accept-bg` | `var(--tc-app-accent)` | Accept button fill (ink). |
| `--bs-matchmaking-screen-btn-accept-color` | `#fff` | Accept button text colour. |
| `--bs-matchmaking-screen-btn-min-height` | `2.25rem` | Button minimum height (44 px under coarse pointer). |

**Example**

```html
<tc-matchmaking-screen
    id="mm"
    state="searching"
    elapsed="12"
    estimated="45"
    mode="3v3 Ranked"
    region="EU-West"
></tc-matchmaking-screen>

<script>
    const mm = document.getElementById('mm')

    mm.addEventListener('tc-accept', () => {
        console.log('match accepted')
    })

    mm.addEventListener('tc-cancel', () => {
        mm.state = 'idle'
    })

    // Simulate state transitions
    setTimeout(() => { mm.state = 'connecting' }, 4000)
    setTimeout(() => { mm.state = 'found' }, 7000)
</script>
```

---