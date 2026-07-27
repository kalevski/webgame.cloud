---
component: tc-equipment-doll
---

### tc-equipment-doll

A paper-doll of equipment slots arranged around a neutral character figure. Each slot is a sharp hairline tile positioned by `x`/`y` percentage on a grid-backed surface; selecting one fires `tc-select` and reflects the chosen slot via `selected-id`. Styled to the toolcase design system: a faint slate figure backs the tiles, selection uses the standard ink-active state, and item icons render as `<img>` (image source) or a short glyph/initials label. No slot children — set slots via the JS `slots` property.

**Tag:** `tc-equipment-doll`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `silhouette` | string | — | Optional custom figure. When set, the text/glyph is rendered centred in place of the default humanoid figure. When absent, a neutral inline-SVG figure is shown. |
| `width` | number | `240` | Canvas width in pixels (written to `--bs-equipment-doll-width`). Non-positive/invalid values fall back to `240`. |
| `height` | number | `360` | Canvas height in pixels (written to `--bs-equipment-doll-height`). Non-positive/invalid values fall back to `360`. |
| `slot-size` | number | `56` | Size of each square slot tile in pixels (written to `--bs-equipment-doll-slot-size`; bumped to a 44px minimum under coarse pointers). |
| `selected-id` | string | — | The `id` of the currently-selected slot. Reflected; updated automatically when a slot is clicked. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `slots` | `EquipmentSlotConfig[]` | Array of slot descriptors positioned by `x`/`y` percentage. Setting this property triggers a re-render. |
| `onSelect` | `((id: string) => void) \| null` | Optional callback fired alongside the `tc-select` CustomEvent. Default `null`. |

**`EquipmentSlotConfig` shape**

```ts
interface EquipmentItem {
  id: string
  name?: string
  icon?: string   // image source (rendered as <img>) or short glyph/initials label
  qty?: number    // shown as a corner badge when > 1
}

interface EquipmentSlotConfig {
  id: string                      // unique slot id, written as data-id and used by selected-id
  label?: string                  // optional mono micro-label under the tile; also the aria-label
  item?: EquipmentItem | null     // equipped item, or null/omitted for an empty (dashed) slot
  x: number                       // horizontal position as a percentage of the canvas width
  y: number                       // vertical position as a percentage of the canvas height
}
```

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-select` | `{ id: string }` | Fired when a slot is activated (click, Enter, or Space). Bubbles and is composed. `selected-id` is updated before the event fires. |

**Slots**

None. The component owns its canvas and all figure/slot rendering.

**CSS custom properties** (cosmetics flow through `--bs-equipment-doll-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-equipment-doll-width` | `240px` | Canvas width (set from the `width` attribute) |
| `--bs-equipment-doll-height` | `360px` | Canvas height (set from the `height` attribute) |
| `--bs-equipment-doll-slot-size` | `56px` | Slot tile size (set from the `slot-size` attribute) |
| `--bs-equipment-doll-surface` | `var(--tc-surface)` | Canvas background |
| `--bs-equipment-doll-border-color` | `var(--tc-border)` | Canvas hairline frame |
| `--bs-equipment-doll-grid-color` | `var(--tc-border)` | Faint backdrop grid lines |
| `--bs-equipment-doll-figure-color` | `var(--tc-slate-300)` | Neutral figure / custom-silhouette color |
| `--bs-equipment-doll-slot-border` | `var(--tc-border-strong)` | Filled slot tile border |
| `--bs-equipment-doll-slot-empty-border` | `var(--tc-border)` | Empty (dashed) slot tile border |
| `--bs-equipment-doll-slot-hover-bg` | `var(--tc-surface-muted)` | Slot tile hover well |
| `--bs-equipment-doll-selected-bg` | `var(--tc-app-accent)` | Selected slot ink fill |
| `--bs-equipment-doll-qty-bg` | `var(--tc-app-accent)` | Quantity badge background |
| `--bs-equipment-doll-label-color` | `var(--tc-text-muted)` | Slot mono micro-label color |

**Example**

```html
<tc-equipment-doll id="doll" width="280" height="400" selected-id="chest"></tc-equipment-doll>
<script>
  const doll = document.getElementById('doll')
  doll.slots = [
    { id: 'head',  label: 'Head',  x: 50, y: 8,  item: { id: 'helm',  name: 'Iron Helm',   icon: 'H' } },
    { id: 'chest', label: 'Chest', x: 50, y: 34, item: { id: 'plate', name: 'Plate Armor', icon: 'C' } },
    { id: 'belt',  label: 'Belt',  x: 50, y: 60, item: null },
    { id: 'feet',  label: 'Feet',  x: 50, y: 94, item: { id: 'boots', name: 'Boots', icon: 'B', qty: 2 } },
  ]
  doll.addEventListener('tc-select', (e) => console.log('selected slot', e.detail.id))
</script>
```

---