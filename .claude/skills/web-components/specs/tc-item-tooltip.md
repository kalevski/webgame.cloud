---
component: tc-item-tooltip
---

### tc-item-tooltip

A hover card describing an item: an optional mono **type** micro-label, the item **name**, a **rarity** chip, a **stat** list, an optional **requirements** block (each marked met / unmet), and optional **flavor** text. Set the item via the JS `item` property. Styled to the toolcase design system: a sharp hairline surface at the overlay tier (`shadow-lg`, on the fixed `--tc-z-tooltip` layer), machine-facing figures are mono and tabular, and status colour is spent only on the rarity chip and the requirement met / unmet markers (each marker pairs a status colour with a lucide check / x icon so colour is never the sole signal). The consumer owns positioning. No slot children — set the item via the JS `item` property; with no item the host hides itself.

**Tag:** `tc-item-tooltip`

**Attributes**

None. The component is driven entirely by its JS `item` property (mirrors the source's empty `observedAttributes`). The host reflects `role="tooltip"`, `data-rarity="…"`, and `data-empty` for styling / accessibility.

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `item` | `TooltipItem \| null` | The item to describe. Setting this property triggers a re-render. Non-object values reset to `null`, which clears the content and hides the host (`data-empty`). |

**`TooltipItem` shape**

```ts
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

interface TooltipItem {
  id: string
  name?: string                                  // the heading
  typeLabel?: string                             // optional mono type micro-label above the name
  rarity?: ItemRarity                            // drives the rarity chip + data-rarity accent (default 'common')
  stats?: { label: string; value: string | number }[]                    // numbers are mono + tabular + localized
  requirements?: { label: string; value: string | number; met?: boolean }[]  // met → green ✓, unmet → red ✗, absent → neutral
  flavor?: string                                // optional closing italic flavour text
  // ...remaining InventoryItem fields (icon, qty, cooldown, equipped, locked) are accepted but not rendered here
}
```

**Events**

None. The component is presentational.

**Slots**

None. The component renders its content from the `item` property.

**CSS custom properties** (cosmetics flow through `--bs-item-tooltip-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-item-tooltip-surface` | `var(--tc-surface)` | Card background |
| `--bs-item-tooltip-border-color` | `var(--tc-border)` | Outer hairline frame |
| `--bs-item-tooltip-separator-color` | `var(--tc-border)` | Hairline rule above the requirements / flavor sections |
| `--bs-item-tooltip-shadow` | `var(--tc-shadow-lg)` | Overlay-tier drop shadow |
| `--bs-item-tooltip-padding` | `0.875rem` | Card inner padding |
| `--bs-item-tooltip-max-width` | `18rem` | Card max width |
| `--bs-item-tooltip-name-color` | `var(--tc-text)` | Item name color |
| `--bs-item-tooltip-name-font-size` | `0.975rem` | Item name font size |
| `--bs-item-tooltip-name-font-weight` | `600` | Item name font weight |
| `--bs-item-tooltip-stat-label-color` | `var(--tc-text-muted)` | Stat label color |
| `--bs-item-tooltip-stat-value-color` | `var(--tc-text)` | Stat value color |
| `--bs-item-tooltip-stat-font-size` | `0.8125rem` | Stat / requirement row font size |
| `--bs-item-tooltip-req-label-color` | `var(--tc-text-muted)` | Requirement label color |
| `--bs-item-tooltip-req-value-color` | `var(--tc-text)` | Requirement value color (neutral / absent `met`) |
| `--bs-item-tooltip-req-met-color` | `var(--tc-success)` | Met requirement color (value + ✓) |
| `--bs-item-tooltip-req-unmet-color` | `var(--tc-danger)` | Unmet requirement color (value + ✗) |
| `--bs-item-tooltip-flavor-color` | `var(--tc-text-muted)` | Flavor text color |
| `--bs-item-tooltip-flavor-font-size` | `0.8125rem` | Flavor text font size |
| `--bs-item-tooltip-rarity-color` | `var(--tc-text-muted)` | Rarity chip color (overridden per `data-rarity`) |

Per-rarity chip accent (applied via `tc-item-tooltip[data-rarity='…']`): `uncommon` → `var(--tc-success)`, `rare` → `var(--tc-info)`, `epic` → `var(--tc-app-accent)`, `legendary` → `var(--tc-warning)`, `mythic` → `var(--tc-danger)`. `common` keeps the neutral muted default.

**Example**

```html
<tc-item-tooltip id="tip"></tc-item-tooltip>
<script>
  document.getElementById('tip').item = {
    id: 'dawnbreaker',
    name: 'Dawnbreaker',
    typeLabel: 'Two-Handed Greatsword',
    rarity: 'legendary',
    stats: [
      { label: 'Damage', value: 124 },
      { label: 'Attack Speed', value: 0.9 },
      { label: 'Quality', value: 'Pristine' },
    ],
    requirements: [
      { label: 'Level', value: 40, met: true },
      { label: 'Strength', value: 28, met: false },
    ],
    flavor: 'Forged in the first light, it remembers every dawn it has seen.',
  }
</script>
```

---