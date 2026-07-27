---
component: tc-changelog
---

### tc-changelog

Vertical changelog timeline. Entries are set via the JS `entries` property (array of `ChangelogEntry` objects). Supports optional truncation via `max-visible` with a configurable "read more" link, and a loading skeleton. Non-interactive — dispatches no events. Sharp corners (`border-radius: 0`) on entries and tags; the circular rail dot (`50%`) is the only sanctioned curve.

**Tag:** `tc-changelog`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-visible` | number | — | When set, only the first N entries are rendered. A "read more" link appears when the entries array is longer than this value (requires `read-more-href`). |
| `read-more-href` | string | `''` | URL for the "read more" link rendered when entries are truncated. |
| `read-more-label` | string | `'Read more'` | Label text for the "read more" link. |
| `loading` | boolean | `false` | When set, renders a 3-row skeleton placeholder instead of entry content. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `entries` | `ChangelogEntry[]` | `[]` | Array of changelog entries. Setting this property re-renders the component. See the `ChangelogEntry` shape below. |
| `maxVisible` | `number \| null` | `null` | Reflects the `max-visible` attribute. |
| `readMoreHref` | `string` | `''` | Reflects the `read-more-href` attribute. |
| `readMoreLabel` | `string` | `'Read more'` | Reflects the `read-more-label` attribute. |
| `loading` | `boolean` | `false` | Reflects the `loading` attribute. |

**ChangelogEntry shape**

```ts
interface ChangelogEntry {
    date: string        // Required. Monospace date label (e.g. '2026-06-01').
    title: string       // Required. Entry heading.
    description: string // Required. Body paragraph.
    tags?: string[]     // Optional. Small monospace tag badges.
}
```

**Events**

None. `tc-changelog` is a purely presentational element.

**Slots**

None. All content is driven by the `entries` JS property.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-changelog-rail-color` | `var(--tc-border)` | Left rail hairline color. |
| `--bs-changelog-rail-width` | `1px` | Left rail hairline thickness. |
| `--bs-changelog-dot-size` | `0.625rem` | Diameter of the circular entry dot. |
| `--bs-changelog-dot-color` | `var(--tc-app-accent)` | Fill color of the entry dot. |
| `--bs-changelog-dot-col-width` | `1.5rem` | Width of the left column holding the dot. |
| `--bs-changelog-dot-gutter` | `0.875rem` | Gap between the dot column and the card. |
| `--bs-changelog-date-color` | `var(--tc-text-muted)` | Date label color (monospace). |
| `--bs-changelog-date-font-size` | `0.6875rem` | Date label font size. |
| `--bs-changelog-title-color` | `var(--tc-text)` | Entry title color. |
| `--bs-changelog-title-font-size` | `0.9375rem` | Entry title font size. |
| `--bs-changelog-title-font-weight` | `600` | Entry title font weight. |
| `--bs-changelog-desc-color` | `var(--tc-text-muted)` | Entry description color. |
| `--bs-changelog-desc-font-size` | `0.875rem` | Entry description font size. |
| `--bs-changelog-tag-bg` | `var(--tc-surface-muted)` | Tag background. |
| `--bs-changelog-tag-color` | `var(--tc-text)` | Tag text color. |
| `--bs-changelog-tag-border-color` | `var(--tc-border)` | Tag hairline border. |
| `--bs-changelog-tag-font-size` | `0.6875rem` | Tag font size (monospace). |
| `--bs-changelog-item-gap` | `1.75rem` | Vertical gap between consecutive entries. |
| `--bs-changelog-more-color` | `var(--tc-text-muted)` | "Read more" link default color. |
| `--bs-changelog-more-hover-color` | `var(--tc-accent)` | "Read more" link hover color. |
| `--bs-changelog-more-font-size` | `0.8125rem` | "Read more" link font size. |

```html
<!-- Basic usage — set entries via JS -->
<tc-changelog id="cl1"></tc-changelog>
<script>
document.getElementById('cl1').entries = [
    { date: '2026-06-01', title: 'v3.0.0', description: 'Major redesign.', tags: ['breaking'] },
    { date: '2026-04-15', title: 'v2.8.0', description: 'New Timeline component.', tags: ['feature'] },
]
</script>

<!-- Truncated with read-more link -->
<tc-changelog
    id="cl2"
    max-visible="2"
    read-more-href="/changelog"
    read-more-label="View full changelog →"
></tc-changelog>
<script>
document.getElementById('cl2').entries = [
    { date: '2026-06-01', title: 'v3.0.0', description: 'Major redesign.', tags: ['breaking'] },
    { date: '2026-04-15', title: 'v2.8.0', description: 'New component.', tags: ['feature'] },
    { date: '2026-03-02', title: 'v2.7.0', description: 'Form primitives.', tags: ['feature'] },
]
</script>

<!-- Loading skeleton -->
<tc-changelog loading></tc-changelog>
```

---