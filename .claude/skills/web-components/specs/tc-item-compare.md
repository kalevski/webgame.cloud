---
component: tc-item-compare
---

### tc-item-compare

A side-by-side item stat comparison: a `current` (equipped) item next to a `candidate`, with the candidate column annotated by a per-stat **difference** block. Numeric stats shared between the two items are diffed (`candidate − current`); non-zero diffs render with a status-coloured arrow (green up / red down) and a signed value. Styled to the toolcase design system: two columns share a single hairline frame with a 1px internal separator, machine-facing figures are mono and tabular, and status colour appears only on the delta arrows. No slot children — set items via the JS `current` / `candidate` properties.

**Tag:** `tc-item-compare`

**Attributes**

None. The component is driven entirely by its JS properties (mirrors the source's empty `observedAttributes`).

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `current` | `CompareItem \| null` | The equipped item, shown in the left ("Equipped") column. Setting this property triggers a re-render. Non-object values reset to `null` (empty placeholder). |
| `candidate` | `CompareItem \| null` | The candidate item, shown in the right ("Candidate") column with the difference block. Setting this property triggers a re-render. Non-object values reset to `null` (empty placeholder). |

**`CompareItem` shape**

```ts
interface CompareStat {
  label: string            // human-readable stat name
  value: string | number   // numeric values drive the delta diff; strings are shown verbatim and excluded
}

interface CompareItem {
  id?: string
  name?: string            // item name (the column heading)
  typeLabel?: string       // optional mono type micro-label above the name
  stats?: CompareStat[]    // comparable stat list
}
```

**Events**

None. The component is presentational.

**Slots**

None. The component renders both columns from the `current` / `candidate` properties.

**CSS custom properties** (cosmetics flow through `--bs-item-compare-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-item-compare-surface` | `var(--tc-surface)` | Column background |
| `--bs-item-compare-border-color` | `var(--tc-border)` | Outer hairline frame |
| `--bs-item-compare-separator-color` | `var(--tc-border)` | 1px column separator and the deltas top rule |
| `--bs-item-compare-col-padding` | `0.875rem` | Column inner padding |
| `--bs-item-compare-name-color` | `var(--tc-text)` | Item name color |
| `--bs-item-compare-stat-label-color` | `var(--tc-text-muted)` | Stat label color |
| `--bs-item-compare-stat-value-color` | `var(--tc-text)` | Stat value color |
| `--bs-item-compare-empty-color` | `var(--tc-text-faint)` | Empty-column placeholder color |
| `--bs-item-compare-delta-up-color` | `var(--tc-success)` | Positive delta (arrow + value) color |
| `--bs-item-compare-delta-down-color` | `var(--tc-danger)` | Negative delta (arrow + value) color |
| `--bs-item-compare-delta-label-color` | `var(--tc-text-muted)` | Delta-row label color |

**Example**

```html
<tc-item-compare id="cmp"></tc-item-compare>
<script>
  const cmp = document.getElementById('cmp')
  cmp.current = {
    id: 'iron-sword', name: 'Iron Sword', typeLabel: 'One-Handed Sword',
    stats: [{ label: 'Damage', value: 42 }, { label: 'Attack Speed', value: 1.2 }, { label: 'Weight', value: 6 }],
  }
  cmp.candidate = {
    id: 'steel-saber', name: 'Steel Saber', typeLabel: 'One-Handed Sword',
    stats: [{ label: 'Damage', value: 58 }, { label: 'Attack Speed', value: 1.1 }, { label: 'Weight', value: 8 }],
  }
  // Candidate column shows: Damage +16 (up), Attack Speed -0.1 (down), Weight +2 (up)
</script>
```

---