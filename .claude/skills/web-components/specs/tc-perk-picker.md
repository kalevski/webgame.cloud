---
component: tc-perk-picker
---

### tc-perk-picker

Grid of selectable perk cards with selected and locked states. Perks are supplied via the `perks` JS property; each card shows an optional icon tile, a name, and an optional description. Fires `tc-select` on click, Enter, or Space. The `columns` attribute controls the CSS grid column count. Locked perks are inert (reduced opacity, not focusable). Styled to the toolcase design system (flat slate cards, hairline borders, sharp corners, ink fill for the selected card, lucide lock icon for locked entries).

**Tag:** `tc-perk-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | number | `3` | Number of grid columns; parsed as a positive integer |

The host element automatically gains `role="listbox"`; each card is `role="option"`.

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `perks` | `Perk[]` | Perk entries to render; setting re-renders the grid |
| `columns` | number | Mirror of the `columns` attribute |
| `onSelect` | `((id: string) => void) \| null` | Optional callback fired alongside `tc-select` |

Each `Perk`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique key; echoed in the event `detail` |
| `name` | string | Perk display name |
| `description` | string? | Short descriptive text shown below the name |
| `icon` | string? | A lucide icon name (kebab-case, e.g. `"shield"`) rendered as inline SVG; non-lucide strings appear as mono text glyphs |
| `selected` | boolean? | Pre-selects the card (ink fill); consumer is responsible for updating on `tc-select` |
| `locked` | boolean? | Renders a lock icon, reduces opacity, and makes the card inert |

**Events**

| Event | `detail` | Fired when |
|-------|----------|------------|
| `tc-select` | `{ id: string }` | A non-locked card is clicked, or Enter / Space is pressed on a focused card |

**Slots:** none — all content is driven by the `perks` JS property.

**Custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-perk-picker-gap` | `0.75rem` | Gap between cards |
| `--bs-perk-picker-columns` | `3` | Grid column count (set inline by the component) |
| `--bs-perk-picker-card-padding` | `0.875rem 0.75rem` | Inner padding of each card |
| `--bs-perk-picker-card-bg` | `var(--tc-surface)` | Card background |
| `--bs-perk-picker-card-border` | `var(--tc-border)` | Card hairline border |
| `--bs-perk-picker-card-hover-bg` | `var(--tc-surface-muted)` | Hover background |
| `--bs-perk-picker-selected-bg` | `var(--tc-app-accent)` | Selected card fill |
| `--bs-perk-picker-selected-color` | `#fff` | Selected card text colour |
| `--bs-perk-picker-icon-size` | `2.25rem` | Icon tile width and height |
| `--bs-perk-picker-icon-bg` | `var(--tc-surface-muted)` | Icon tile background |
| `--bs-perk-picker-disabled-opacity` | `0.45` | Opacity of locked cards |

```html
<tc-perk-picker id="pp" columns="3"></tc-perk-picker>
<script>
const el = document.getElementById('pp')
el.perks = [
    { id: 'iron-will',  name: 'Iron Will',   description: 'Reduces incoming damage by 15%.', icon: 'shield',     selected: true },
    { id: 'quickstep',  name: 'Quickstep',   description: 'Roll cooldown reduced by 20%.',   icon: 'zap' },
    { id: 'bloodlust',  name: 'Bloodlust',   description: 'Crits restore 5 HP.',             icon: 'heart-pulse' },
    { id: 'mastery',    name: 'Mastery',     description: 'Locked until level 30.',           icon: 'star',       locked: true },
]
el.addEventListener('tc-select', e => {
    console.log('selected perk:', e.detail.id)
    // Re-render with updated selected state:
    el.perks = el.perks.map(p => ({ ...p, selected: p.id === e.detail.id }))
})
</script>
```

---