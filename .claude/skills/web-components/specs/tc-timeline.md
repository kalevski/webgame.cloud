---
component: tc-timeline
---

### tc-timeline

Vertical timeline of chronological events. Items are set via the JS `items` property (array of `TimelineItem` objects). Supports five card variants, three connector styles, per-item statuses, icons, badges, tags, progress bars, accent colors, and a loading skeleton. Non-interactive — dispatches no events. Sharp corners (`border-radius: 0`) on cards and tags; the circular node marker (`50%`) is the only sanctioned curve.

**Tag:** `tc-timeline`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `variant` | `default\|glass\|outlined\|elevated\|minimal` | `default` | Card surface style. `default` = 1px border + white card. `glass` = translucent with backdrop blur. `outlined` = transparent fill. `elevated` = adds `--tc-shadow-sm`. `minimal` = no card chrome. |
| `connector` | `gradient\|solid\|dashed` | `gradient` | Style of the vertical spine line. `gradient` = ink fade at top/bottom. `solid` = 2px `--tc-border-strong`. `dashed` = 2px dashed `--tc-border`. |
| `overlap` | number | `0` | Default negative vertical margin (px) between consecutive cards to create a visual overlap. Per-item `overlap` in the items array overrides this. |
| `loading` | boolean | false | When set, renders `loading-count` skeleton placeholder rows instead of the items list. |
| `loading-count` | number | `3` | Number of skeleton rows shown during the loading state. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `TimelineItem[]` | `[]` | Array of timeline items. Setting this property re-renders the timeline. See the `TimelineItem` shape below. |
| `variant` | `TimelineVariant` | `'default'` | Reflects the `variant` attribute. |
| `connector` | `TimelineConnector` | `'gradient'` | Reflects the `connector` attribute. |
| `overlap` | `number` | `0` | Reflects the `overlap` attribute. |
| `loading` | `boolean` | `false` | Reflects the `loading` attribute. |
| `loadingCount` | `number` | `3` | Reflects the `loading-count` attribute. |

**TimelineItem shape**

```ts
interface TimelineItem {
    title: string           // Required. Card heading.
    date: string            // Required. Monospace date label shown in the card header.
    description?: string    // Optional body paragraph.
    side?: 'left' | 'right' // Which side of the spine. Defaults to alternating left/right.
    subtitle?: string       // Secondary line below the title.
    badge?: string          // Small rectangular label in the card header.
    meta?: string           // Monospace meta label shown alongside the date.
    icon?: string           // Lucide icon name (PascalCase or kebab-case). When provided,
                            // renders an icon chip as the node instead of a status dot.
    status?: 'completed' | 'active' | 'upcoming'
                            // Node color. Defaults to 'active' for index 0, 'upcoming' for the rest.
    overlap?: number        // Per-item negative margin override (px). Overrides the top-level overlap attribute.
    tags?: string[]         // Small rectangular pill tags rendered below the description.
    progress?: number       // 0–100. When provided, renders a progress bar inside the card.
    accentColor?: string    // CSS color string applied as --tl-item-accent on the item.
                            // Changes the node dot border/fill to a custom color.
}
```

**Events**

None. `tc-timeline` is a purely presentational element.

**Slots**

None. All content is driven by the `items` JS property.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-timeline-card-bg` | `var(--tc-surface)` | Card background fill. |
| `--bs-timeline-card-border-color` | `var(--tc-border)` | Card border hairline. |
| `--bs-timeline-card-padding-x` | `1.25rem` | Card horizontal padding. |
| `--bs-timeline-card-padding-y` | `0.875rem` | Card vertical padding. |
| `--bs-timeline-line-color` | `var(--tc-border)` | Spine line color (gradient and default). |
| `--bs-timeline-line-width` | `1px` | Spine line width (default connector). |
| `--bs-timeline-line-solid-color` | `var(--tc-border-strong)` | Spine color for the solid connector. |
| `--bs-timeline-line-solid-width` | `2px` | Spine width for the solid connector. |
| `--bs-timeline-node-col-width` | `2.5rem` | Width of the grid column that holds the node marker. |
| `--bs-timeline-node-size` | `0.875rem` | Diameter of the circular status dot. |
| `--bs-timeline-node-icon-size` | `2rem` | Diameter of the icon chip circle. |
| `--bs-timeline-node-gutter` | `0.875rem` | Gap between the node column and the adjacent card. |
| `--bs-timeline-completed-bg` | `var(--tc-success)` | Status dot fill for completed items. |
| `--bs-timeline-active-bg` | `var(--tc-app-accent)` | Status dot fill for active items. |
| `--bs-timeline-upcoming-bg` | `var(--tc-surface)` | Status dot fill for upcoming items. |
| `--bs-timeline-date-color` | `var(--tc-text-muted)` | Date label color (monospace). |
| `--bs-timeline-title-color` | `var(--tc-text)` | Title heading color. |
| `--bs-timeline-title-font-size` | `0.9375rem` | Title heading font size. |
| `--bs-timeline-description-color` | `var(--tc-text-muted)` | Description paragraph color. |
| `--bs-timeline-tag-bg` | `var(--tc-surface-muted)` | Tag pill background. |
| `--bs-timeline-tag-border-color` | `var(--tc-border)` | Tag pill hairline. |
| `--bs-timeline-progress-fill` | `var(--tc-app-accent)` | Progress bar fill color. |
| `--bs-timeline-item-gap` | `1.5rem` | Vertical gap between consecutive items. |
| `--bs-timeline-elevated-shadow` | `var(--tc-shadow-sm)` | Box-shadow for the elevated variant. |

```html
<!-- Basic usage — set items via JS -->
<tc-timeline id="tl1"></tc-timeline>
<script>
document.getElementById('tl1').items = [
    { title: 'Project kickoff',  date: '2026-01-10', status: 'completed', badge: 'Done' },
    { title: 'Alpha release',    date: '2026-03-01', status: 'active',    progress: 65 },
    { title: 'Public beta',      date: '2026-04-15', status: 'upcoming',  tags: ['Beta'] },
]
</script>

<!-- Variants -->
<tc-timeline id="tl2" variant="glass" connector="solid"></tc-timeline>
<tc-timeline id="tl3" variant="elevated"></tc-timeline>
<tc-timeline id="tl4" variant="minimal" connector="dashed"></tc-timeline>

<!-- Loading state -->
<tc-timeline loading loading-count="4"></tc-timeline>

<!-- Per-item icon and accent color -->
<tc-timeline id="tl5"></tc-timeline>
<script>
document.getElementById('tl5').items = [
    { title: 'Deployed', date: '2026-06-01', icon: 'Rocket',     status: 'completed' },
    { title: 'Monitoring', date: '2026-06-02', icon: 'Activity', status: 'active',
      accentColor: 'var(--tc-accent)', progress: 30 },
]
</script>
```

---