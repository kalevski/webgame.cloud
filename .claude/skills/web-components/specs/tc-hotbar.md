---
component: tc-hotbar
---

### tc-hotbar

A horizontal action bar of item/ability slots with hotkeys and a selected index. Each slot composes a `tc-item-slot` for the item visuals; the bar owns the sharp hairline frame, the row layout, the hotkey badge and the selection ring. Selecting a slot fires `tc-select` and reflects the chosen item's `id` via `selected-id`. Styled to the toolcase design system. No slot children — set slots via the JS `slots` property.

Until `tc-item-slot` is registered, the bar renders standalone: each slot is painted as a design-system cell (sharp hairline frame, item glyph/quantity, hotkey badge, ink selection ring) via `:not(:defined)` fallback rules. Once `tc-item-slot` is registered it owns the slot interior.

**Tag:** `tc-hotbar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `slot-size` | number | `56` | Size of each square slot in pixels (forwarded to each `tc-item-slot` as `size` and written to `--bs-hotbar-slot-size`; bumped to a 44px minimum under coarse pointers). Non-positive/invalid values fall back to `56`. |
| `selected-id` | string | — | The `id` of the currently-selected item. Reflected; updated automatically when a slot with an item is activated. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `slots` | `HotbarSlot[]` | Array of slot descriptors (item + hotkey). Setting this property triggers a re-render. |
| `onSelect` | `((detail: { item: InventoryItem \| null, index: number }) => void) \| null` | Optional callback fired alongside the `tc-select` CustomEvent. Default `null`. |

**`HotbarSlot` shape**

```ts
interface InventoryItem {
  id: string
  name?: string   // accessible label for the slot
  icon?: string   // image source (rendered as <img>) or short glyph/initials label
  qty?: number    // shown as a corner badge when > 1
}

interface HotbarSlot {
  item?: InventoryItem | null   // the slotted item, or null/omitted for an empty slot
  hotkey?: string               // key hint shown as a mono badge; also aria-keyshortcuts
}
```

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-select` | `{ item: InventoryItem \| null, index: number }` | Fired when a slot is activated (click, Enter, or Space). Bubbles and is composed. When the activated slot holds an item, `selected-id` is updated to that item's `id` before the event fires. |

**Slots**

None. The component owns its row and forwards each item to a composed `tc-item-slot`.

**CSS custom properties** (cosmetics flow through `--bs-hotbar-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-hotbar-slot-size` | `56px` | Slot size (set from the `slot-size` attribute) |
| `--bs-hotbar-gap` | `0.375rem` | Gap between slots |
| `--bs-hotbar-padding` | `0.5rem` | Inner padding of the bar frame |
| `--bs-hotbar-surface` | `var(--tc-surface)` | Bar background |
| `--bs-hotbar-border-color` | `var(--tc-border)` | Bar hairline frame |
| `--bs-hotbar-slot-bg` | `var(--tc-surface)` | Filled slot background |
| `--bs-hotbar-slot-border` | `var(--tc-border-strong)` | Filled slot border |
| `--bs-hotbar-slot-empty-border` | `var(--tc-border)` | Empty (dashed) slot border |
| `--bs-hotbar-slot-hover-bg` | `var(--tc-surface-muted)` | Slot hover well |
| `--bs-hotbar-selected-border` | `var(--tc-app-accent)` | Selected slot ink border |
| `--bs-hotbar-selected-ring` | `rgba(30, 41, 59, 0.12)` | Selected slot focus-ring halo |
| `--bs-hotbar-hotkey-bg` | `var(--tc-app-accent)` | Hotkey badge background |
| `--bs-hotbar-hotkey-color` | `#fff` | Hotkey badge text color |
| `--bs-hotbar-qty-bg` | `var(--tc-app-accent)` | Quantity badge background |
| `--bs-hotbar-qty-color` | `#fff` | Quantity badge text color |

**Example**

```html
<tc-hotbar id="bar" selected-id="sword"></tc-hotbar>
<script>
  const bar = document.getElementById('bar')
  bar.slots = [
    { hotkey: '1', item: { id: 'sword',  name: 'Longsword',     icon: 'S' } },
    { hotkey: '2', item: { id: 'potion', name: 'Health Potion', icon: 'P', qty: 5 } },
    { hotkey: '3', item: null },
  ]
  bar.addEventListener('tc-select', (e) => console.log('selected', e.detail.item?.id, 'at', e.detail.index))
</script>
```

---