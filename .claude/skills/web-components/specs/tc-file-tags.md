---
component: tc-file-tags
---

### tc-file-tags

Tag picker that renders selected tags as removable chips with a searchable dropdown to add more. Supports readonly mode (static chips, no add/remove controls). Sharp corners, slate neutral palette; optional per-tag color accent displayed as a 2px left border stripe.

**Tag:** `tc-file-tags`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `readonly` | boolean | `false` | When present, hides all add/remove controls and renders tags as static chips. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tags` | `FileTag[]` | `[]` | All available tags. Each entry: `{ id: string; label: string; color?: string }`. |
| `selectedIds` | `string[]` | `[]` | IDs of currently selected tags. |
| `onChange` | `((selectedIds: string[]) => void) \| null` | `null` | Optional callback fired alongside the `tc-change` event with the updated selected IDs. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ selectedIds: string[] }` | Dispatched whenever a tag is added or removed. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-file-tags-gap` | `0.375rem` | Gap between chips and add button |
| `--bs-file-tags-chip-bg` | `var(--tc-surface-muted)` | Chip background |
| `--bs-file-tags-chip-border-color` | `var(--tc-border)` | Chip border colour |
| `--bs-file-tags-chip-text-color` | `var(--tc-text)` | Chip label text colour |
| `--bs-file-tags-chip-color` | `transparent` (per-chip) | Left-border accent colour. Set inline per chip via `style="--bs-file-tags-chip-color:…"` when `tag.color` is provided; defaults to `transparent` (no stripe). |
| `--bs-file-tags-chip-font-size` | `0.8125rem` | Chip font size |
| `--bs-file-tags-chip-accent-width` | `2px` | Width of the left-border color stripe |
| `--bs-file-tags-add-color` | `var(--tc-text-muted)` | Add-button text colour |
| `--bs-file-tags-add-border-color` | `var(--tc-border)` | Add-button border colour |
| `--bs-file-tags-menu-bg` | `var(--tc-surface)` | Dropdown menu background |
| `--bs-file-tags-menu-shadow` | `var(--tc-shadow-lg)` | Dropdown menu shadow |
| `--bs-file-tags-menu-min-width` | `180px` | Dropdown minimum width |
| `--bs-file-tags-menu-max-height` | `200px` | Options list max height before scroll |
| `--bs-file-tags-option-active-bg` | `var(--tc-app-accent)` | Active/keyboard-focused option background |
| `--bs-file-tags-option-active-color` | `#fff` | Active/keyboard-focused option text colour |

```html
<tc-file-tags id="ft"></tc-file-tags>
<script>
  const ft = document.getElementById('ft')
  ft.tags = [
    { id: 'bug', label: 'bug', color: '#ef4444' },
    { id: 'feature', label: 'feature', color: '#3b82f6' },
    { id: 'docs', label: 'docs' },
  ]
  ft.selectedIds = ['bug']
  ft.addEventListener('tc-change', e => {
    console.log('selected:', e.detail.selectedIds)
  })
</script>

<!-- Readonly variant -->
<tc-file-tags id="ft-ro" readonly></tc-file-tags>
<script>
  const ro = document.getElementById('ft-ro')
  ro.tags = [{ id: 'bug', label: 'bug', color: '#ef4444' }, { id: 'docs', label: 'docs' }]
  ro.selectedIds = ['bug', 'docs']
</script>
```

---