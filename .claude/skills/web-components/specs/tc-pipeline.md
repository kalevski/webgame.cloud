---
component: tc-pipeline
---

### tc-pipeline

Horizontal pipeline / steps visualization with numbered markers, titles, and three states: `default`, `live`, and `complete`. The live step displays a pulsing ring animation; the complete step shows a lucide check icon. Steps are set via a JS property (not an attribute). Purely presentational — no events, no slots.

**Tag:** `tc-pipeline`

**Attributes**

None. All data is passed via the `steps` JS property.

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `PipelineStep[]` | `[]` | Array of step descriptors. Setting this property triggers a re-render. |

**`PipelineStep` shape**

```ts
interface PipelineStep {
    title: string                              // Step label (required)
    state?: 'default' | 'live' | 'complete'   // Defaults to 'default'
    description?: string                       // Reserved; not rendered currently
    label?: string                             // Alias for title; not rendered separately
}
```

**Events**

None. `tc-pipeline` is purely presentational.

**Slots**

None.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-pipeline-marker-size` | `2.25rem` | Diameter of the circular step marker. |
| `--bs-pipeline-marker-font-size` | `0.875rem` | Font size of the step number inside the marker. |
| `--bs-pipeline-marker-font-weight` | `600` | Font weight of the step number. |
| `--bs-pipeline-connector-height` | `1px` | Height of the hairline connector between steps. |
| `--bs-pipeline-connector-color` | `var(--tc-border)` | Color of the connector hairline. |
| `--bs-pipeline-marker-bg` | `transparent` | Background of default-state markers. |
| `--bs-pipeline-marker-border` | `var(--tc-border-strong)` | Border color of default-state markers. |
| `--bs-pipeline-marker-color` | `var(--tc-text-muted)` | Number color of default-state markers. |
| `--bs-pipeline-title-font-size` | `0.8125rem` | Step title font size. |
| `--bs-pipeline-title-color` | `var(--tc-text-muted)` | Step title color (default state). |
| `--bs-pipeline-title-font-weight` | `400` | Step title font weight (default state). |
| `--bs-pipeline-complete-color` | `var(--tc-success)` | Marker fill and border for complete steps. |
| `--bs-pipeline-complete-title-color` | `var(--tc-text)` | Title color for complete steps. |
| `--bs-pipeline-live-color` | `var(--tc-app-accent)` | Marker fill, border, and pulse ring for the live step. |
| `--bs-pipeline-live-title-color` | `var(--tc-text)` | Title color for the live step. |
| `--bs-pipeline-live-title-font-weight` | `600` | Title font weight for the live step. |
| `--bs-pipeline-check-icon-size` | `1rem` | Lucide check icon size inside complete markers. |
| `--bs-pipeline-pulse-duration` | `1.6s` | Duration of the live-step pulse ring animation. |

```html
<tc-pipeline id="pipeline"></tc-pipeline>
<script>
  document.getElementById('pipeline').steps = [
    { title: 'Source',   state: 'complete' },
    { title: 'Build',    state: 'complete' },
    { title: 'Test',     state: 'live' },
    { title: 'Deploy',   state: 'default' },
  ]
</script>
```

---