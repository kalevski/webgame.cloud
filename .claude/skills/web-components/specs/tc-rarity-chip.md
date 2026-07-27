---
component: tc-rarity-chip
---

### tc-rarity-chip

Mono uppercase rarity label chip for item tiers: Common, Uncommon, Rare, Epic, Legendary, and Mythic. Restyled to the design system — sharp corners, 1px hairline border, JetBrains Mono uppercase label, and per-rarity tinted text/border using the sanctioned token ramp. Purely presentational — no events, no slots.

**Tag:** `tc-rarity-chip`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `rarity` | `'common' \| 'uncommon' \| 'rare' \| 'epic' \| 'legendary' \| 'mythic'` | `'common'` | Item rarity tier. Invalid or absent values fall back to `'common'` |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `rarity` | `ItemRarity` | Reflects the `rarity` attribute. Setter validates against the enum list; invalid values set `'common'` |

**Slots**

None. `tc-rarity-chip` renders entirely from its attributes.

**Events**

None. `tc-rarity-chip` is a purely presentational element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-rarity-chip-padding-x` | `0.5rem` | Horizontal padding |
| `--bs-rarity-chip-padding-y` | `0.1875rem` | Vertical padding |
| `--bs-rarity-chip-font-size` | `0.6875rem` | Label font size |
| `--bs-rarity-chip-font-weight` | `600` | Label font weight |
| `--bs-rarity-chip-letter-spacing` | `0.08em` | Uppercase letter spacing |
| `--bs-rarity-chip-bg` | `var(--tc-surface-muted)` | Chip background fill (overridden per rarity) |
| `--bs-rarity-chip-color` | `var(--tc-text-muted)` | Label text/border color (overridden per rarity) |
| `--bs-rarity-chip-border-color` | `var(--tc-border)` | Hairline border color (overridden per rarity) |
| `--bs-rarity-chip-border-width` | `1px` | Border width |

```html
<!-- All six rarity tiers -->
<tc-rarity-chip rarity="common"></tc-rarity-chip>
<tc-rarity-chip rarity="uncommon"></tc-rarity-chip>
<tc-rarity-chip rarity="rare"></tc-rarity-chip>
<tc-rarity-chip rarity="epic"></tc-rarity-chip>
<tc-rarity-chip rarity="legendary"></tc-rarity-chip>
<tc-rarity-chip rarity="mythic"></tc-rarity-chip>

<!-- Default (rarity omitted → common) -->
<tc-rarity-chip></tc-rarity-chip>

<!-- JS property -->
<tc-rarity-chip id="chip"></tc-rarity-chip>
<script>
  document.getElementById('chip').rarity = 'rare'
</script>
```

---