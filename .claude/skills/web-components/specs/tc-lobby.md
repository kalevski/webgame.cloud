---
component: tc-lobby
---

### tc-lobby

Multiplayer lobby panel showing player slots, ready state, and start controls. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners, JetBrains Mono for machine-facing text, ink accent for primary actions. Players are set via the `players` JS property. The Start Match button is shown only when a player with `host: true` is in the list and is enabled only when `can-start` is present. All cosmetics flow through `--bs-lobby-*` custom properties.

**Tag:** `tc-lobby`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `capacity` | number | `8` | Maximum number of player slots to render. |
| `lobby-mode` | string | `''` | Mode label shown in the meta strip and header (e.g. `"Team Deathmatch"`). Omit to hide the Mode cell. |
| `map-name` | string | `''` | Map label shown in the meta strip (e.g. `"Dust II"`). Omit to hide the Map cell. |
| `is-ready` | boolean | absent | Marks the local player as ready. Toggles the Ready Up button to "Unready" and applies the active (ink-fill) state. |
| `can-start` | boolean | absent | Enables the Start Match button. Has no effect when no host player is present in `players`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `capacity` | `number` | `8` | Reflects the `capacity` attribute. |
| `lobbyMode` | `string` | `''` | Reflects the `lobby-mode` attribute. |
| `mapName` | `string` | `''` | Reflects the `map-name` attribute. |
| `isReady` | `boolean` | `false` | Reflects the `is-ready` attribute. |
| `canStart` | `boolean` | `false` | Reflects the `can-start` attribute. |
| `players` | `LobbyPlayer[]` | `[]` | Array of player objects. Setting this re-renders the slot grid. Accepts at most `capacity` items; extras are silently ignored. |
| `onLeave` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-leave`. |
| `onReady` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-ready`. |
| `onStart` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-start`. |

**`LobbyPlayer` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique player identifier. Stamped as `data-id` on the slot element. |
| `name` | `string` | yes | Display name rendered in the slot. |
| `ready` | `boolean` | no | When `true` the slot gains `.tc-lobby-slot--ready` and shows "Ready"; otherwise shows "Waiting". |
| `host` | `boolean` | no | When `true` a "Host" badge is shown in the slot and the Start Match button appears in the actions bar. |
| `rank` | `string` | no | Optional rank chip rendered in JetBrains Mono (e.g. `"Diamond"`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-leave` | `{}` | Fired when the Leave button is clicked. Bubbles and is composed. |
| `tc-ready` | `{}` | Fired when the Ready Up / Unready button is clicked. Bubbles and is composed. |
| `tc-start` | `{}` | Fired when the Start Match button is clicked (only visible for the host, enabled only when `can-start` is set). Bubbles and is composed. |

**Slots**

`tc-lobby` has no named slots. All content is driven by attributes and JS properties.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-lobby-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-lobby-border` | `var(--tc-border)` | Outer 1px hairline border. |
| `--bs-lobby-header-bg` | `var(--tc-surface-muted)` | Header section background. |
| `--bs-lobby-header-border` | `var(--tc-border)` | Header bottom border. |
| `--bs-lobby-eyebrow-color` | `var(--tc-text-muted)` | "Lobby" eyebrow label colour. |
| `--bs-lobby-title-color` | `var(--tc-text)` | Mode/Match title colour. |
| `--bs-lobby-meta-bg` | `var(--tc-surface)` | Meta strip background. |
| `--bs-lobby-meta-border` | `var(--tc-border)` | Meta strip cell dividers. |
| `--bs-lobby-meta-key-color` | `var(--tc-text-faint)` | Meta key label colour (Mode, Map, Players). |
| `--bs-lobby-meta-val-color` | `var(--tc-text)` | Meta value colour. |
| `--bs-lobby-slot-bg` | `var(--tc-surface)` | Default slot background. |
| `--bs-lobby-slot-border` | `var(--tc-border)` | Slot grid hairline borders. |
| `--bs-lobby-slot-empty-color` | `var(--tc-text-faint)` | "Open Slot" placeholder text colour. |
| `--bs-lobby-slot-filled-bg` | `var(--tc-surface)` | Background for filled (occupied) slots. |
| `--bs-lobby-slot-ready-bg` | `var(--tc-surface-muted)` | Background tint for ready slots. |
| `--bs-lobby-player-name-color` | `var(--tc-text)` | Player name text colour. |
| `--bs-lobby-rank-bg` | `var(--tc-surface-muted)` | Rank chip background. |
| `--bs-lobby-rank-color` | `var(--tc-text-muted)` | Rank chip text colour. |
| `--bs-lobby-host-badge-color` | `var(--tc-app-accent)` | Host badge text colour. |
| `--bs-lobby-ready-color` | `var(--tc-success)` | "Ready" badge colour. |
| `--bs-lobby-waiting-color` | `var(--tc-text-faint)` | "Waiting" badge colour. |
| `--bs-lobby-actions-bg` | `var(--tc-surface-muted)` | Actions bar background. |
| `--bs-lobby-btn-bg` | `var(--tc-surface)` | Default button background. |
| `--bs-lobby-btn-color` | `var(--tc-text)` | Default button text colour. |
| `--bs-lobby-btn-border` | `var(--tc-border)` | Default button border colour. |
| `--bs-lobby-btn-hover-bg` | `var(--tc-surface-hover, var(--tc-surface-muted))` | Button hover background. |
| `--bs-lobby-btn-active-bg` | `var(--tc-app-accent)` | Ready-active button fill (ink). |
| `--bs-lobby-btn-active-color` | `#fff` | Ready-active button text. |
| `--bs-lobby-btn-start-bg` | `var(--tc-app-accent)` | Start button fill. |
| `--bs-lobby-btn-start-color` | `#fff` | Start button text. |
| `--bs-lobby-btn-disabled-opacity` | `0.45` | Opacity for the disabled Start button. |
| `--bs-lobby-btn-min-height` | `2.25rem` | Button minimum height (44 px under coarse pointer). |

**Example**

```html
<tc-lobby id="my-lobby" capacity="4" lobby-mode="Team Deathmatch" map-name="Dust II" can-start></tc-lobby>

<script>
    const lobby = document.getElementById('my-lobby')

    lobby.players = [
        { id: '1', name: 'Aria',    ready: true,  host: true, rank: 'Diamond' },
        { id: '2', name: 'Kestrel', ready: true,             rank: 'Platinum' },
        { id: '3', name: 'Vesper',  ready: false,            rank: 'Gold'     },
        { id: '4', name: 'Onyx',    ready: false,            rank: 'Silver'   },
    ]

    lobby.addEventListener('tc-leave', () => console.log('left lobby'))
    lobby.addEventListener('tc-ready', () => lobby.toggleAttribute('is-ready'))
    lobby.addEventListener('tc-start', () => console.log('match starting'))
</script>

---