---
component: tc-virtual-list
---

### tc-virtual-list

Virtualized list for efficiently rendering very large datasets. Only the rows inside the scroll window (plus an overscan margin) are kept in the DOM; a full-height sizer reproduces the scrollbar geometry and the visible rows are positioned with a single `translateY`. Supports fixed or variable (per-index) row heights via a cumulative-offset table, recomputes on `items`/`itemHeight`/`height` changes and on container resize (ResizeObserver), and reads scroll metrics once per animation frame to avoid layout thrash. Dispatches `tc-end-reached` when the scroll position passes the bottom threshold — wire it for lazy loading. The viewport is a `role="list"` panel (keyboard-scrollable via arrow/Page keys) and each row is a `role="listitem"` carrying accurate `aria-setsize`/`aria-posinset`. Sharp corners; slate neutrals only.

**Tag:** `tc-virtual-list`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `height` | number | `320` | Pixel height of the scroll viewport. |
| `overscan` | number | `3` | Extra rows rendered above and below the visible window. |
| `end-reached-threshold` | number | `200` | Distance in px from the bottom that triggers `tc-end-reached`. |

**JS Properties** (set via a DOM ref — these are not attributes)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `any[]` | `[]` | The dataset. Setting it recomputes the virtual window. |
| `itemHeight` | `number \| ((index: number) => number)` | `40` | Fixed px height, or a function returning the height of row `index` (variable heights are supported via a cumulative-offset table). |
| `renderItem` | `(item: any, index: number) => string \| Node` | `null` | Returns the contents of each row — an HTML string or a DOM `Node`. |
| `height` | `number` | `320` | Reflects the `height` attribute. |
| `overscan` | `number` | `3` | Reflects the `overscan` attribute. |
| `endReachedThreshold` | `number` | `200` | Reflects the `end-reached-threshold` attribute. |
| `onEndReached` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-end-reached` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-end-reached` | `{}` | Fired once when `scrollTop + clientHeight >= scrollHeight - endReachedThreshold`. Re-arms when the user scrolls back up (or when newly-appended items push the content past the threshold). |

**Slots:** none — content is produced by the `renderItem` property, not light-DOM children.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-virtual-list-bg` | `var(--tc-surface)` | Viewport panel background. |
| `--bs-virtual-list-border` | `var(--tc-border)` | 1px outer hairline frame. |
| `--bs-virtual-list-row-separator` | `var(--tc-slate-100)` | Fainter inner row separators. |
| `--bs-virtual-list-row-hover-bg` | `var(--tc-surface-hover)` | Row hover well. |
| `--bs-virtual-list-row-padding` | `0 0.875rem` | Row padding. |
| `--bs-virtual-list-row-color` | `var(--tc-text)` | Row text color. |
| `--bs-virtual-list-row-font-size` | `0.875rem` | Row font size. |
| `--bs-virtual-list-scrollbar-size` | `8px` | Thin scrollbar width/height. |
| `--bs-virtual-list-thumb-color` | `var(--tc-border-strong)` | Scrollbar thumb color. |
| `--bs-virtual-list-track-color` | `transparent` | Scrollbar track color. |

**Example**

```html
<tc-virtual-list id="list" height="400" overscan="4" end-reached-threshold="240"></tc-virtual-list>

<script>
  const list = document.getElementById('list')
  let items = Array.from({ length: 10000 }, (_, i) => ({ id: i, label: `Row ${i + 1}` }))

  list.itemHeight = 36                       // fixed px (or a function for variable heights)
  list.renderItem = (item, index) => `<span>#${index + 1} — ${item.label}</span>`
  list.items = items                         // setting items recomputes the window

  // Lazy loading
  list.addEventListener('tc-end-reached', () => {
    const start = items.length
    items = items.concat(Array.from({ length: 5000 }, (_, i) => ({ id: start + i, label: `Row ${start + i + 1}` })))
    list.items = items
  })
</script>
```

---