---
component: tc-usage-summary-panel
---

### tc-usage-summary-panel

Usage-metrics panel with labelled progress bars for resource consumption. Presentational only — no events. Data is provided via the `usage` JS property.

**Tag:** `tc-usage-summary-panel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string \| null` | `null` | Optional panel heading. When set, renders a faint ink-gradient header cap above the rows. |
| `loading` | boolean | `false` | When set, replaces row content with animated skeleton placeholders. |
| `loading-count` | `number` | `3` | Number of skeleton rows rendered during the loading state. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `usage` | `UsageConfig[]` | Array of resource usage objects. Setting this property re-renders the panel. |
| `loading` | `boolean` | Reflects the `loading` attribute. |
| `loadingCount` | `number` | Reflects the `loading-count` attribute (default `3`). |

`UsageConfig` shape:
```ts
interface UsageConfig {
    label: string           // row heading (e.g. "Storage")
    used: number            // amount consumed
    total: number           // limit / quota
    measurementUnit: string // unit suffix (e.g. "GB", "req/day")
    warn?: boolean          // force the warning treatment
}
```

The percentage is computed as `clamp(0, round(used / total * 100), 100)`. Numbers are formatted with `Intl.NumberFormat` (max 1 fraction digit). A row is in the warn state when `warn === true` OR `used >= total`.

**Events**

None. `tc-usage-summary-panel` is purely presentational.

**Slots**

None. All content is driven by the `usage` JS property.

**Accessibility**

- Each progress bar carries `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and an `aria-label` (e.g. `"Storage: 24%"`).
- During loading the panel root receives `role="status"` and `aria-busy="true"`; skeleton rows carry `aria-hidden="true"`; a visually-hidden "Loading…" text is included for screen readers.
- `prefers-reduced-motion` freezes the skeleton shimmer to a static fill and disables the progress-bar width transition.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-usage-summary-panel-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-usage-summary-panel-border-color` | `var(--tc-border)` | 1px hairline border colour. |
| `--bs-usage-summary-panel-shadow` | `var(--tc-shadow-sm)` | Resting box shadow. |
| `--bs-usage-summary-panel-padding-y` | `0.875rem` | Vertical inner padding. |
| `--bs-usage-summary-panel-padding-x` | `1rem` | Horizontal inner padding. |
| `--bs-usage-summary-panel-title-bg` | `linear-gradient(135deg, …)` | Header cap gradient (ink). |
| `--bs-usage-summary-panel-title-color` | `rgba(255,255,255,0.9)` | Header cap text colour. |
| `--bs-usage-summary-panel-title-font-size` | `0.6875rem` | Header cap font size. |
| `--bs-usage-summary-panel-label-color` | `var(--tc-text)` | Row label colour. |
| `--bs-usage-summary-panel-label-font-size` | `0.8125rem` | Row label font size. |
| `--bs-usage-summary-panel-value-color` | `var(--tc-text-muted)` | Row value colour. |
| `--bs-usage-summary-panel-value-font-size` | `0.75rem` | Row value font size. |
| `--bs-usage-summary-panel-row-gap` | `0.75rem` | Vertical gap between rows. |
| `--bs-usage-summary-panel-bar-bg` | `var(--tc-slate-200)` | Progress track background. |
| `--bs-usage-summary-panel-bar-fill` | `var(--tc-app-accent)` | Normal progress fill colour. |
| `--bs-usage-summary-panel-bar-height` | `0.375rem` | Progress track height. |
| `--bs-usage-summary-panel-warn-fill` | `var(--tc-warning)` | Warn state progress fill colour. |
| `--bs-usage-summary-panel-warn-value-color` | `var(--tc-warning)` | Warn state value text colour. |

```html
<!-- Basic usage — set items via JS -->
<tc-usage-summary-panel id="usp1" title="Resource Usage"></tc-usage-summary-panel>
<script>
document.getElementById('usp1').usage = [
    { label: 'Storage',   used: 12.4,  total: 50,    measurementUnit: 'GB' },
    { label: 'Bandwidth', used: 320,   total: 1000,  measurementUnit: 'MB' },
    { label: 'API Calls', used: 4800,  total: 10000, measurementUnit: 'req/day' },
]
</script>

<!-- Warn rows — near-limit flagged explicitly, over-limit auto-detected -->
<tc-usage-summary-panel id="usp2" title="Plan Limits"></tc-usage-summary-panel>
<script>
document.getElementById('usp2').usage = [
    { label: 'Storage',   used: 45.2, total: 50,  measurementUnit: 'GB', warn: true },
    { label: 'Bandwidth', used: 320,  total: 1000, measurementUnit: 'MB' },
    { label: 'Seats',     used: 10,   total: 10,   measurementUnit: 'users' },
]
</script>

<!-- Loading skeleton -->
<tc-usage-summary-panel title="Usage" loading loading-count="3"></tc-usage-summary-panel>
```

---