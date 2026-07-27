---
component: tc-ability-card
---

### tc-ability-card

Ability portrait tile: an icon chip, a rarity micro-label, the ability name, an optional hotkey (keybind), a description, and a meta grid of cooldown / cost / range. Styled to the toolcase design system — flat slate surface, hairline borders, sharp corners, mono machine-text, and a single muted rarity accent. Purely attribute-driven and presentational.

**Tag:** `tc-ability-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `ability-name` | string | — | The ability's display name (slate ink, weight 600). |
| `icon` | string | — | PascalCase Lucide icon name (e.g. `"Zap"`, `"Shield"`). Rendered as inline SVG inside the icon chip; unknown names render an empty (hidden) chip. |
| `description` | string | — | Body description text. Hidden when absent. |
| `cooldown` | string | — | Cooldown value (e.g. `"8s"`). Rendered as a meta row when present. |
| `cost` | string | — | Resource cost (e.g. `"40 mana"`). Rendered as a meta row when present. |
| `range` | string | — | Range value (e.g. `"600"`). Rendered as a meta row when present. |
| `keybind` | string | — | Hotkey label rendered as a mono `kbd` cap to the right of the name. Hidden when absent. |
| `rarity` | `'common' \| 'uncommon' \| 'rare' \| 'epic' \| 'legendary'` | `'common'` | Tier label rendered as a mono uppercase micro-label, tinted by a muted accent. Reflected onto the host as `data-rarity` for theming. Unknown values fall back to `'common'`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `abilityName` | `string` | Reflects the `ability-name` attribute. |
| `icon` | `string` | Reflects the `icon` attribute. |
| `description` | `string` | Reflects the `description` attribute. |
| `cooldown` | `string` | Reflects the `cooldown` attribute. |
| `cost` | `string` | Reflects the `cost` attribute. |
| `range` | `string` | Reflects the `range` attribute. |
| `keybind` | `string` | Reflects the `keybind` attribute. |
| `rarity` | `AbilityCardRarity` | Reflects the `rarity` attribute (validated; falls back to `'common'`). |

**Events**

None. `tc-ability-card` is purely presentational.

**Named Slots**

None. All content is attribute-driven.

**Accessibility**

- The icon chip carries `aria-hidden="true"` — it is decorative; the ability name is the readable label.
- The hotkey is rendered in a semantic `<kbd>` element.
- `prefers-reduced-motion` retains the `box-shadow` hover transition but freezes the `translateY(-1px)` lift.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-ability-card-bg` | `var(--tc-surface)` | Card background colour. |
| `--bs-ability-card-border-color` | `var(--tc-border)` | 1 px hairline border colour. |
| `--bs-ability-card-shadow` | `var(--tc-shadow-sm)` | Box shadow at rest. |
| `--bs-ability-card-shadow-hover` | `var(--tc-shadow-hover)` | Box shadow on hover. |
| `--bs-ability-card-padding-y` | `1rem` | Vertical padding. |
| `--bs-ability-card-padding-x` | `1rem` | Horizontal padding. |
| `--bs-ability-card-gap` | `0.75rem` | Gap between head, description, and meta regions. |
| `--bs-ability-card-head-gap` | `0.75rem` | Gap between icon, name block, and keybind. |
| `--bs-ability-card-icon-bg` | `var(--tc-surface-muted)` | Icon chip background. |
| `--bs-ability-card-icon-color` | `var(--tc-text)` | Icon glyph colour. |
| `--bs-ability-card-icon-size` | `1.375rem` | Icon SVG width/height inside the chip. |
| `--bs-ability-card-icon-tile-size` | `2.75rem` | Width and height of the icon chip square. |
| `--bs-ability-card-rarity-color` | `var(--tc-text-faint)` | Rarity micro-label colour (overridden per `data-rarity`). |
| `--bs-ability-card-name-color` | `var(--tc-text)` | Ability name colour. |
| `--bs-ability-card-name-weight` | `600` | Ability name font weight. |
| `--bs-ability-card-desc-color` | `var(--tc-text-muted)` | Description text colour. |
| `--bs-ability-card-keybind-bg` | `var(--tc-surface-muted)` | Hotkey cap background. |
| `--bs-ability-card-keybind-border` | `var(--tc-border-strong)` | Hotkey cap border colour. |
| `--bs-ability-card-keybind-color` | `var(--tc-text)` | Hotkey cap text colour. |
| `--bs-ability-card-meta-border` | `var(--tc-border)` | Top hairline above the meta grid. |
| `--bs-ability-card-meta-row-border` | `var(--tc-surface-muted)` | Hairline between meta rows. |
| `--bs-ability-card-meta-label-color` | `var(--tc-text-faint)` | Meta label (mono micro) colour. |
| `--bs-ability-card-meta-value-color` | `var(--tc-text)` | Meta value (mono) colour. |

Per-rarity accent overrides (applied via `tc-ability-card[data-rarity='…']`): `uncommon` → `var(--tc-success)`, `rare` → `var(--tc-info)`, `epic` → `var(--tc-app-accent)`, `legendary` → `var(--tc-warning)`.

```html
<!-- Full card -->
<tc-ability-card
    ability-name="Arc Lightning"
    icon="Zap"
    rarity="rare"
    keybind="Q"
    description="Chains a bolt between nearby enemies."
    cooldown="8s"
    cost="40 mana"
    range="600"
></tc-ability-card>

<!-- Legendary, no description -->
<tc-ability-card
    ability-name="Meteor"
    icon="Sparkles"
    rarity="legendary"
    keybind="R"
    cooldown="120s"
    cost="200 mana"
></tc-ability-card>

<!-- Minimal — name only -->
<tc-ability-card ability-name="Basic Attack"></tc-ability-card>
```

---