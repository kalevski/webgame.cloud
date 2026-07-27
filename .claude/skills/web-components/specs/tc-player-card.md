---
component: tc-player-card
---

### tc-player-card

Player summary card showing a player name, optional title, presence status pip, rank badge, level, a stats grid, and action buttons. Styled to the toolcase design system: slate neutrals, sharp corners (`border-radius: 0`), hairline borders, JetBrains Mono for all machine-facing text, and a sanctioned circle for the status pip. No shadow root; light DOM; `display: block`.

**Tag:** `tc-player-card`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `player-name` | `string` | `''` | Player display name shown in the header. |
| `card-title` | `string` | — | Optional sub-label below the name (e.g. a guild title or in-game rank title). |
| `rank` | `string` | — | Optional rank badge text (e.g. `"Diamond III"`). Shown as a mono uppercase tag in the meta row. |
| `level` | `number` | — | Optional player level displayed as `Lv N` next to the rank badge. |
| `online-status` | `'online' \| 'away' \| 'busy' \| 'in-game' \| 'offline'` | `'offline'` | Presence status. Controls the pip color and the status label text. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `playerName` | `string` | `''` | Reflects the `player-name` attribute. |
| `cardTitle` | `string` | `''` | Reflects the `card-title` attribute. |
| `rank` | `string` | `''` | Reflects the `rank` attribute. |
| `level` | `number \| null` | `null` | Reflects the `level` attribute. Set to `null` to remove. |
| `onlineStatus` | `PresenceStatus` | `'offline'` | Reflects the `online-status` attribute. |
| `stats` | `PlayerCardStat[]` | `[]` | Array of stat objects. Setting this property triggers a re-render. |
| `actions` | `PlayerCardAction[]` | `[]` | Array of action button descriptors. Setting this property triggers a re-render. |
| `onAction` | `((id: string) => void) \| null` | `null` | Optional callback — called in addition to the `tc-action` event when an action button is clicked. |

**`PlayerCardStat` shape**

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Short stat label (e.g. `"KDR"`, `"Wins"`). Displayed as a mono uppercase micro-label. |
| `value` | `string \| number` | yes | Stat value. Numbers are formatted with `toLocaleString()`. |

**`PlayerCardAction` shape**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | Unique action identifier forwarded in the `tc-action` event detail. |
| `label` | `string` | yes | Button label text. |
| `danger` | `boolean` | no | When `true`, renders the button in the danger variant (red text / red fill on hover). |

#### Events

| Event | Detail | Description |
|---|---|---|
| `tc-action` | `{ id: string }` | Fired when an action button is clicked. `id` is the `PlayerCardAction.id` of the clicked button. Bubbles and is composed. |

#### Slots

None. `tc-player-card` is attribute- and property-driven; all content is generated.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-player-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-player-card-border` | `var(--tc-border)` | 1 px hairline border around the card. |
| `--bs-player-card-header-bg` | `var(--tc-surface-muted)` | Header region background. |
| `--bs-player-card-header-border` | `var(--tc-border)` | Bottom hairline on the header. |
| `--bs-player-card-name-color` | `var(--tc-text)` | Player name text colour. |
| `--bs-player-card-title-color` | `var(--tc-text-muted)` | Card title sub-label colour. |
| `--bs-player-card-pip-online` | `var(--tc-success, #22c55e)` | Pip colour for `online` status. |
| `--bs-player-card-pip-away` | `var(--tc-warning, #f59e0b)` | Pip colour for `away` status. |
| `--bs-player-card-pip-busy` | `var(--tc-danger, #ef4444)` | Pip colour for `busy` status. |
| `--bs-player-card-pip-in-game` | `var(--tc-app-accent)` | Pip colour for `in-game` status. |
| `--bs-player-card-pip-offline` | `var(--tc-text-faint)` | Pip colour for `offline` status. |
| `--bs-player-card-status-color` | `var(--tc-text-muted)` | Status label text colour. |
| `--bs-player-card-rank-bg` | `var(--tc-surface-muted)` | Rank badge background. |
| `--bs-player-card-rank-color` | `var(--tc-text-muted)` | Rank badge text colour. |
| `--bs-player-card-level-color` | `var(--tc-text-muted)` | Level label colour. |
| `--bs-player-card-stat-label-color` | `var(--tc-text-faint)` | Stat micro-label colour. |
| `--bs-player-card-stat-value-color` | `var(--tc-text)` | Stat value colour. |
| `--bs-player-card-btn-color` | `var(--tc-text)` | Action button text colour. |
| `--bs-player-card-btn-bg` | `var(--tc-surface)` | Action button background. |
| `--bs-player-card-btn-border` | `var(--tc-border)` | Action button border colour. |
| `--bs-player-card-btn-hover-bg` | `var(--tc-surface-hover)` | Action button hover background. |
| `--bs-player-card-btn-danger-color` | `var(--tc-danger, #ef4444)` | Danger-variant button text colour at rest. |
| `--bs-player-card-btn-danger-hover-bg` | `var(--tc-danger, #ef4444)` | Danger-variant button background on hover. |
| `--bs-player-card-btn-min-height` | `2rem` | Action button minimum height (44 px under coarse pointer). |

#### Example

```html
<tc-player-card
    id="card"
    player-name="Aria"
    card-title="Fragmaster"
    rank="Diamond III"
    level="87"
    online-status="online">
</tc-player-card>

<script>
    const card = document.getElementById('card');

    card.stats = [
        { label: 'KDR',  value: 1.84 },
        { label: 'Wins', value: 312  },
        { label: 'Hours', value: 1470 },
    ];

    card.actions = [
        { id: 'add-friend', label: 'Add Friend' },
        { id: 'invite',     label: 'Invite to Party' },
        { id: 'block',      label: 'Block', danger: true },
    ];

    card.addEventListener('tc-action', e => {
        console.log('action id:', e.detail.id);
    });
</script>
```

---