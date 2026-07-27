---
component: tc-roadmap
---

### tc-roadmap

Kanban or stacked roadmap board with status columns (`shipped` / `in-progress` / `planned` / `considering`) and a per-column item count badge. Neutrals carry the layout; status color appears only on the small status dot, a thin column rule, and the soft count-badge tint. Each item is a real `<button>` (keyboard-focusable, visible focus) that emits a `tc-select` event when activated. Status is conveyed by a dot + text label, never color alone.

**Tag:** `tc-roadmap`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `layout` | `'kanban' \| 'stacked'` | `kanban` | `kanban` lays columns side by side (collapsing toward stacked on narrow viewports); `stacked` stacks them vertically. Invalid values fall back to `kanban`. |
| `title-text` | `string` | — | Optional board heading rendered as `<h2>` above the board. Uses `title-text` (not the native `title` attribute, which the browser reflects as a tooltip). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | `RoadmapColumn[]` | Array of status columns. Setting re-renders the whole board. Default `[]`. |
| `layout` | `'kanban' \| 'stacked'` | Reflects the `layout` attribute. |
| `titleText` | `string \| null` | Reflects the `title-text` attribute. |
| `onSelect` | `((detail: { columnStatus, item }) => void) \| null` | Optional callback fired alongside the `tc-select` event. Default `null`. |

**`RoadmapColumn` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `'shipped' \| 'in-progress' \| 'planned' \| 'considering'` | yes | Drives the status dot/icon, column accent rule, count-badge tint, and default heading label. Invalid values fall back to `planned`. |
| `title` | `string` | no | Custom column heading. When given, the status label still appears as a mono micro-tag beside it. Defaults to the status label (e.g. `Shipped`). |
| `items` | `RoadmapItem[]` | yes | Cards in the column. `items.length` is shown in the count badge. |

**`RoadmapItem` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | yes | Card title — rendered as Inter medium. |
| `description` | `string` | no | Optional muted description below the title. |
| `tags` | `string[]` | no | Optional mono micro-label chips. |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-select` | `{ columnStatus: RoadmapStatus, item: RoadmapItem }` | Fired when an item card is clicked or activated by keyboard. Bubbles and is composed. |

**Slots**

None. All content is supplied via the `columns` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-roadmap-surface` | `var(--tc-surface)` | Column background. |
| `--bs-roadmap-border` | `var(--tc-border)` | Hairline color (1px-gap grid + outer border). |
| `--bs-roadmap-title-color` | `var(--tc-text)` | Board title text color. |
| `--bs-roadmap-column-min-width` | `240px` | Minimum column width before kanban wraps/collapses. |
| `--bs-roadmap-accent-rule-width` | `2px` | Width of the status accent rule (column top in kanban, left in stacked). |
| `--bs-roadmap-status-dot-size` | `8px` | Diameter of the circular status dot. |
| `--bs-roadmap-item-bg` | `var(--tc-surface)` | Item card background. |
| `--bs-roadmap-item-border` | `var(--tc-border)` | Item card hairline border. |
| `--bs-roadmap-item-shadow` | `var(--tc-shadow-sm)` | Item card resting shadow. |
| `--bs-roadmap-item-hover-shadow` | `var(--tc-shadow-hover)` | Item card hover shadow (lifts `translateY(-1px)`). |
| `--bs-roadmap-item-title-color` | `var(--tc-text)` | Item title color. |
| `--bs-roadmap-item-desc-color` | `var(--tc-text-muted)` | Item description color. |
| `--bs-roadmap-tag-bg` | `var(--tc-surface-muted)` | Tag chip background. |
| `--bs-roadmap-tag-color` | `var(--tc-text-muted)` | Tag chip text color. |

Per-column accent (status dot, accent rule, count-badge tint) is set internally: `shipped → --tc-success`, `in-progress → --tc-info`, `planned → --tc-text-muted`, `considering → --tc-warning`, each with a soft `--tc-<status>-bg` count tint.

```html
<!-- Kanban board, clickable items -->
<tc-roadmap id="board" layout="kanban" title-text="Product Roadmap — 2026"></tc-roadmap>
<script>
  const board = document.getElementById('board')
  board.columns = [
    {
      status: 'shipped',
      items: [
        { title: 'Dark mode', description: 'System-aware theme.', tags: ['ui', 'v2.1'] },
        { title: 'CSV export', tags: ['data'] },
      ],
    },
    {
      status: 'in-progress',
      items: [
        { title: 'Realtime presence', description: 'Cursors across collaborators.', tags: ['rt'] },
      ],
    },
    { status: 'planned', items: [{ title: 'Mobile app', tags: ['mobile'] }] },
    { status: 'considering', items: [{ title: 'Offline mode', tags: ['research'] }] },
  ]
  board.addEventListener('tc-select', e => {
    console.log(e.detail.columnStatus, e.detail.item.title)
  })
</script>

<!-- Stacked board with custom column titles -->
<tc-roadmap id="stacked" layout="stacked"></tc-roadmap>
<script>
  document.getElementById('stacked').columns = [
    { status: 'shipped', title: 'Done', items: [{ title: 'Billing portal' }] },
    { status: 'in-progress', title: 'Building now', items: [{ title: 'Bulk actions' }] },
    { status: 'considering', title: 'Ideas', items: [{ title: 'AI summaries' }] },
  ]
</script>
```

---