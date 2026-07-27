---
component: tc-battle-pass
---

### tc-battle-pass

Battle-pass tier track with a season header, an XP progress bar, and a two-row reward track (premium / free) of claimable reward cells. Styled to the toolcase design system (sharp corners, slate neutrals, and lucide lock glyphs in place of emoji). Tiers are supplied via the `tiers` JS property; everything else is attribute-driven. Reward state per cell is derived: `claimed` cells fill with ink and a check glyph, `claimable` cells are interactive buttons (free → ink accent border, premium → cyan accent border), `locked` cells (level above the current level) and `gated` premium cells (no premium pass) recede via opacity and show a lock glyph. Only claimable cells are interactive; clicking one fires `tc-claim`.

**Tag:** `tc-battle-pass`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current-level` | `number` | `1` | The player's current tier level. Tiers at or below it are unlocked; tiers above it are locked. |
| `current-xp` | `number` | `0` | XP accrued toward the current tier. Drives the progress bar against the current tier's `xpRequired`. |
| `season-name` | `string` | — | Season title shown in the header (Inter 600). Omitted when absent. |
| `season-end` | `string` | — | Free-form end label shown as `Ends {value}` in the header (mono). Omitted when absent. |
| `has-premium` | boolean | absent | When present, the premium track is unlocked — premium rewards become claimable/claimed instead of gated. |

The host receives `role="group"` automatically (unless an explicit `role` is already set).

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tiers` | `BattlePassTier[]` | `[]` | Array of tier descriptors (see shape below). Re-renders on each set; the getter returns a copy. |
| `currentLevel` | `number` | `1` | Reflects the `current-level` attribute. |
| `currentXp` | `number` | `0` | Reflects the `current-xp` attribute. |
| `seasonName` | `string` | `''` | Reflects the `season-name` attribute. |
| `seasonEnd` | `string` | `''` | Reflects the `season-end` attribute. |
| `hasPremium` | `boolean` | `false` | Reflects the `has-premium` attribute. |
| `onClaim` | `((detail: { level: number, track: 'free' \| 'premium' }) => void) \| null` | `null` | Optional callback fired alongside the `tc-claim` event. |

**BattlePassTier shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | `number` | yes | Tier level. Matched against `current-level` to derive locked/current state; shown in the central marker. |
| `xpRequired` | `number` | yes | XP needed to complete this tier. The current tier's value is the progress-bar denominator. |
| `free` | `BattlePassReward` | no | Reward on the free track. Omit to render an empty placeholder cell. |
| `premium` | `BattlePassReward` | no | Reward on the premium track. Omit to render an empty placeholder cell. |

**BattlePassReward shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | `string` | yes | Reward label shown beside the glyph. |
| `icon` | `string` | no | Lucide icon name (kebab-case or PascalCase, e.g. `"coins"` or `"Coins"`), rendered as inline SVG. Falls back to a state glyph: `gift` (claimable), `check` (claimed), `lock` (locked/gated). |
| `claimed` | `boolean` | no | When true, the cell renders as already-claimed (ink fill, check glyph, non-interactive). |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-claim` | `{ level: number, track: 'free' \| 'premium' }` | Fired when a claimable reward cell is clicked. Bubbles and is composed. The `onClaim` callback fires with the same detail. |

**Slots**

None. All content is supplied via attributes and the `tiers` JS property.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-battle-pass-bg` | `var(--tc-surface)` | Card background. |
| `--bs-battle-pass-border-color` | `var(--tc-border)` | Outer 1px hairline frame color. |
| `--bs-battle-pass-shadow` | `var(--tc-shadow-sm)` | Resting card shadow. |
| `--bs-battle-pass-padding` | `1rem` | Card inner padding. |
| `--bs-battle-pass-gap` | `1rem` | Gap between header, progress, and track sections. |
| `--bs-battle-pass-eyebrow-color` | `var(--tc-text-faint)` | "Battle Pass" eyebrow color. |
| `--bs-battle-pass-eyebrow-font-size` | `0.6875rem` | Eyebrow font size. |
| `--bs-battle-pass-season-color` | `var(--tc-text)` | Season title color. |
| `--bs-battle-pass-season-font-size` | `1.0625rem` | Season title font size. |
| `--bs-battle-pass-season-font-weight` | `600` | Season title font weight. |
| `--bs-battle-pass-end-color` | `var(--tc-text-muted)` | "Ends …" label color. |
| `--bs-battle-pass-end-font-size` | `0.6875rem` | "Ends …" label font size. |
| `--bs-battle-pass-premium-bg` | `var(--tc-accent)` | Premium badge background (cyan). |
| `--bs-battle-pass-premium-color` | `#fff` | Premium badge text color. |
| `--bs-battle-pass-premium-font-size` | `0.625rem` | Premium badge font size. |
| `--bs-battle-pass-level-color` | `var(--tc-text)` | "Level N" label color. |
| `--bs-battle-pass-level-font-size` | `0.75rem` | "Level N" label font size. |
| `--bs-battle-pass-bar-bg` | `var(--tc-slate-200)` | Progress track background. |
| `--bs-battle-pass-bar-fill` | `var(--tc-app-accent)` | Progress fill color (ink). |
| `--bs-battle-pass-bar-height` | `0.5rem` | Progress bar height. |
| `--bs-battle-pass-xp-color` | `var(--tc-text-muted)` | XP count color. |
| `--bs-battle-pass-xp-font-size` | `0.6875rem` | XP count font size. |
| `--bs-battle-pass-track-label-color` | `var(--tc-text-faint)` | Premium/Free track-label color. |
| `--bs-battle-pass-track-label-font-size` | `0.625rem` | Track-label font size. |
| `--bs-battle-pass-tier-gap` | `0.5rem` | Gap between tiers and between cells in a tier row. |
| `--bs-battle-pass-tier-current-bg` | `rgba(30,41,59,0.04)` | Faint well behind the current tier row. |
| `--bs-battle-pass-tier-current-marker` | `var(--tc-app-accent)` | Left ink marker on the current tier row. |
| `--bs-battle-pass-level-marker-size` | `1.75rem` | Width/height of the central tier-level marker. |
| `--bs-battle-pass-level-marker-bg` | `var(--tc-surface-muted)` | Tier-level marker background. |
| `--bs-battle-pass-level-marker-border-color` | `var(--tc-border)` | Tier-level marker border color. |
| `--bs-battle-pass-level-marker-color` | `var(--tc-text-muted)` | Tier-level marker text color. |
| `--bs-battle-pass-level-marker-current-bg` | `var(--tc-app-accent)` | Current tier-level marker background (ink). |
| `--bs-battle-pass-level-marker-current-color` | `#fff` | Current tier-level marker text color. |
| `--bs-battle-pass-cell-min-width` | `6.5rem` | Minimum width of each reward cell. |
| `--bs-battle-pass-cell-bg` | `var(--tc-surface)` | Reward cell background. |
| `--bs-battle-pass-cell-border-color` | `var(--tc-border)` | Reward cell border color. |
| `--bs-battle-pass-cell-color` | `var(--tc-text)` | Reward cell text color. |
| `--bs-battle-pass-cell-icon-size` | `1.125rem` | Reward cell glyph size. |
| `--bs-battle-pass-cell-label-font-size` | `0.75rem` | Reward cell label font size. |
| `--bs-battle-pass-cell-claimable-border-color` | `var(--tc-app-accent)` | Border color of a claimable free cell (ink). |
| `--bs-battle-pass-cell-premium-border-color` | `var(--tc-accent)` | Border color of a claimable premium cell (cyan). |
| `--bs-battle-pass-cell-claimed-bg` | `var(--tc-app-accent)` | Background of a claimed cell (ink). |
| `--bs-battle-pass-cell-claimed-color` | `#fff` | Text color of a claimed cell. |
| `--bs-battle-pass-cell-locked-opacity` | `0.5` | Opacity applied to locked/gated cells. |
| `--bs-battle-pass-cell-empty-bg` | `var(--tc-surface-hover)` | Empty-slot placeholder background. |
| `--bs-battle-pass-cell-empty-border-color` | `var(--tc-border)` | Empty-slot placeholder border color. |

```html
<tc-battle-pass id="pass" season-name="Season of Embers" season-end="2 weeks"
    current-level="5" current-xp="640" has-premium></tc-battle-pass>

<script>
const el = document.getElementById('pass')
el.tiers = Array.from({ length: 8 }, (_, i) => {
    const level = i + 1
    return {
        level,
        xpRequired: 1000,
        free: { label: `${level * 100} XP`, icon: 'star', claimed: level < 3 },
        premium: { label: level % 3 === 0 ? 'Skin' : 'Gold', icon: level % 3 === 0 ? 'shirt' : 'coins', claimed: level < 2 },
    }
})
el.addEventListener('tc-claim', e => {
    console.log('claimed', e.detail.level, e.detail.track)
})
</script>
```

---