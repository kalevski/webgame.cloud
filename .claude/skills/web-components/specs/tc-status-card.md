---
component: tc-status-card
---

### tc-status-card

Dashboard card showing a list of status indicator rows. Each row has a colored circle indicator (with an inline icon for non-color accessibility), a label, and an optional right-aligned detail. Purely presentational; no events.

**Tag:** `tc-status-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Optional card heading rendered in the header. When absent, no header is rendered. |
| `loading` | `boolean` | `false` | When present, renders skeleton placeholder rows instead of real items. |
| `loading-count` | `number` | `4` | Number of skeleton rows shown while `loading` is set. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `StatusItem[]` | Array of status items to render. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `title` | `string \| null` | Reflects the `title` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `loadingCount` | `number` | Reflects the `loading-count` attribute. |

`StatusItem` shape:
```ts
interface StatusItem {
    id?: string                                 // optional unique key (not rendered)
    label: string                               // row label (required)
    status: 'ok' | 'warning' | 'error' | 'inactive'  // drives indicator color + icon
    detail?: string                             // optional right-aligned mono detail text
}
```

Status → indicator mapping:

| Status | Color token | Lucide icon | Meaning |
|--------|-------------|-------------|---------|
| `ok` | `--tc-success` | Check | Healthy / passing |
| `warning` | `--tc-warning` | AlertTriangle | Degraded / attention needed |
| `error` | `--tc-danger` | X | Failed / unreachable |
| `inactive` | `--tc-text-faint` | Minus | Paused / disabled |

**Events**

None. `tc-status-card` is purely presentational.

**Slots**

None. Content is driven entirely by the `items` JS property and HTML attributes.

**Accessibility**

- Each status indicator circle carries `role="img"` and `aria-label` set to the status name (`"ok"`, `"warning"`, `"error"`, `"inactive"`), so meaning is conveyed by text, not color alone.
- The inline Lucide icon provides a second non-color signal (shape/glyph).
- The list uses `<ul role="list">` with `role="listitem"` on each row.
- The card heading uses a real `<h3>` element.
- The loading region sets `aria-busy="true"` on the list and includes a visually-hidden `role="status"` announcement ("Loading status…").
- Skeleton shimmer animation honours `prefers-reduced-motion` (freezes to a static fill).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-status-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-status-card-border-color` | `var(--tc-border)` | Card 1px hairline border color. |
| `--bs-status-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-status-card-header-bg` | ink gradient | Faint ink-gradient header background. |
| `--bs-status-card-header-border-color` | `var(--tc-border)` | Header bottom hairline color. |
| `--bs-status-card-title-color` | `var(--tc-text)` | Card heading text color. |
| `--bs-status-card-item-padding-y` | `0.625rem` | Vertical padding per row. |
| `--bs-status-card-item-padding-x` | `1.25rem` | Horizontal padding per row. |
| `--bs-status-card-item-gap` | `0.625rem` | Gap between indicator, label, and detail. |
| `--bs-status-card-item-separator-color` | slate-100 | Hairline between rows (fainter than outer border). |
| `--bs-status-card-indicator-size` | `1.375rem` | Diameter of the status indicator circle. |
| `--bs-status-card-indicator-icon-size` | `0.8125rem` | Size of the inline SVG icon inside the circle. |
| `--bs-status-card-label-color` | `var(--tc-text)` | Row label text color. |
| `--bs-status-card-detail-color` | `var(--tc-text-muted)` | Detail text color (mono, right-aligned). |
| `--bs-status-card-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton row fill. |
| `--bs-status-card-skeleton-shimmer` | `rgba(255,255,255,0.6)` | Shimmer highlight color. |

```html
<!-- Status card with title — set items via JS property -->
<tc-status-card id="health" title="System Health"></tc-status-card>
<script>
    document.getElementById('health').items = [
        { id: '1', label: 'API Gateway',      status: 'ok',       detail: 'Healthy' },
        { id: '2', label: 'Database Cluster', status: 'warning',  detail: 'High CPU' },
        { id: '3', label: 'Email Service',    status: 'error',    detail: 'Unreachable' },
        { id: '4', label: 'Analytics Worker', status: 'inactive', detail: 'Paused' },
    ]
</script>

<!-- No title, optional detail -->
<tc-status-card id="svc"></tc-status-card>
<script>
    document.getElementById('svc').items = [
        { label: 'Auth Service', status: 'ok' },
        { label: 'Job Queue',    status: 'warning', detail: 'Backlog growing' },
        { label: 'CDN Edge',     status: 'ok' },
    ]
</script>

<!-- Loading state -->
<tc-status-card title="System Health" loading></tc-status-card>

<!-- Loading state with custom row count -->
<tc-status-card title="Services" loading loading-count="6"></tc-status-card>
```

---