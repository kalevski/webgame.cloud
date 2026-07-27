---
component: tc-item-slot
---

### tc-item-slot

A single inventory / hotbar slot: an item glyph (image or initials), a quantity badge, a per-rarity border accent, an optional hotkey, an equipped marker, a radial cooldown sweep, and a locked state. The host element *is* the sharp hairline tile; set the item via the JS `item` property, and `selected` / `size` / `hotkey` via attributes. Activating an unlocked slot (click, Enter, or Space) fires `tc-click`. Styled to the toolcase design system: a flat slate tile where rarity is a single muted border accent and the locked glyph is a lucide lock icon (no emoji).

This is the primitive composed by `tc-hotbar`, `tc-inventory-grid`, and `tc-equipment-doll`: those parents own their own interactivity (role / tabindex / selection) and forward each item plus `size` / `selected` / `hotkey`, so the slot does not stop native-click propagation. Used standalone it is a self-sufficient button.

**Tag:** `tc-item-slot`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | number | `56` | Tile width/height in pixels (written to `--bs-item-slot-size`; the glyph size is derived as `round(size × 0.42)` into `--bs-item-slot-glyph-size`; bumped to a 44px minimum under coarse pointers). Non-positive/invalid values fall back to `56`. |
| `selected` | boolean | — | Present when the slot is selected; paints the standard ink active border + focus-ring halo (wins over the rarity accent). |
| `hotkey` | string | — | Key hint shown as a mono badge pinned to the bottom-right corner. |

When an item is set, the slot reflects its rarity onto the host as `data-rarity="…"` so the SCSS (and themes / consumers) can target a tier without a JS read.

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `item` | `InventoryItem \| null` | The item occupying the slot, or `null` for an empty (dashed, muted) socket. Setting this property triggers a re-render. |
| `selected` | boolean | Mirrors the `selected` attribute. |
| `size` | number | Mirrors the `size` attribute. |
| `hotkey` | string | Mirrors the `hotkey` attribute. |
| `onClick` | `((detail: { item: InventoryItem \| null }) => void) \| null` | Optional callback fired alongside the `tc-click` CustomEvent. Default `null`. |

**`InventoryItem` shape**

```ts
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

interface InventoryItem {
  id: string
  name?: string         // accessible label (used when no aria-label is set)
  icon?: string         // image source (rendered as <img>) or short glyph/initials label
  rarity?: ItemRarity   // tints the hairline border accent; defaults to 'common'
  qty?: number          // shown as a corner badge when > 1
  cooldown?: number      // remaining cooldown; with cooldownMax drives the radial sweep + countdown
  cooldownMax?: number   // full cooldown duration
  equipped?: boolean     // shows a small status-tinted "E" marker, top-right
  locked?: boolean       // dims the slot, shows a lock glyph, and makes it inert (removed from tab order)
}
```

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-click` | `{ item: InventoryItem \| null }` | Fired when an unlocked slot is activated (click, Enter, or Space). Bubbles and is composed. Locked slots fire nothing. (Distinct from the `tc-select` that composing parents emit.) |

**Slots**

None. The slot renders its own interior from the `item` property.

**CSS custom properties** (cosmetics flow through `--bs-item-slot-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-item-slot-size` | `56px` | Tile width/height (set from the `size` attribute) |
| `--bs-item-slot-glyph-size` | `24px` | Glyph font/SVG size (derived from `size`) |
| `--bs-item-slot-cd-angle` | `0deg` | Cooldown sweep angle (set inline from `cooldown / cooldownMax`) |
| `--bs-item-slot-bg` | `var(--tc-surface)` | Filled tile background |
| `--bs-item-slot-border-color` | `var(--tc-border-strong)` | Tile hairline border (overridden per `data-rarity` and when `selected`) |
| `--bs-item-slot-empty-border` | `var(--tc-border)` | Empty (dashed) socket border |
| `--bs-item-slot-hover-bg` | `var(--tc-surface-muted)` | Tile hover well |
| `--bs-item-slot-glyph-color` | `var(--tc-text)` | Glyph colour |
| `--bs-item-slot-empty-color` | `var(--tc-text-faint)` | Empty socket colour |
| `--bs-item-slot-selected-border` | `var(--tc-app-accent)` | Selected ink border |
| `--bs-item-slot-selected-ring` | `rgba(30, 41, 59, 0.12)` | Selected focus-ring halo |
| `--bs-item-slot-qty-bg` | `var(--tc-app-accent)` | Quantity badge background |
| `--bs-item-slot-qty-color` | `#fff` | Quantity badge text colour |
| `--bs-item-slot-hotkey-bg` | `var(--tc-app-accent)` | Hotkey badge background |
| `--bs-item-slot-hotkey-color` | `#fff` | Hotkey badge text colour |
| `--bs-item-slot-equipped-bg` | `var(--tc-success)` | Equipped marker background |
| `--bs-item-slot-equipped-color` | `#fff` | Equipped marker text colour |
| `--bs-item-slot-cooldown-veil` | `rgba(15, 23, 42, 0.55)` | Cooldown sweep veil colour |
| `--bs-item-slot-cooldown-color` | `#fff` | Cooldown countdown text colour |
| `--bs-item-slot-lock-color` | `var(--tc-text-muted)` | Lock glyph colour |

Per-rarity border accent (applied via `tc-item-slot[data-rarity='…']`): `uncommon` → `var(--tc-success)`, `rare` → `var(--tc-info)`, `epic` → `var(--tc-app-accent)`, `legendary` → `var(--tc-warning)`, `mythic` → `var(--tc-danger)`. `common` keeps the neutral default.

**Example**

```html
<tc-item-slot id="slot" hotkey="1" size="64"></tc-item-slot>
<script>
  const slot = document.getElementById('slot')
  slot.item = { id: 'potion', name: 'Health Potion', icon: 'P', qty: 5, rarity: 'rare' }
  slot.addEventListener('tc-click', (e) => console.log('activated', e.detail.item?.id))
</script>
```

---