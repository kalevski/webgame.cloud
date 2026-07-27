---
component: tc-character-select
---

### tc-character-select

Roster / character-selection screen: a grid of selectable character tiles (square portrait + name + role) paired with a detail panel that shows the active character's role, description, and stats. Characters are supplied via the `characters` JS property; the current selection is reflected on the `selected-id` attribute. Fires `tc-select` when a tile is chosen (click / Enter / Space) and `tc-confirm` on double-click. Locked tiles are inert (greyed out, not focusable). Styled to the toolcase design system (flat slate tiles, hairline borders, sharp corners, slate hover well, a 2px ink frame on the selected tile, and a lucide lock glyph in place of the 🔒 emoji).

**Tag:** `tc-character-select`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | — | `id` of the currently selected character; reflected as the selection changes |
| `id` | string | — | Standard HTML `id` on the host element |

The host element automatically gains `role="listbox"`; each tile is `role="option"`.

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `characters` | `CharacterEntry[]` | Characters to render as tiles (set via JS, not attribute); setting re-renders the grid |
| `selectedId` | string | Mirror of the `selected-id` attribute |
| `onSelect` | `((id: string) => void) \| null` | Optional callback fired alongside `tc-select` |
| `onConfirm` | `((id: string) => void) \| null` | Optional callback fired alongside `tc-confirm` |

Each `CharacterEntry`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique key; used in `selected-id` and the event `detail` |
| `name` | string | Character display name |
| `role` | string? | Short role/class label (mono micro-label on the tile and detail panel) |
| `locked` | boolean? | When `true`, the tile is greyed out, not focusable, and ignores selection |
| `portrait` | string? | A short glyph/initials label, or an image URL (auto-detected → rendered as `<img>`); falls back to the first letter of `name` |
| `description` | string? | Longer description shown in the detail panel |
| `stats` | `{ label: string, value: string \| number }[]?` | Stat rows shown in the detail panel (numbers are locale-formatted) |

**Events**

| Event | `detail` | Fired when |
|-------|----------|------------|
| `tc-select` | `{ id: string }` | A tile is selected (click, Enter, or Space) |
| `tc-confirm` | `{ id: string }` | A tile is double-clicked |

**Slots:** none — the tile grid and detail panel are all generated from the `characters` property.

```html
<tc-character-select id="roster" selected-id="aria"></tc-character-select>
<script>
const el = document.getElementById('roster')
el.characters = [
    { id: 'aria', name: 'Aria Voss', role: 'Vanguard', description: 'Front-line specialist.',
      stats: [{ label: 'Health', value: 1280 }, { label: 'Speed', value: 6 }] },
    { id: 'kade', name: 'Kade Rin', role: 'Marksman' },
    { id: 'nyx', name: 'Nyx', role: 'Infiltrator', locked: true },
]
el.addEventListener('tc-select', e => console.log('selected', e.detail.id))
el.addEventListener('tc-confirm', e => console.log('confirmed', e.detail.id))
</script>
```

---