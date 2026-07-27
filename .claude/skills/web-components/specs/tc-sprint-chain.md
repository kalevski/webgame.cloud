---
component: tc-sprint-chain
---

### tc-sprint-chain

Timeline/chain visualization of sprint items with past, current (now), and future states. Renders as an ordered list with circular node markers and hairline connector lines. States are derived automatically from `current-id` or supplied explicitly per item.

**Tag:** `tc-sprint-chain`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current-id` | string | `""` | The `id` of the item considered "current". Items before it are `past`, the matching item is `now`, items after are `future`. When no item matches, all items are `future`. |
| `columns` | number | items.length | Number of columns in the grid. Defaults to the total item count (single row). Set to a smaller value for multi-row layouts. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `SprintChainItem[]` | Array of sprint items to render. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `currentId` | `string` | Reflects the `current-id` attribute. |
| `columns` | `number \| null` | Reflects the `columns` attribute. |

`SprintChainItem` shape:
```ts
interface SprintChainItem {
    id: string                          // unique identifier; matched against current-id
    label: string                       // text shown below the node marker
    tag?: string                        // optional monospace micro-label shown below label
    state?: SprintChainState            // explicit state override; omit to derive from current-id
}
```

`SprintChainState` type:
```ts
type SprintChainState = 'past' | 'now' | 'future'
```

State derivation (mirrors `SprintChain.tsx`):
- If `item.state` is set explicitly, it is used as-is.
- Otherwise: find the index of the item whose `id === current-id`. Items before it → `past`; the matching item → `now`; items after → `future`. If no item matches `current-id`, all items are `future`.

**Events**

None. `tc-sprint-chain` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `header` | Content placed in the left side of the optional header row above the chain. |
| `header-end` | Content placed in the right side of the optional header row. |

The header row is rendered only when at least one header slot child is present.

**Accessibility**

Items are rendered as an `<ol>`/`<li>` list. The current item carries `aria-current="step"`. Node markers are decorative (`aria-hidden="true"`).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-sprint-chain-node-size` | `0.875rem` | Diameter of the circular node marker. |
| `--bs-sprint-chain-connector-color` | `var(--tc-border)` | Hairline connector colour between nodes. |
| `--bs-sprint-chain-label-font-size` | `0.8125rem` | Font size of item labels. |
| `--bs-sprint-chain-label-font-weight` | `400` | Font weight of item labels (default/future state). |
| `--bs-sprint-chain-label-color` | `var(--tc-text-muted)` | Default label colour. |
| `--bs-sprint-chain-tag-font-size` | `0.6875rem` | Font size of item tags. |
| `--bs-sprint-chain-tag-color` | `var(--tc-text-faint)` | Tag text colour. |
| `--bs-sprint-chain-past-node-bg` | `var(--tc-border-strong)` | `past` node fill. |
| `--bs-sprint-chain-past-node-border` | `var(--tc-border-strong)` | `past` node border colour. |
| `--bs-sprint-chain-past-label-color` | `var(--tc-text-faint)` | `past` label colour. |
| `--bs-sprint-chain-now-node-bg` | `var(--tc-app-accent)` | `now` node fill. |
| `--bs-sprint-chain-now-node-border` | `var(--tc-app-accent)` | `now` node border colour. |
| `--bs-sprint-chain-now-label-color` | `var(--tc-text)` | `now` label colour. |
| `--bs-sprint-chain-now-label-font-weight` | `600` | `now` label weight. |
| `--bs-sprint-chain-future-node-bg` | `var(--tc-surface)` | `future` hollow node background. |
| `--bs-sprint-chain-future-node-border` | `var(--tc-border)` | `future` node ring colour. |
| `--bs-sprint-chain-future-label-color` | `var(--tc-text-muted)` | `future` label colour. |

```html
<!-- Basic chain — states derived from current-id -->
<tc-sprint-chain id="sc1" current-id="sp3"></tc-sprint-chain>
<script>
    document.getElementById('sc1').items = [
        { id: 'sp1', label: 'Sprint 1', tag: 'v1.0.0' },
        { id: 'sp2', label: 'Sprint 2', tag: 'v1.1.0' },
        { id: 'sp3', label: 'Sprint 3', tag: 'v1.2.0' },
        { id: 'sp4', label: 'Sprint 4', tag: 'v2.0.0' },
    ]
</script>

<!-- Multi-row with columns=3 and header slots -->
<tc-sprint-chain id="sc2" current-id="q4" columns="3">
    <span slot="header">Quarterly sprints</span>
    <span slot="header-end">FY 2026</span>
</tc-sprint-chain>
<script>
    document.getElementById('sc2').items = [
        { id: 'q1', label: 'Q1 Sprint 1', tag: 'Jan' },
        { id: 'q2', label: 'Q1 Sprint 2', tag: 'Feb' },
        { id: 'q3', label: 'Q1 Sprint 3', tag: 'Mar' },
        { id: 'q4', label: 'Q2 Sprint 1', tag: 'Apr' },
        { id: 'q5', label: 'Q2 Sprint 2', tag: 'May' },
        { id: 'q6', label: 'Q2 Sprint 3', tag: 'Jun' },
    ]
</script>

<!-- Explicit per-item state override -->
<tc-sprint-chain id="sc3"></tc-sprint-chain>
<script>
    document.getElementById('sc3').items = [
        { id: 'a', label: 'Discovery', state: 'past' },
        { id: 'b', label: 'Design',    state: 'past' },
        { id: 'c', label: 'Build',     state: 'now' },
        { id: 'd', label: 'Review',    state: 'future' },
        { id: 'e', label: 'Ship',      state: 'future' },
    ]
</script>
```

---