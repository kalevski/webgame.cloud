---
component: tc-file-dropzone
---

### tc-file-dropzone

Drag-and-drop upload zone with optional supported-format chips. Fires a `tc-files` custom event (and calls the `onFiles` callback) with the selected `File[]` array on both drop and native file-picker selection. Sharp dashed border, neutral ink; cyan `--tc-accent` border on drag-active.

**Tag:** `tc-file-dropzone`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| *(none)* | — | — | No reflected attributes. Use JS properties to configure. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `supported` | `DropzoneFileFormat[]` | `[]` | Accepted file formats displayed as mono chips. Each entry: `{ label: string; mime?: string; extension?: string }`. Also populates the hidden input's `accept` attribute. |
| `onFiles` | `((files: File[]) => void) \| null` | `null` | Optional callback fired alongside the `tc-files` event with the selected `File[]`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-files` | `{ files: File[] }` | Dispatched when files are selected via drag-and-drop or the native file picker. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-file-dropzone-border-color` | `var(--tc-border-strong)` | Drop-area border colour |
| `--bs-file-dropzone-border-style` | `dashed` | Drop-area border style |
| `--bs-file-dropzone-border-width` | `1px` | Drop-area border width |
| `--bs-file-dropzone-bg` | `var(--tc-surface)` | Drop-area background |
| `--bs-file-dropzone-padding-y` | `2.5rem` | Vertical padding of the drop area |
| `--bs-file-dropzone-padding-x` | `1.5rem` | Horizontal padding of the drop area |
| `--bs-file-dropzone-gap` | `0.75rem` | Gap between icon, prompt, and format chips |
| `--bs-file-dropzone-icon-size` | `1.5rem` | Upload icon size |
| `--bs-file-dropzone-icon-color` | `var(--tc-text-muted)` | Upload icon colour |
| `--bs-file-dropzone-prompt-color` | `var(--tc-text-muted)` | Prompt text colour |
| `--bs-file-dropzone-prompt-size` | `0.925rem` | Prompt text size |
| `--bs-file-dropzone-chip-color` | `var(--tc-text-faint)` | Format chip text colour |
| `--bs-file-dropzone-chip-size` | `0.75rem` | Format chip font size |
| `--bs-file-dropzone-chip-border-color` | `var(--tc-border)` | Format chip border colour |
| `--bs-file-dropzone-active-bg` | `var(--tc-surface-muted)` | Drop-area background when a drag is active |
| `--bs-file-dropzone-active-border-color` | `var(--tc-accent)` | Drop-area border colour when a drag is active |

```html
<!-- With supported formats (set via JS property) -->
<tc-file-dropzone id="dz"></tc-file-dropzone>
<script>
  const dz = document.getElementById('dz')
  dz.supported = [
    { label: 'PNG', mime: 'image/png', extension: '.png' },
    { label: 'JPG', mime: 'image/jpeg', extension: '.jpg' },
    { label: 'PDF', mime: 'application/pdf', extension: '.pdf' },
  ]
  dz.addEventListener('tc-files', e => {
    console.log('dropped files:', e.detail.files)
  })
</script>

<!-- No format restriction -->
<tc-file-dropzone id="dz2"></tc-file-dropzone>
<script>
  document.getElementById('dz2').onFiles = files => {
    console.log('selected files:', files)
  }
</script>
```
```