---
component: tc-loot-list
---

### tc-loot-list

A list of loot / drop entries with optional rarity tiers. Items are set via the JS `items` property. Rarity is communicated by a 3 px left-edge accent per row. The Take All button fires `tc-take-all`; individual Take buttons fire `tc-take` with the item id. No shadow root; light DOM; `display: block`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `list-title` | `string` | `"Loot"` | Heading shown in the panel header. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `LootEntry[]` | `[]` | Array of loot entries to render. Setting this property re-renders the list. |
| `onTake` | `((id: string) => void) \| null` | `null` | Optional callback — called in addition to the `tc-take` event. |
| `onTakeAll` | `(() => void) \| null` | `null` | Optional callback — called in addition to the `tc-take-all` event. |

**`LootEntry` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item` | `LootItem` | yes | The item being dropped. |
| `qty` | `number` | no | Override quantity displayed for this drop (falls back to `item.qty`, then 1). |

**`LootItem` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique item identifier. Stamped as `data-id` on the row element. |
| `name` | `string` | no | Display name (falls back to `id`). |
| `icon` | `string` | no | Single character or emoji used as the icon (defaults to `◆`). |
| `rarity` | `LootItemRarity` | no | One of `common \| uncommon \| rare \| epic \| legendary \| mythic`. Sets the row's left-stripe accent colour. |
| `qty` | `number` | no | Default quantity for this item. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-take` | `{ id: string }` | Fired when the Take button for an individual row is clicked. Bubbles and is composed. |
| `tc-take-all` | `{}` | Fired when the Take All button is clicked (disabled when the list is empty). Bubbles and is composed. |

**Slots**

`tc-loot-list` has no named slots. All content is driven by the `items` JS property.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-loot-list-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-loot-list-border` | `var(--tc-border)` | Outer 1 px hairline border. |
| `--bs-loot-list-header-bg` | `var(--tc-surface-muted)` | Header section background. |
| `--bs-loot-list-header-border` | `var(--tc-border)` | Header bottom border. |
| `--bs-loot-list-title-color` | `var(--tc-text-muted)` | Eyebrow title colour. |
| `--bs-loot-list-title-font-size` | `0.6875rem` | Eyebrow title font size. |
| `--bs-loot-list-row-border` | `1px solid var(--tc-slate-100)` | Row separator hairline. |
| `--bs-loot-list-row-hover-bg` | `var(--tc-surface-hover)` | Row hover background. |
| `--bs-loot-list-icon-font-size` | `0.875rem` | Icon cell font size. |
| `--bs-loot-list-icon-color` | `var(--tc-text-faint)` | Icon cell colour. |
| `--bs-loot-list-name-font-size` | `0.8125rem` | Item name font size. |
| `--bs-loot-list-name-color` | `var(--tc-text)` | Item name colour. |
| `--bs-loot-list-qty-font-size` | `0.75rem` | Quantity suffix font size. |
| `--bs-loot-list-qty-color` | `var(--tc-text-muted)` | Quantity suffix colour. |
| `--bs-loot-list-rarity-common` | `var(--tc-text-faint)` | Left-stripe colour for `common`. |
| `--bs-loot-list-rarity-uncommon` | `var(--tc-success)` | Left-stripe colour for `uncommon`. |
| `--bs-loot-list-rarity-rare` | `var(--tc-info)` | Left-stripe colour for `rare`. |
| `--bs-loot-list-rarity-epic` | `#a855f7` | Left-stripe colour for `epic`. |
| `--bs-loot-list-rarity-legendary` | `var(--tc-warning)` | Left-stripe colour for `legendary`. |
| `--bs-loot-list-rarity-mythic` | `var(--tc-danger)` | Left-stripe colour for `mythic`. |
| `--bs-loot-list-btn-font-size` | `0.75rem` | Button font size. |
| `--bs-loot-list-btn-min-height` | `1.75rem` | Button minimum height (44 px under coarse pointer). |
| `--bs-loot-list-btn-bg` | `var(--tc-surface)` | Button background. |
| `--bs-loot-list-btn-color` | `var(--tc-text)` | Button text colour. |
| `--bs-loot-list-btn-border` | `var(--tc-border-strong)` | Button border. |
| `--bs-loot-list-btn-hover-bg` | `var(--tc-app-accent)` | Button hover background (ink). |
| `--bs-loot-list-btn-hover-color` | `#fff` | Button hover text colour. |
| `--bs-loot-list-btn-disabled-opacity` | `0.45` | Opacity for disabled Take All. |
| `--bs-loot-list-empty-color` | `var(--tc-text-faint)` | Empty-state text colour. |

**Example**

```html
<tc-loot-list id="loot" list-title="Chest Loot"></tc-loot-list>

<script>
    const loot = document.getElementById('loot')

    loot.items = [
        { item: { id: 'gold', name: 'Gold Coin', icon: '◎', rarity: 'common', qty: 5 } },
        { item: { id: 'sword', name: 'Iron Sword', icon: '◆', rarity: 'uncommon' } },
        { item: { id: 'staff', name: 'Frost Staff', icon: '✦', rarity: 'rare' }, qty: 2 },
    ]

    loot.addEventListener('tc-take', e => console.log('take item id:', e.detail.id))
    loot.addEventListener('tc-take-all', () => console.log('take all'))
</script>
```
```

---