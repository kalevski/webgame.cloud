---
component: tc-shop-panel
---

### tc-shop-panel

Shop UI with an item grid, prices, optional discounts, and buy/sell actions. Styled to the toolcase design system — slate neutrals, sharp corners, 1px hairlines, JetBrains Mono for prices and currency. No Shadow DOM. All cosmetics flow through `--bs-shop-panel-*` custom properties.

**Tag:** `tc-shop-panel`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `sell-mode` | boolean | `false` | When present, the header shows "Sell Items" and action buttons are labelled "Sell"; fires `tc-sell` instead of `tc-buy`. |
| `currency` | number | — | Player's current balance shown as a chip in the header. When absent no balance chip is shown. |
| `currency-icon` | string | `◆` | Symbol or text prefix displayed before the currency amount and item prices. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `items` | `ShopItem[]` | `[]` | Array of shop items to render. Each item is `{ item: { id, name?, icon? }, price, discount?, soldOut? }`. Setting this property triggers a re-render. |
| `onBuy` | `((id: string) => void) \| null` | `null` | Callback fired alongside the `tc-buy` event. |
| `onSell` | `((id: string) => void) \| null` | `null` | Callback fired alongside the `tc-sell` event. |

#### Events

| Event | Detail | Description |
|---|---|---|
| `tc-buy` | `{ id: string }` | Fired when the Buy button is clicked. `id` is the item's `item.id`. Only fires in buy mode (no `sell-mode` attribute) and when the button is not disabled. |
| `tc-sell` | `{ id: string }` | Fired when the Sell button is clicked. `id` is the item's `item.id`. Only fires when `sell-mode` is set. |

#### Slots

None. All content is driven by the `items` JS property.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-shop-panel-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-shop-panel-border` | `1px solid var(--tc-border)` | Outer 1px hairline border. |
| `--bs-shop-panel-header-bg` | `var(--tc-surface-muted)` | Header section background. |
| `--bs-shop-panel-header-border` | `1px solid var(--tc-border)` | Header bottom border. |
| `--bs-shop-panel-mode-label-color` | `var(--tc-text-muted)` | Mode eyebrow label colour. |
| `--bs-shop-panel-mode-label-font-size` | `0.6875rem` | Mode eyebrow label font size. |
| `--bs-shop-panel-currency-bg` | `var(--tc-surface)` | Currency chip background. |
| `--bs-shop-panel-currency-border` | `1px solid var(--tc-border-strong)` | Currency chip border. |
| `--bs-shop-panel-currency-color` | `var(--tc-text)` | Currency chip text colour. |
| `--bs-shop-panel-currency-font-size` | `0.75rem` | Currency chip font size. |
| `--bs-shop-panel-row-border` | `1px solid var(--tc-slate-100)` | Row separator hairline. |
| `--bs-shop-panel-row-hover-bg` | `var(--tc-surface-hover)` | Row hover background. |
| `--bs-shop-panel-sold-out-opacity` | `0.45` | Opacity for sold-out rows. |
| `--bs-shop-panel-unaffordable-opacity` | `0.5` | Opacity for rows the player cannot afford. |
| `--bs-shop-panel-icon-font-size` | `0.875rem` | Item icon font size. |
| `--bs-shop-panel-icon-color` | `var(--tc-text-faint)` | Item icon colour. |
| `--bs-shop-panel-name-font-size` | `0.8125rem` | Item name font size. |
| `--bs-shop-panel-name-color` | `var(--tc-text)` | Item name colour. |
| `--bs-shop-panel-price-font-size` | `0.75rem` | Price font size. |
| `--bs-shop-panel-price-color` | `var(--tc-text)` | Price colour. |
| `--bs-shop-panel-price-old-color` | `var(--tc-text-faint)` | Strikethrough original price colour. |
| `--bs-shop-panel-discount-bg` | `#dcfce7` | Discount badge background. |
| `--bs-shop-panel-discount-color` | `var(--tc-success)` | Discount badge text colour. |
| `--bs-shop-panel-discount-font-size` | `0.6875rem` | Discount badge font size. |
| `--bs-shop-panel-btn-font-size` | `0.75rem` | Action button font size. |
| `--bs-shop-panel-btn-min-height` | `1.75rem` | Action button minimum height. |
| `--bs-shop-panel-btn-bg` | `var(--tc-app-accent)` | Action button background. |
| `--bs-shop-panel-btn-color` | `#fff` | Action button text colour. |
| `--bs-shop-panel-btn-border` | `1px solid var(--tc-app-accent)` | Action button border. |
| `--bs-shop-panel-btn-hover-bg` | `var(--tc-surface)` | Action button hover background. |
| `--bs-shop-panel-btn-hover-color` | `var(--tc-app-accent)` | Action button hover text colour. |
| `--bs-shop-panel-btn-hover-border` | `1px solid var(--tc-app-accent)` | Action button hover border. |
| `--bs-shop-panel-btn-disabled-opacity` | `0.45` | Disabled button opacity. |
| `--bs-shop-panel-empty-color` | `var(--tc-text-faint)` | Empty-state text colour. |

#### Example

```html
<!-- Buy mode with currency balance -->
<tc-shop-panel id="shop" currency="500" currency-icon="◆"></tc-shop-panel>

<script>
  const shop = document.querySelector('#shop')
  shop.items = [
    { item: { id: 'health-potion', name: 'Health Potion', icon: '⊕' }, price: 50 },
    { item: { id: 'sword', name: 'Iron Sword', icon: '◆' }, price: 250 },
    { item: { id: 'shield', name: 'Dragon Shield', icon: '◈' }, price: 999, soldOut: true },
  ]
  shop.addEventListener('tc-buy', e => console.log('Bought:', e.detail.id))
</script>

<!-- Sell mode -->
<tc-shop-panel sell-mode id="sellShop"></tc-shop-panel>

<script>
  const sellShop = document.querySelector('#sellShop')
  sellShop.items = [
    { item: { id: 'old-dagger', name: 'Old Dagger', icon: '◇' }, price: 30 },
  ]
  sellShop.addEventListener('tc-sell', e => console.log('Sold:', e.detail.id))
</script>

<!-- Discounted items -->
<tc-shop-panel currency="200" currency-icon="$" id="discShop"></tc-shop-panel>

<script>
  document.querySelector('#discShop').items = [
    { item: { id: 'elixir', name: 'Elixir', icon: '✦' }, price: 100, discount: 0.3 },
  ]
</script>
```