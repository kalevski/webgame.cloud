---
component: tc-advanced-table
---

### tc-advanced-table

Data table with a built-in filter toolbar, sortable headers, a translucent loading overlay, and a paginated footer. The header row is driven by the `columns` JS property; **body rows are fed as an HTML string through the `rows` property** — the element owns its `<tbody>` and re-applies the string on every internal re-render, so callers own row markup (and can inject `tc-badge` etc.) without any relocation hazard. Never render framework children (e.g. React `<tr>`s) inside the element: they would be captured and moved out from under the framework's reconciler. Pure slate chrome, sharp corners, JetBrains Mono pagination summary (format from the message registry's `paginationRange`, default `{start}–{end} of {total}`). The body wrap paints automatic scroll-edge shadows — gradient hints at whichever edges have clipped content, driven by the scroll position. The element drives its own internal sort direction and offset on click (like `tc-pagination`) and emits a CustomEvent for each interaction.

**Tag:** `tc-advanced-table`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `10` | Page size. Drives the pagination summary and the prev/next step. |
| `offset` | number | `0` | Zero-based index of the first row on the current page. Updated internally on prev/next clicks. |
| `total` | number | `0` | Total row count across all pages. The pagination footer only renders when `total > 0`. |
| `loading` | boolean | false | Shows a translucent overlay + spinner above the body, sets `aria-busy`, and disables the filter, sort, and pagination controls. |
| `sticky-first-column` | boolean | false | Pins the first column (identity) while the body scrolls horizontally. |
| `sticky-last-column` | boolean | false | Pins the last column (row actions) while the body scrolls horizontally. |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rows` | `string \| null` | `null` | Body rows as a trusted HTML string of `<tr>` elements. The element re-applies it into its `<tbody>` on every re-render. Interpolated user data MUST be escaped by the caller. |
| `columns` | `AdvancedTableColumn[]` | `[]` | Header descriptors (see below). Set via the JS property; re-renders. |
| `filters` | `AdvancedTableFilter[]` | `[]` | Toolbar filter controls. Empty → no toolbar. Set via the JS property. |
| `filterValues` | `Record<string, any>` | `{}` | Current value bound into each filter control, keyed by filter `key`. |
| `sortableColumns` | `string[]` | `[]` | Column keys allowed to sort; matching header cells become sort buttons. |
| `sort` | `AdvancedTableSort \| null` | `null` | Active sort (`{ column, direction }`); renders an up/down chevron on the active header and reflects `aria-sort`. |
| `onFilterChange` | `((key, value) => void) \| null` | `null` | Callback mirror of `tc-filter-change`. |
| `onSortChange` | `((sort) => void) \| null` | `null` | Callback mirror of `tc-sort-change`. |
| `onPageChange` | `((offset) => void) \| null` | `null` | Callback mirror of `tc-page-change`. |

**AdvancedTableColumn shape**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Column identifier; matched against `sortableColumns` and `sort.column`. |
| `label` | `string` | Header label text. |
| `align` | `'left' \| 'center' \| 'right'` | Header text alignment (default `left`). |
| `width` | `string` | CSS width applied to the header cell. |
| `hideBelow` | `'sm' \| 'md' \| 'lg'` | Hides the column below that breakpoint (sm 576 / md 768 / lg 992). Works **positionally** — `nth-child` rules are generated per instance and applied to the header AND the projected body cells, so `rows` must keep one `<td>` per declared column. |
| `minWidth` | `string` | Minimum column width (any CSS length) — forces horizontal scrolling instead of mid-word clipping. |

**AdvancedTableFilter shape**

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Filter identifier; used as the `detail.key` and to read `filterValues[key]`. |
| `label` | `string` | Visible field label (also the control's `aria-label`). |
| `type` | `'text' \| 'select'` | Renders a text input or a `<select>`. |
| `options` | `{ value, label }[]` | Options for a `select` filter. |
| `placeholder` | `string` | Placeholder for a text filter, or the empty/"all" option label for a select. |

**AdvancedTableSort shape**

| Field | Type | Description |
|-------|------|-------------|
| `column` | `string` | The sorted column's `key`. |
| `direction` | `'asc' \| 'desc'` | Sort direction. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-filter-change` | `{ key, value }` | A filter input/select changed. Does not re-render the element — set `filterValues` to reflect it. Bubbles, composed. |
| `tc-sort-change` | `{ column, direction }` | A sortable header was clicked; the sort cycles asc → desc → cleared. When cleared, both fields are `null`. Bubbles, composed. |
| `tc-page-change` | `{ offset }` | Prev/next clicked; the new `offset` is clamped to `[0, total)`. Bubbles, composed. |

**Slots**

None for body rows — feed them through the `rows` property. (Pre-parsed DOM children present at connect time are still moved into the `<tbody>` for plain-JS callers, but `rows` wins when set; note that raw `<tr>` tags in static HTML never survive parsing outside a `<table>`, so static markup callers must also use `rows`.)

**Accessibility**

- Real `<table>` / `<thead>` / `<tbody>` / `<th scope="col">` semantics.
- Sortable headers expose `aria-sort` (`ascending` / `descending` / `none`) via a `<button>` inside the `<th>`.
- The loading overlay carries `role="status"` + `aria-busy`; the host also sets `aria-busy` while loading.
- Disabled pagination buttons (at the bounds, or while loading) use opacity + `pointer-events: none`.
- Focus is always visible on header and pagination buttons; touch targets ≥ 44px under coarse pointers; `prefers-reduced-motion` slows the spinner rather than hiding it.

```html
<tc-advanced-table></tc-advanced-table>

<script>
const table = document.querySelector('tc-advanced-table')
table.rows =
    '<tr><td>Alice</td><td>Maintainer</td><td style="text-align:right">842</td></tr>' +
    '<tr><td>Bob</td><td>Contributor</td><td style="text-align:right">311</td></tr>'
table.columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'commits', label: 'Commits', align: 'right' },
]
table.sortableColumns = ['name', 'commits']
table.sort = { column: 'commits', direction: 'desc' }
table.filters = [
    { key: 'name', label: 'Search', type: 'text', placeholder: 'Filter…' },
    { key: 'role', label: 'Role', type: 'select', placeholder: 'All', options: [
        { value: 'Maintainer', label: 'Maintainer' },
        { value: 'Contributor', label: 'Contributor' },
    ] },
]
table.filterValues = { name: '', role: '' }
table.limit = 10
table.offset = 0
table.total = 42

table.addEventListener('tc-filter-change', e => console.log(e.detail)) // { key, value }
table.addEventListener('tc-sort-change', e => console.log(e.detail))    // { column, direction }
table.addEventListener('tc-page-change', e => console.log(e.detail))    // { offset }
</script>

<!-- Loading overlay -->
<tc-advanced-table loading total="42" limit="10"></tc-advanced-table>
```

---