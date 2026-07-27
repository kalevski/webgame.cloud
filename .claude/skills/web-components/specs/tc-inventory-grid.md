---
component: tc-inventory-grid
---

### tc-inventory-grid

A grid of inventory item slots with a configurable column count and a selected item id. Each cell composes a `tc-item-slot` for the item visuals; the grid owns the sharp hairline frame, the 1px-gap grid layout and the selection ring. Selecting a cell fires `tc-select` and reflects the chosen item's `id` via `selected-id`. Styled to the toolcase design system. No slot children — set cells via the JS `items` property (entries may be `null` for empty sockets).

Until `tc-item-slot` is registered, the grid renders standalone: each cell is painted as a design-system slot (sharp hairline frame, item glyph/quantity, ink selection ring) via `:not(:defined)` fallback rules. Once `tc-item-slot` is registered it owns the slot interior.

**Tag:** `tc-inventory-grid`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | number | `6` | Number of columns in the grid (written to `--bs-inventory-grid-cols`). Non-positive/invalid values fall back to `6`. |
| `slot-size` | number | `56` | Size of each square slot in pixels (forwarded to each `tc-item-slot` as `size` and written to `--bs-inventory-grid-cell`; bumped to a 44px minimum under coarse pointers). Non-positive/invalid values fall back to `56`. |
| `selected-id` | string | — | The `id` of the currently-selected item. Reflected; updated automatically when a cell with an item is activated. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `(InventoryItem \| null)[]` | Array of items, one per cell (`null` for an empty socket). Setting this property triggers a re-render. |
| `onSelect` | `((detail: { item: InventoryItem \| null, index: number }) => void) \| null` | Optional callback fired alongside the `tc-select` CustomEvent. Default `null`. |

**`InventoryItem` shape**

```ts
interface InventoryItem {
  id: string
  name?: string   // accessible label for the cell
  icon?: string   // image source (rendered as <img>) or short glyph/initials label
  qty?: number    // shown as a corner badge when > 1
}
```

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-select` | `{ item: InventoryItem \| null, index: number }` | Fired when a cell is activated (click, Enter, or Space). Bubbles and is composed. When the activated cell holds an item, `selected-id` is updated to that item's `id` before the event fires. |

**Slots**

None. The component owns its grid and forwards each item to a composed `tc-item-slot`.

**CSS custom properties** (cosmetics flow through `--bs-inventory-grid-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-inventory-grid-cols` | `6` | Column count (set from the `columns` attribute) |
| `--bs-inventory-grid-cell` | `56px` | Slot size (set from the `slot-size` attribute) |
| `--bs-inventory-grid-gap` | `0.25rem` | Gap between cells |
| `--bs-inventory-grid-padding` | `0.5rem` | Inner padding of the grid frame |
| `--bs-inventory-grid-surface` | `var(--tc-surface)` | Grid background |
| `--bs-inventory-grid-border-color` | `var(--tc-border)` | Grid hairline frame |
| `--bs-inventory-grid-slot-bg` | `var(--tc-surface)` | Filled slot background |
| `--bs-inventory-grid-slot-border` | `var(--tc-border-strong)` | Filled slot border |
| `--bs-inventory-grid-slot-empty-border` | `var(--tc-border)` | Empty (dashed) slot border |
| `--bs-inventory-grid-slot-hover-bg` | `var(--tc-surface-muted)` | Slot hover well |
| `--bs-inventory-grid-selected-border` | `var(--tc-app-accent)` | Selected slot ink border |
| `--bs-inventory-grid-selected-ring` | `rgba(30, 41, 59, 0.12)` | Selected slot focus-ring halo |
| `--bs-inventory-grid-qty-bg` | `var(--tc-app-accent)` | Quantity badge background |
| `--bs-inventory-grid-qty-color` | `#fff` | Quantity badge text color |

**Example**

```html
<tc-inventory-grid id="bag" columns="6" selected-id="potion"></tc-inventory-grid>
<script>
  const bag = document.getElementById('bag')
  bag.items = [
    { id: 'sword',  name: 'Longsword',     icon: 'S' },
    { id: 'potion', name: 'Health Potion', icon: 'P', qty: 5 },
    null,
    { id: 'bow',    name: 'Short Bow',     icon: 'B' },
  ]
  bag.addEventListener('tc-select', (e) => console.log('selected', e.detail.item?.id, 'at', e.detail.index))
</script>
```

---