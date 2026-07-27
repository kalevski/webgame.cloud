---
component: tc-list-card
---

### tc-list-card

Dashboard card rendering a list of items with optional ranking numbers, leading icons, and trailing values. Purely presentational; no events.

**Tag:** `tc-list-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Optional card heading rendered in the header. When absent, no header is rendered. |
| `ordered` | `boolean` | `false` | When present, shows a rank number (1, 2, 3…) per row instead of the item icon. |
| `loading` | `boolean` | `false` | When present, renders skeleton placeholder rows instead of real items. |
| `loading-count` | `number` | `4` | Number of skeleton rows shown while `loading` is set. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `ListCardItem[]` | Array of list items to render. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `title` | `string \| null` | Reflects the `title` attribute. |
| `ordered` | `boolean` | Reflects the `ordered` attribute. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `loadingCount` | `number` | Reflects the `loading-count` attribute. |

`ListCardItem` shape:
```ts
interface ListCardItem {
    id?: string              // optional unique key (not rendered)
    icon?: string            // Lucide icon name in PascalCase (e.g. "Github", "Star"). Shown when ordered=false.
    label: string            // primary row label (required)
    value?: string | number  // optional right-aligned mono value
}
```

**Events**

None. `tc-list-card` is purely presentational.

**Slots**

None. Content is driven entirely by the `items` JS property and HTML attributes.

**Accessibility**

- Uses `<ol>` when `ordered` is set (real ordered list semantics), otherwise `<ul>`.
- The card heading uses a real `<h3>` element.
- Lead icons and rank chips carry `aria-hidden="true"` — no color-only meaning.
- The loading region sets `aria-busy="true"` on the list and includes a visually-hidden `role="status"` announcement.
- Skeleton shimmer animation honours `prefers-reduced-motion` (freezes to a static fill).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-list-card-bg` | `var(--tc-surface)` | Card background. |
| `--bs-list-card-border-color` | `var(--tc-border)` | Card 1px hairline border color. |
| `--bs-list-card-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-list-card-header-bg` | ink gradient | Faint ink-gradient header background. |
| `--bs-list-card-header-border-color` | `var(--tc-border)` | Header bottom hairline color. |
| `--bs-list-card-title-color` | `var(--tc-text)` | Card heading text color. |
| `--bs-list-card-row-separator-color` | fainter slate-100 | Inner row separator (fainter than outer frame). |
| `--bs-list-card-lead-size` | `1.5rem` | Width/height of the lead cell (rank chip or icon area). |
| `--bs-list-card-rank-bg` | `var(--tc-surface-muted)` | Rank chip background. |
| `--bs-list-card-rank-color` | `var(--tc-text-muted)` | Rank numeral color. |
| `--bs-list-card-label-color` | `var(--tc-text)` | Item label text color. |
| `--bs-list-card-value-color` | `var(--tc-text-muted)` | Trailing value text color. |
| `--bs-list-card-icon-color` | `var(--tc-text-muted)` | Icon stroke color. |
| `--bs-list-card-skeleton-bg` | `var(--tc-surface-muted)` | Skeleton row fill. |
| `--bs-list-card-skeleton-shimmer` | `rgba(255,255,255,0.6)` | Shimmer highlight. |

```html
<!-- Ordered ranked list — set items via JS property -->
<tc-list-card id="ranking" title="Top Frameworks" ordered></tc-list-card>
<script>
    document.getElementById('ranking').items = [
        { label: 'React',   value: '42,300' },
        { label: 'Vue',     value: '18,100' },
        { label: 'Angular', value: '11,500' },
        { label: 'Svelte',  value: '7,200' },
    ]
</script>

<!-- Icon list -->
<tc-list-card id="channels" title="Social Channels"></tc-list-card>
<script>
    document.getElementById('channels').items = [
        { icon: 'Github',   label: 'GitHub',   value: '12.4k' },
        { icon: 'Twitter',  label: 'Twitter',  value: '8.9k' },
        { icon: 'Linkedin', label: 'LinkedIn', value: '5.1k' },
    ]
</script>

<!-- Loading state -->
<tc-list-card title="Top Frameworks" loading></tc-list-card>

<!-- Loading state with custom row count -->
<tc-list-card title="Leaderboard" loading ordered loading-count="5"></tc-list-card>
```

---