---
component: tc-rank-cell
---

### tc-rank-cell

Zero-padded rank number with tier accent for top-three positions. Gold for rank 1, silver for 2, bronze for 3, neutral slate for rank 4 and above. Designed to drop into table and list cells — sharp corners, JetBrains Mono, tabular-nums alignment. Purely presentational — no interaction, no events.

**Tag:** `tc-rank-cell`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `rank` | number (string attr) | `0` | The rank position to display. `1` → gold, `2` → silver, `3` → bronze, `4+` → default neutral. |
| `pad` | number (string attr) | `2` | Minimum digit width for zero-padding. `pad=2` renders `01`, `07`, `12`; `pad=3` renders `001`, `017`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rank` | `number` | `0` | Reflects the `rank` attribute as a parsed integer. |
| `pad` | `number` | `2` | Reflects the `pad` attribute as a parsed integer. Falls back to `2` when the attribute is absent or not a positive integer. |

**Events**

None. `tc-rank-cell` is purely presentational.

**Slots**

None. All content is driven by attributes.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-rank-cell-gold` | `#d97706` | Warm amber accent color for rank 1 (left stripe + text). |
| `--bs-rank-cell-silver` | `#94a3b8` | Slate-silver accent color for rank 2 (left stripe + text). |
| `--bs-rank-cell-bronze` | `#b45309` | Bronze-brown accent color for rank 3 (left stripe + text). |
| `--bs-rank-cell-stripe-width` | `3px` | Width of the left accent stripe. |
| `--bs-rank-cell-font-size` | `0.8125rem` | Number font size (JetBrains Mono, weight 500). |
| `--bs-rank-cell-pad-x` | `0.5rem` | Horizontal inner padding. |
| `--bs-rank-cell-pad-y` | `0.1875rem` | Vertical inner padding. |

```html
<!-- Top-three tiers -->
<tc-rank-cell rank="1" pad="2"></tc-rank-cell>
<tc-rank-cell rank="2" pad="2"></tc-rank-cell>
<tc-rank-cell rank="3" pad="2"></tc-rank-cell>

<!-- Default tier -->
<tc-rank-cell rank="4"  pad="2"></tc-rank-cell>
<tc-rank-cell rank="17" pad="2"></tc-rank-cell>

<!-- Wider pad -->
<tc-rank-cell rank="1"   pad="3"></tc-rank-cell>
<tc-rank-cell rank="100" pad="3"></tc-rank-cell>

<!-- JS property access -->
<tc-rank-cell id="r1"></tc-rank-cell>
<script>
    const el = document.getElementById('r1')
    el.rank = 1
    el.pad = 2
</script>
```
```

---