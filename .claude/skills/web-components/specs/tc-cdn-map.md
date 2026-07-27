---
component: tc-cdn-map
---

### tc-cdn-map

Grid-backed surface with positioned CDN node markers. Primary nodes use the slate ink accent (`--tc-app-accent`); accent nodes use the rare cyan `--tc-accent` for highlight PoPs. Supports an accessible `aria-label` summarising the node distribution and per-node `aria-label` attributes. No slot children — set nodes via the JS `nodes` property.

**Tag:** `tc-cdn-map`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | `number \| string` | `360` | Height of the map surface. A bare integer is treated as pixels (`360` → `360px`). Any CSS length string is used directly (`"50vh"`, `"240px"`). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `nodes` | `CdnMapNode[]` | Array of node descriptors rendered as positioned markers. Each node has `top: string`, `left: string` (percentage or CSS position values), optional `label?: string`, and optional `variant?: 'primary' \| 'accent'` (defaults to primary). Setting this property triggers a re-render. |

**`CdnMapNode` shape**

```ts
interface CdnMapNode {
  top: string        // CSS top (e.g. "30%", "80px")
  left: string       // CSS left (e.g. "55%", "120px")
  label?: string     // Optional visible label (mono micro-label) and aria-label
  variant?: 'primary' | 'accent'  // Default: 'primary'
}
```

**Events**

None. `tc-cdn-map` is a purely presentational element.

**Slots**

None. The component owns its surface and all marker rendering.

**Example**

```html
<tc-cdn-map id="map" height="240"></tc-cdn-map>
<script>
  document.getElementById('map').nodes = [
    { top: '20%', left: '15%', variant: 'primary', label: 'NYC' },
    { top: '35%', left: '55%', variant: 'accent',  label: 'AMS' },
    { top: '60%', left: '30%', variant: 'primary', label: 'LAX' },
  ]
</script>
```

---