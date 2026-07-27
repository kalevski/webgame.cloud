---
component: tc-gantt-chart
---

### tc-gantt-chart

Gantt chart with time-based task bars, progress fills, a date-marker axis, and a horizontally-scrolling body. Each bar's `left`/`width` is computed as a percentage of the overall span (`start-date` → `end-date`, or derived from the earliest/latest task date when those attributes are omitted). Sharp square corners; the frame is the Card surface (white `--tc-surface`, 1px hairline, `--tc-shadow-sm`). Row separators are slate-100 inner hairlines; axis ticks are JetBrains Mono micro-labels. Bar bases default to a muted slate fill; the inner progress fill uses `--tc-app-accent` ink (or the task's own `color` — the one sanctioned data-encoding override) and its width tracks `progress`%. Hover shows an overlay-tier tooltip (ink surface, white text, `--tc-shadow-md`, 3px colored left stripe) with the task label, dates, and progress; the body scrolls horizontally when content exceeds the width. Every bar is keyboard-reachable (`role="button"`, `tabindex="0"`, Enter/Space activates) with a visible focus outline; clicking/activating one fires `tc-task-click` and calls the optional `onTaskClick` callback. Tasks are set via the `tasks` JS property.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Header text rendered above the chart; also the chart's accessible name |
| `subtitle` | `string` | — | Secondary header line below the title |
| `start-date` | `string` (ISO date) | earliest task start | Pins the left edge of the span |
| `end-date` | `string` (ISO date) | latest task end | Pins the right edge of the span |
| `loading` | boolean | `false` | Render a shimmer skeleton and set `aria-busy="true"` |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tasks` | `GanttTask[]` | `[]` | Array of task bar descriptors (see below) |
| `onTaskClick` | `(task) => void \| null` | `null` | Optional callback fired (alongside `tc-task-click`) when a bar is clicked/activated |

**GanttTask shape**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable identifier for the task |
| `label` | `string` | Display label shown in the left cell, tooltip, and accessible name (`name` is accepted as an alias) |
| `start` | `string` (ISO date) | Task start date |
| `end` | `string` (ISO date) | Task end date |
| `progress` | `number` | Optional 0–100 completion; drives the inner fill width |
| `color` | `string` | Optional explicit fill color (any CSS color); otherwise the ink accent is used |
| `group` | `string` | Optional grouping key surfaced in the accessible name + tooltip |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-task-click` | `{ task: GanttTask }` | Fired when a task bar is clicked or activated with Enter/Space |

**Slots**

_None._ The component owns its markup; arbitrary slotted children are not preserved.

```html
<tc-gantt-chart title="Release roadmap" subtitle="Q1 2026 milestones"></tc-gantt-chart>

<script>
const gantt = document.querySelector('tc-gantt-chart')
gantt.tasks = [
    { id: 'design', label: 'Design system', start: '2026-01-05', end: '2026-01-20', progress: 100 },
    { id: 'api', label: 'API contract', start: '2026-01-15', end: '2026-02-05', progress: 80 },
    { id: 'frontend', label: 'Frontend build', start: '2026-01-25', end: '2026-03-01', progress: 55 },
    { id: 'launch', label: 'Launch', start: '2026-03-25', end: '2026-04-01' },
]
gantt.addEventListener('tc-task-click', (e) => console.log(e.detail.task))
gantt.onTaskClick = (task) => console.log('callback', task.label)
</script>

<!-- per-task colors + a pinned span -->
<tc-gantt-chart title="Sprint plan" start-date="2026-02-01" end-date="2026-02-28"></tc-gantt-chart>
<script>
document.querySelector('tc-gantt-chart').tasks = [
    { id: 'a', label: 'Discovery', start: '2026-02-01', end: '2026-02-10', progress: 100, color: 'var(--tc-success)' },
    { id: 'b', label: 'Prototype', start: '2026-02-08', end: '2026-02-22', progress: 70, color: 'var(--tc-app-accent)' },
]
</script>

<!-- loading skeleton -->
<tc-gantt-chart loading title="Loading…"></tc-gantt-chart>
```

---