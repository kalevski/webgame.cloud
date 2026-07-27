---
component: tc-tier-ladder
---

### tc-tier-ladder

Ranked tier ladder with color-coded identity dots and a current-tier indicator. Tiers are set via a JS property; the current tier is highlighted with an ink-accent left marker and a check icon. Sharp corners on all rectangles; the only curve is the circular color dot. Color is identity-only on the dot, never as a full-row fill.

**Tag:** `tc-tier-ladder`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string \| null` | `null` | Optional heading rendered above the tier list. |
| `current-tier-id` | `string \| null` | `null` | The `id` of the tier to mark as current. Highlighted with a left accent marker and a check icon. |
| `summary` | `string \| null` | `null` | Optional footer line rendered below the tier list (e.g. season/scoring info). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `tiers` | `TierItem[]` | Array of tier objects. Set via `el.tiers = [...]`. Setting triggers a re-render. |
| `title` | `string` | Reflects the `title` attribute. |
| `currentTierId` | `string \| null` | Reflects the `current-tier-id` attribute (camelCase). |
| `summary` | `string \| null` | Reflects the `summary` attribute. |

`TierItem` shape:

```ts
type TierColor = 'gray' | 'cyan' | 'yellow' | 'pink' | 'red'

interface TierItem {
    id: string        // unique identifier used for current-tier-id matching
    name: string      // display name of the tier
    range: string     // score/point range shown in mono font (e.g. "1000–1499")
    color?: TierColor // dot color; defaults to 'gray'
}
```

Color mapping: `gray` → slate/muted, `cyan` → `--tc-accent`, `yellow` → `--tc-warning`, `pink` / `red` → `--tc-danger` family.

**Events**

None. `tc-tier-ladder` is purely presentational.

**Slots**

None. All content is driven by attributes and the `tiers` JS property.

**Accessibility**

- The tier list is an `<ol>` with native list semantics.
- The current tier row carries `aria-current="true"`.
- The color dot is decorative (`aria-hidden="true"`); tier meaning is carried by the tier name text alone.
- The current-tier check icon is wrapped in a `<span>` with `aria-label="Current tier"`.
- `prefers-reduced-motion` is honoured: row hover transitions are disabled.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-tier-ladder-title-color` | `var(--tc-text)` | Title text colour. |
| `--bs-tier-ladder-title-font-size` | `0.925rem` | Title font size. |
| `--bs-tier-ladder-title-font-weight` | `600` | Title font weight. |
| `--bs-tier-ladder-border` | `var(--tc-border)` | Outer 1px hairline border around the list. |
| `--bs-tier-ladder-row-separator` | `var(--tc-surface-muted)` | 1px separator between rows. |
| `--bs-tier-ladder-dot-size` | `0.625rem` | Diameter of the circular color dot. |
| `--bs-tier-ladder-dot-gray` | `var(--tc-text-faint)` | Gray dot colour (default). |
| `--bs-tier-ladder-dot-cyan` | `var(--tc-accent)` | Cyan dot colour. |
| `--bs-tier-ladder-dot-yellow` | `var(--tc-warning)` | Yellow dot colour. |
| `--bs-tier-ladder-dot-pink` | `var(--tc-danger)` | Pink dot colour. |
| `--bs-tier-ladder-dot-red` | `var(--tc-danger)` | Red dot colour. |
| `--bs-tier-ladder-name-color` | `var(--tc-text)` | Tier name text colour. |
| `--bs-tier-ladder-range-color` | `var(--tc-text-muted)` | Range mono label colour. |
| `--bs-tier-ladder-current-border` | `var(--tc-app-accent)` | Left accent marker colour for current tier. |
| `--bs-tier-ladder-current-bg` | `rgba(30,41,59,0.04)` | Subtle background tint for current tier row. |
| `--bs-tier-ladder-summary-color` | `var(--tc-text-faint)` | Summary footer text colour. |

```html
<!-- League ladder with title, current tier, and summary -->
<tc-tier-ladder id="league" title="League Standings" current-tier-id="gold"
    summary="Points reset at the start of each season.">
</tc-tier-ladder>
<script>
document.getElementById('league').tiers = [
    { id: 'diamond',  name: 'Diamond',  range: '2000–∞',    color: 'cyan'   },
    { id: 'platinum', name: 'Platinum', range: '1500–1999', color: 'gray'   },
    { id: 'gold',     name: 'Gold',     range: '1000–1499', color: 'yellow' },
    { id: 'silver',   name: 'Silver',   range: '500–999',   color: 'gray'   },
    { id: 'bronze',   name: 'Bronze',   range: '0–499',     color: 'red'    },
]
</script>

<!-- Rank ladder — no title, no summary -->
<tc-tier-ladder id="rank" current-tier-id="b"></tc-tier-ladder>
<script>
document.getElementById('rank').tiers = [
    { id: 's', name: 'S Rank', range: '95–100', color: 'pink'   },
    { id: 'a', name: 'A Rank', range: '80–94',  color: 'yellow' },
    { id: 'b', name: 'B Rank', range: '65–79',  color: 'cyan'   },
    { id: 'c', name: 'C Rank', range: '50–64',  color: 'gray'   },
    { id: 'd', name: 'D Rank', range: '0–49',   color: 'gray'   },
]
</script>

<!-- Empty state -->
<tc-tier-ladder title="No tiers yet"></tc-tier-ladder>
```

---