---
component: tc-buff-bar
---

### tc-buff-bar

A horizontal row of active buff / debuff status icons, each composed from `tc-buff-icon`. Every entry can carry a duration (rendered as a mono caption and an optional radial cooldown sweep) and a stack count (a small mono ink badge). Styled to the toolcase design system — flat slate tiles, hairline borders, sharp corners, mono machine-text, and a single status accent stripe distinguishing buffs from debuffs. The entry list is driven by the `buffs` JS property; only the icon size and inter-icon gap are attributes. Purely presentational: no events. Renders a `role="list"` of `role="listitem"` cells, each labelled by its entry `name`.

**Tag:** `tc-buff-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `icon-size` | number | `36` | Pixel size of each composed `tc-buff-icon` tile. Non-positive / non-numeric values fall back to `36`. |
| `gap` | string | `"6px"` | Any CSS length used as the gap between icons (written to `--bs-buff-bar-gap`). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `buffs` | `BuffEntry[]` | The active buffs/debuffs to render. Set as a JS property (not an attribute); re-renders the bar. Non-array values reset to `[]`. |
| `iconSize` | `number` | Reflects the `icon-size` attribute. |
| `gap` | `string` | Reflects the `gap` attribute. |

`BuffEntry` shape: `{ id: string; icon?: string; name?: string; remaining?: number; duration?: number; stacks?: number; debuff?: boolean }`. `icon` is a [lucide](https://lucide.dev) icon name (e.g. `"Flame"`); an unknown name falls back to its escaped text. `remaining` is the seconds left (formatted as `Ns` or `NmNs`); when both `remaining` and `duration` are present a radial cooldown sweep dims the spent fraction. `stacks` greater than `1` renders a `×N` badge. `debuff: true` flips the entry to the danger accent.

**Events**

None. `tc-buff-bar` is a purely presentational element.

**Slots**

None. Content is driven by the `buffs` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-buff-bar-gap` | `6px` | Gap between buff icons (also settable via the `gap` attribute). |
| `--bs-buff-bar-cooldown-overlay` | `rgba(15, 23, 42, 0.55)` | Translucent ink mask dimming the spent portion of a cooldown sweep. |
| `--bs-buff-bar-stack-bg` | `var(--tc-app-accent)` | Stack-count badge background. |
| `--bs-buff-bar-stack-color` | `var(--tc-surface)` | Stack-count badge text color. |
| `--bs-buff-bar-stack-font-size` | `0.5625rem` | Stack-count badge font size. |

Each entry's tile is themed through the `tc-buff-icon` custom properties below.

**Example**

```html
<tc-buff-bar id="buffs"></tc-buff-bar>
<script>
    document.getElementById('buffs').buffs = [
        { id: 'haste', icon: 'Zap', name: 'Haste', remaining: 12, duration: 20 },
        { id: 'regen', icon: 'Heart', name: 'Regeneration', remaining: 45, duration: 60, stacks: 3 },
        { id: 'poison', icon: 'Skull', name: 'Poison', remaining: 6, duration: 10, debuff: true },
    ]
</script>

<!-- Larger icons and a wider gap -->
<tc-buff-bar id="big" icon-size="48" gap="12px"></tc-buff-bar>
```

---