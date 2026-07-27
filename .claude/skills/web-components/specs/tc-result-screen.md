---
component: tc-result-screen
---

### tc-result-screen

Match / round result screen: a centred region with a mono uppercase eyebrow, a status-toned title, a short hairline divider, an optional subtitle, a column of hairline-separated stat rows, a soft reward strip, and a wrapped row of action buttons. Stats, rewards, and actions are supplied via JS properties; the title text/colour, subtitle, and eyebrow are attributes. Clicking an action fires `tc-action` with that action's `id`. Styled to the toolcase design system — flat slate surface, hairline borders, sharp corners, mono machine-facing text, and `.btn` action primitives.

**Tag:** `tc-result-screen`

**Preset aliases:** `tc-game-over-screen` (variant `defeat` — "Game Over" / danger) and `tc-victory-screen` (variant `victory` — "Victory!" / gold) are aliases of `tc-result-screen` that infer the variant from the tag name. Everything below applies identically.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `neutral\|defeat\|victory` | `neutral` (per tag) | Seeds the `title-text` / `title-color` / `eyebrow` defaults. `defeat` → "Game Over" / danger / "Defeat"; `victory` → "Victory!" / gold / "Triumph"; `neutral` → "" / gold / "Result". The alias tags default this from their tag name. |
| `title-text` | string | (per variant) | The large title heading |
| `subtitle` | string | — | Optional supporting line under the divider |
| `title-color` | `gold\|danger\|parch` | (per variant) | Status tone of the title (`gold` → warning ramp, `danger` → danger ramp, `parch` → neutral slate) |
| `eyebrow` | string | (per variant) | The mono uppercase micro-label above the title |

The host element automatically gains `role="region"` (unless one is already set).

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `stats` | `ResultStat[]` | Stat rows (set via JS, not attribute); setting re-renders |
| `rewards` | `ResultReward[]` | Reward chips shown in the reward strip |
| `actions` | `ResultAction[]` | Action buttons rendered at the bottom |
| `variant` | `neutral\|defeat\|victory` | Mirror of the `variant` attribute |
| `titleText` | string | Mirror of the `title-text` attribute |
| `subtitle` | string | Mirror of the `subtitle` attribute |
| `titleColor` | `gold\|danger\|parch` | Mirror of the `title-color` attribute |
| `eyebrow` | string | Mirror of the `eyebrow` attribute |
| `onAction` | `((id: string) => void) \| null` | Optional callback fired alongside `tc-action` |

Each `ResultStat`:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Stat name |
| `value` | string \| number | Stat value (numbers are locale-formatted) |

Each `ResultReward`:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Reward name |
| `glyph` | string? | Short symbol/initials shown before the label (rendered as text, `aria-hidden`) |
| `amount` | number \| string? | Optional amount shown after the label (numbers are locale-formatted) |
| `color` | string? | Optional CSS colour applied to the glyph |

Each `ResultAction`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique key emitted in the `tc-action` `detail` |
| `label` | string | Button text |
| `variant` | `default\|primary\|danger\|ghost`? | Button style (`default` → secondary, `primary` → ink, `danger` → danger, `ghost` → outline) |

**Events**

| Event | `detail` | Fired when |
|-------|----------|------------|
| `tc-action` | `{ id: string }` | An action button is clicked |

**Slots:** none — the eyebrow, title, subtitle, stats, rewards, and actions are all generated from attributes / JS properties.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-result-screen-max-width` | `32rem` | Max width of the centred panel |
| `--bs-result-screen-padding` | `2rem` | Panel inner padding |
| `--bs-result-screen-gap` | `1rem` | Vertical gap between sections |
| `--bs-result-screen-bg` | `var(--tc-surface)` | Panel background |
| `--bs-result-screen-border-color` | `var(--tc-border)` | 1px hairline frame color |
| `--bs-result-screen-shadow` | `var(--tc-shadow-sm)` | Panel drop shadow |
| `--bs-result-screen-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow text color |
| `--bs-result-screen-eyebrow-size` | `0.6875rem` | Eyebrow font size |
| `--bs-result-screen-eyebrow-spacing` | `0.12em` | Eyebrow letter-spacing |
| `--bs-result-screen-title-size` | `2rem` | Title font size |
| `--bs-result-screen-title-weight` | `600` | Title font weight |
| `--bs-result-screen-title-color` | `var(--tc-warning)` | Title color (overridden by `data-title-color`) |
| `--bs-result-screen-divider-color` | `var(--tc-border)` | Hairline divider color |
| `--bs-result-screen-divider-width` | `2.5rem` | Hairline divider width |
| `--bs-result-screen-subtitle-color` | `var(--tc-text-muted)` | Subtitle text color |
| `--bs-result-screen-subtitle-size` | `0.9375rem` | Subtitle font size |
| `--bs-result-screen-stat-border-color` | `var(--tc-border)` | Stat row separator color |
| `--bs-result-screen-stat-label-color` | `var(--tc-text-muted)` | Stat label text color |
| `--bs-result-screen-stat-value-color` | `var(--tc-text)` | Stat value text color |
| `--bs-result-screen-rewards-bg` | `var(--tc-surface-muted)` | Rewards strip background |
| `--bs-result-screen-rewards-border-color` | `var(--tc-border)` | Rewards strip 1px border |
| `--bs-result-screen-reward-label-color` | `var(--tc-text)` | Reward label color |
| `--bs-result-screen-reward-amount-color` | `var(--tc-text-muted)` | Reward amount color |
| `--bs-result-screen-reward-glyph-color` | `var(--tc-text)` | Reward glyph color |

```html
<tc-result-screen id="result" title-text="Round Complete" subtitle="A clean run through the cinder gates."></tc-result-screen>
<script>
const el = document.getElementById('result')
el.stats = [
    { label: 'Time', value: '14:32' },
    { label: 'Score', value: 18450 },
    { label: 'Accuracy', value: '87%' },
]
el.rewards = [
    { glyph: '◈', label: 'Gold', amount: 1200, color: 'var(--tc-warning)' },
    { glyph: '✦', label: 'Sigil', amount: 3 },
]
el.actions = [
    { id: 'continue', label: 'Continue', variant: 'primary' },
    { id: 'replay', label: 'Replay' },
    { id: 'menu', label: 'Main Menu', variant: 'ghost' },
]
el.addEventListener('tc-action', e => console.log('action', e.detail.id))
</script>
```

---