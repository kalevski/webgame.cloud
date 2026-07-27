---
component: tc-crafting-panel
---

### tc-crafting-panel

A crafting UI: a recipe list on one side, and a detail panel on the other showing the selected recipe's output, its ingredient requirements, and a craft action. Selecting a row fires `tc-select`; the craft button fires `tc-craft`. The detail panel lists each input's `have/need` count, marking insufficient ingredients in the danger colour, and disables the craft button until the recipe is affordable (or while `crafting` is set). Driven by the `recipes` JS property plus the `selected-id` / `crafting` attributes. Styled to the toolcase design system: a hairline-framed recipe list with slate-100 separators and a solid-ink selected row, a flat slate detail card, sharp square icon tiles with mono glyphs, mono uppercase section eyebrows, and the standard ink primary button for the craft action — neutrals carry the layout, and colour appears only as status (danger for insufficient stock).

**Tag:** `tc-crafting-panel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | `''` | The id of the currently-selected recipe. Drives which recipe's detail is shown and which row reads selected. Reflected by the `selectedId` property; set automatically when a row is activated. |
| `crafting` | boolean | `false` | When present, the craft button shows "Crafting…" and is disabled (a craft is in progress). |

The host sets `role="group"` on connect unless one is already present.

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `recipes` | `CraftingRecipe[]` | `[]` | Array of recipe objects. Setting re-renders the panel. Getter returns a copy. |
| `selectedId` | `string` | `''` | Reflects the `selected-id` attribute. |
| `crafting` | `boolean` | `false` | Reflects the `crafting` attribute. |
| `onSelect` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-select` event. |
| `onCraft` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-craft` event. |

**Shapes**

```ts
interface CraftingItem {
    id: string
    name?: string   // falls back to id
    icon?: string   // image src → <img>; otherwise a short glyph/initials label
}
interface CraftingIngredient {
    item: CraftingItem
    qty: number          // amount required
    available?: number   // amount in stock; omit to skip the affordability check
}
interface CraftingRecipe {
    id: string
    name: string
    icon?: string        // recipe icon; falls back to the output item icon
    inputs: CraftingIngredient[]
    output: { item: CraftingItem; qty?: number }   // qty defaults to 1
}
```

A recipe is affordable when every input with a numeric `available` satisfies `available >= qty` (inputs without `available` are treated as in stock).

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string }` | Dispatched when a recipe row is clicked or activated with Enter/Space. Also updates `selected-id`. `bubbles: true`, `composed: true`. |
| `tc-craft` | `{ id: string }` | Dispatched when the (enabled) craft button is clicked. `bubbles: true`, `composed: true`. `id` is the active recipe's id. |

**Slots**

None. The component owns every row and detail; content comes from the `recipes` property.

**CSS Custom Properties** (cosmetics flow through `--bs-crafting-panel-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-crafting-panel-gap` | `1rem` | Gap between the list and the detail panel. |
| `--bs-crafting-panel-list-bg` | `var(--tc-surface)` | Recipe list background. |
| `--bs-crafting-panel-list-border-color` | `var(--tc-border)` | Outer 1px hairline frame of the list. |
| `--bs-crafting-panel-row-separator-color` | `var(--tc-surface-muted)` | 1px hairline between rows. |
| `--bs-crafting-panel-row-padding-x` | `0.75rem` | Row horizontal padding. |
| `--bs-crafting-panel-row-padding-y` | `0.625rem` | Row vertical padding. |
| `--bs-crafting-panel-row-gap` | `0.625rem` | Gap between a row's icon and name. |
| `--bs-crafting-panel-row-hover-bg` | `var(--tc-surface-hover)` | Row hover/focus well. |
| `--bs-crafting-panel-selected-accent` | `var(--tc-app-accent)` | Selected-row ink fill, focus outline, craft-button focus. |
| `--bs-crafting-panel-row-name-color` | `var(--tc-text)` | Row name colour. |
| `--bs-crafting-panel-row-name-size` | `0.8125rem` | Row name size. |
| `--bs-crafting-panel-icon-size` | `32px` | Shared icon-tile size (row/ingredient base). |
| `--bs-crafting-panel-icon-bg` | `var(--tc-surface-muted)` | Icon-tile fill. |
| `--bs-crafting-panel-icon-color` | `var(--tc-text)` | Icon-tile glyph colour. |
| `--bs-crafting-panel-icon-font-size` | `0.875rem` | Icon-tile glyph size. |
| `--bs-crafting-panel-detail-bg` | `var(--tc-surface)` | Detail panel background. |
| `--bs-crafting-panel-detail-border-color` | `var(--tc-border)` | Detail panel hairline border. |
| `--bs-crafting-panel-detail-padding` | `1.25rem` | Detail panel padding. |
| `--bs-crafting-panel-detail-min-width` | `240px` | Detail panel min-width at the side-by-side breakpoint. |
| `--bs-crafting-panel-eyebrow-color` | `var(--tc-text-muted)` | "Output"/"Inputs" eyebrow colour. |
| `--bs-crafting-panel-eyebrow-size` | `0.6875rem` | Eyebrow size. |
| `--bs-crafting-panel-eyebrow-spacing` | `0.1em` | Eyebrow letter-spacing. |
| `--bs-crafting-panel-output-name-color` | `var(--tc-text)` | Output name colour. |
| `--bs-crafting-panel-output-name-size` | `1rem` | Output name size. |
| `--bs-crafting-panel-output-icon-size` | `40px` | Output icon-tile size. |
| `--bs-crafting-panel-ingredient-gap` | `0.625rem` | Gap within an ingredient/output row. |
| `--bs-crafting-panel-ingredient-padding-y` | `0.5rem` | Ingredient row vertical padding. |
| `--bs-crafting-panel-ingredient-border-color` | `var(--tc-border)` | Ingredient hairline separators. |
| `--bs-crafting-panel-ingredient-name-color` | `var(--tc-text)` | Ingredient name colour. |
| `--bs-crafting-panel-ingredient-name-size` | `0.8125rem` | Ingredient name size. |
| `--bs-crafting-panel-ingredient-qty-color` | `var(--tc-text-muted)` | Ingredient `have/need` count colour. |
| `--bs-crafting-panel-ingredient-qty-size` | `0.8125rem` | Ingredient count size. |
| `--bs-crafting-panel-insufficient-color` | `var(--tc-danger)` | Insufficient-ingredient count colour. |
| `--bs-crafting-panel-craft-bg` | `linear-gradient(135deg, var(--tc-app-accent), #2b3a51)` | Craft-button fill (ink primary motif). |
| `--bs-crafting-panel-craft-color` | `#fff` | Craft-button text colour. |
| `--bs-crafting-panel-craft-padding-y` | `0.5rem` | Craft-button vertical padding. |
| `--bs-crafting-panel-craft-padding-x` | `1rem` | Craft-button horizontal padding. |
| `--bs-crafting-panel-craft-font-size` | `0.925rem` | Craft-button text size. |
| `--bs-crafting-panel-craft-hover-shadow` | `0 4px 15px rgba(30, 41, 59, 0.3)` | Craft-button hover lift glow. |

**Example**

```html
<tc-crafting-panel id="crafting" selected-id="iron-sword"></tc-crafting-panel>
<script>
  const panel = document.getElementById('crafting')
  panel.recipes = [
    {
      id: 'iron-sword',
      name: 'Iron Sword',
      icon: 'IS',
      inputs: [
        { item: { id: 'iron', name: 'Iron Ingot', icon: 'Fe' }, qty: 2, available: 5 },
        { item: { id: 'wood', name: 'Oak Plank', icon: 'W' }, qty: 1, available: 3 },
      ],
      output: { item: { id: 'iron-sword', name: 'Iron Sword', icon: 'IS' }, qty: 1 },
    },
    {
      id: 'health-potion',
      name: 'Health Potion',
      inputs: [
        { item: { id: 'herb', name: 'Red Herb' }, qty: 3, available: 1 }, // insufficient
      ],
      output: { item: { id: 'health-potion', name: 'Health Potion' }, qty: 2 },
    },
  ]
  panel.addEventListener('tc-select', (e) => console.log('selected', e.detail.id))
  panel.addEventListener('tc-craft', (e) => {
    console.log('crafting', e.detail.id)
    panel.crafting = true
    setTimeout(() => { panel.crafting = false }, 900)
  })
</script>
```

---