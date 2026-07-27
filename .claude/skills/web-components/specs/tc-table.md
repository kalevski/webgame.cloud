---
component: tc-table
---

### tc-table

Flexible data table with sortable columns, loading skeletons, and optional row-click handlers. Renders a real `<table>` (`<thead>`/`<tbody>`) inside a scroll wrapper; the wrapper sits in a shell that paints automatic scroll-edge shadows — gradient hints at whichever edges have clipped content, driven by the scroll position. Pure slate chrome — colour only appears if a `render` cell injects status (e.g. a `tc-badge`). Sharp corners throughout.

**Tag:** `tc-table`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `empty-message` | string | `No data` | Text shown when `data` is empty and not loading — rendered through a nested `tc-empty-state` (inbox icon) in a full-width cell. When unset, resolves through the message registry (`noData`). |
| `striped` | boolean | false | Even body rows take the faint slate well. |
| `hoverable` | boolean | false | Rows lift to the slate well on hover. |
| `compact` | boolean | false | Reduces cell padding (`table-sm`). |
| `borderless` | boolean | false | Drops the internal cell hairlines (keeps the outer frame). |
| `sticky-header` | boolean | false | Pins `<thead>` to the top of the scroll wrap. Constrain the wrap height (e.g. wrap in `<div style="max-height:320px">`) so it scrolls. |
| `sticky-first-column` | boolean | false | Pins the first column (identity) while the body scrolls horizontally. |
| `sticky-last-column` | boolean | false | Pins the last column (row actions) while the body scrolls horizontally. |
| `collapse` | `card` | — | Below `collapse-below`, each row renders as a stacked label/value card — labels come from the column headers (each cell carries a `data-label`). |
| `collapse-below` | `sm\|md\|lg` | `md` | Breakpoint under which `collapse="card"` engages (sm 576 / md 768 / lg 992). |
| `loading` | boolean | false | Renders `loading-rows` skeleton rows (via `tc-skeleton`) instead of data; sets `aria-busy`. |
| `loading-rows` | number | `5` | Number of skeleton rows while `loading`. |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `TableColumn[]` | `[]` | Column descriptors (see below). Set via the JS property; re-renders. |
| `data` | `any[]` | `[]` | Row objects. Set via the JS property; re-renders. |
| `rowKey` | `(row, index) => string \| number` | — | Returns the key written as each row's `data-key`. |
| `onrowclick` | `((row, index) => void) \| null` | `null` | When set, rows become interactive (clickable, Enter/Space-activatable) and emit `tc-row-click`. Invoked alongside the event. |

**TableColumn shape**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Object key for the default cell value (`row[key]`) and the sort comparison. |
| `header` | `string` | Header label text. |
| `sortable` | `boolean` | Adds a sort button; clicking cycles ascending → descending → none and re-sorts `data` internally (stable). |
| `align` | `'left' \| 'center' \| 'right'` | Cell + header text alignment (default `left`). |
| `width` | `string` | CSS width applied to the column's cells. |
| `hideBelow` | `'sm' \| 'md' \| 'lg'` | Hides the column below that breakpoint (sm 576 / md 768 / lg 992). Omit on identity/action columns so they survive every size. |
| `minWidth` | `string` | Minimum column width (any CSS length) — keeps the column readable and forces horizontal scrolling instead of mid-word clipping. |
| `render` | `(row, index) => string` | Returns an HTML string for the cell (e.g. a `tc-badge`). Defaults to `row[key]`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-row-click` | `{ row, index }` | Dispatched on row click or Enter/Space when `onrowclick` is set. Bubbles, composed. `index` is the row's original index in `data`. |

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

- Real `<table>` / `<thead>` / `<tbody>` / `<th scope="col">` semantics.
- Sortable headers expose `aria-sort` (`ascending` / `descending` / `none`) and use a `<button>` inside the `<th>`.
- Clickable rows are keyboard-focusable (`tabindex="0"`) and activate on Enter/Space.
- Focus is always visible; sort buttons and rows show a `:focus-visible` outline.
- `prefers-reduced-motion` disables row/sort transitions; touch targets ≥ 44px under coarse pointers.

```html
<tc-table striped hoverable></tc-table>

<script>
const table = document.querySelector('tc-table')
table.columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'commits', header: 'Commits', sortable: true, align: 'right' },
    {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (row) => `<tc-badge variant="success" text="${row.status}"></tc-badge>`,
    },
]
table.data = [
    { id: 1, name: 'Alice', commits: 842, status: 'active' },
    { id: 2, name: 'Bob', commits: 311, status: 'away' },
]
table.rowKey = (row) => row.id
table.onrowclick = (row, index) => console.log('clicked', row, index)
table.addEventListener('tc-row-click', e => console.log(e.detail.row))
</script>

<!-- Sticky header in a height-constrained scroll box -->
<div style="max-height: 320px">
    <tc-table sticky-header hoverable></tc-table>
</div>

<!-- Loading skeleton -->
<tc-table loading loading-rows="4"></tc-table>
```

---