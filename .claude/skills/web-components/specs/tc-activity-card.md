---
component: tc-activity-card
---

### tc-activity-card

Dashboard card showing a vertical timeline of activity items with icons, descriptions, and timestamps. Purely presentational; no events.

**Tag:** `tc-activity-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Optional card heading rendered in the header. When absent, no header is rendered. |
| `loading` | `boolean` | `false` | When present, renders skeleton placeholder rows instead of real activity items. |
| `loading-count` | `number` | `3` | Number of skeleton rows shown while `loading` is set. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `activities` | `ActivityItem[]` | Array of activity items to render as the timeline. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `title` | `string \| null` | Reflects the `title` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `loadingCount` | `number` | Reflects the `loading-count` attribute. |

`ActivityItem` shape:
```ts
interface ActivityItem {
    id?: string          // optional unique key (not rendered)
    icon?: string        // Lucide icon name in PascalCase (e.g. "GitCommit", "CheckCircle"). Falls back to "Circle".
    title: string        // primary activity label (required)
    description?: string // optional secondary line below the title
    timestamp?: string   // optional right-aligned mono timestamp string (e.g. "2m ago", "12:04")
}
```

**Events**

None. `tc-activity-card` is purely presentational.

**Slots**

None. Content is driven entirely by the `activities` JS property and HTML attributes.

**Accessibility**

- The timeline list uses `<ul role="list">` with each item as `role="listitem"`.
- The card heading uses a real `<h3>` element.
- Icon chips and the rail carry `aria-hidden="true"` — no color-only meaning.
- The loading region sets `aria-busy="true"` on the list and includes a visually-hidden `role="status"` announcement.
- Skeleton shimmer animation honours `prefers-reduced-motion` (freezes to a static fill; never removed entirely so the loading region remains visible).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-activity-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-activity-card-border-color` | `var(--tc-border)` | Card 1px hairline border color. |
| `--bs-activity-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-activity-card-header-bg` | ink gradient | Faint ink-gradient header background. |
| `--bs-activity-card-header-border-color` | `var(--tc-border)` | Header bottom hairline color. |
| `--bs-activity-card-title-color` | `var(--tc-text)` | Card heading text color. |
| `--bs-activity-card-icon-chip-size` | `1.75rem` | Width and height of the icon chip. |
| `--bs-activity-card-icon-chip-bg` | `var(--tc-surface-muted)` | Icon chip background. |
| `--bs-activity-card-icon-chip-color` | `var(--tc-text-muted)` | Icon glyph color. |
| `--bs-activity-card-rail-color` | `var(--tc-border)` | Color of the vertical rail connecting timeline items. |
| `--bs-activity-card-item-title-color` | `var(--tc-text)` | Activity title text color. |
| `--bs-activity-card-item-desc-color` | `var(--tc-text-muted)` | Activity description text color. |
| `--bs-activity-card-time-color` | `var(--tc-text-muted)` | Timestamp text color. |
| `--bs-activity-card-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton row fill. |
| `--bs-activity-card-skeleton-shimmer` | `rgba(255,255,255,0.6)` | Shimmer highlight. |

```html
<!-- Basic usage — set activities via JS property -->
<tc-activity-card id="feed" title="Recent Activity"></tc-activity-card>
<script>
    document.getElementById('feed').activities = [
        {
            icon: 'GitCommit',
            title: 'Pushed 3 commits to main',
            description: 'feat: add activity card component',
            timestamp: '2m ago',
        },
        {
            icon: 'CheckCircle',
            title: 'CI pipeline passed',
            timestamp: '4m ago',
        },
        {
            icon: 'MessageSquare',
            title: 'New comment on PR #84',
            description: 'Looks good, approving',
            timestamp: '12m ago',
        },
    ]
</script>

<!-- Loading state -->
<tc-activity-card title="Recent Activity" loading></tc-activity-card>

<!-- Loading state with custom row count -->
<tc-activity-card title="Activity Feed" loading loading-count="5"></tc-activity-card>

<!-- No title -->
<tc-activity-card id="feed2"></tc-activity-card>
```

---