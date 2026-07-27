---
component: tc-download-stats
---

### tc-download-stats

Package download statistics card showing formatted weekly, monthly, and total download counts with an optional sparkline trend chart. Supports npm, PyPI, and crates.io registries. All numbers are formatted with compact notation (`1.2M`, `12.3K`). The sparkline is set via a JS property, not an attribute.

**Tag:** `tc-download-stats`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `package-name` | string | `''` | Package name shown as a mono micro-label in the card header. |
| `weekly` | number | — | Weekly download count. Rendered only when present. |
| `monthly` | number | — | Monthly download count. Rendered only when present. |
| `total` | number | — | Total (all-time) download count. Rendered only when present. |
| `registry` | `'npm' \| 'pypi' \| 'crates'` | `'npm'` | Registry context shown as an icon in the header. Falls back to `'npm'` on unknown values. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `packageName` | `string` | Reflects the `package-name` attribute. |
| `weekly` | `number \| null` | Reflects the `weekly` attribute (numeric). |
| `monthly` | `number \| null` | Reflects the `monthly` attribute (numeric). |
| `total` | `number \| null` | Reflects the `total` attribute (numeric). |
| `registry` | `DownloadStatsRegistry` | Reflects the `registry` attribute. |
| `sparkline` | `number[]` | **JS property only — not an attribute.** Array of download counts to render as an inline SVG line chart below the stat cells. Set via `el.sparkline = [...]`. Triggers a re-render on assignment. |

**Events**

None. `tc-download-stats` is purely presentational.

**Slots**

None. All content is driven by attributes and the `sparkline` JS property.

**Accessibility**

- Package name and stat numbers are real text, not images.
- The sparkline SVG carries `role="img"` with an `aria-label` summarising the trend direction (e.g. `"Download trend from 12 to 55, upward"`). Add `aria-hidden="true"` on the element when it is inside an already-labelled region.
- `prefers-reduced-motion` is honoured — sparkline transitions are disabled.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-download-stats-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-download-stats-border-color` | `var(--tc-border)` | Card frame and header bottom hairline. |
| `--bs-download-stats-shadow` | `var(--tc-shadow-sm)` | Card resting shadow. |
| `--bs-download-stats-padding-y` | `1rem` | Vertical padding for header and stat cells. |
| `--bs-download-stats-padding-x` | `1.25rem` | Horizontal padding for header, cells, and sparkline. |
| `--bs-download-stats-icon-size` | `1rem` | Registry icon size. |
| `--bs-download-stats-icon-color` | `var(--tc-text-muted)` | Registry icon stroke color. |
| `--bs-download-stats-package-color` | `var(--tc-text-muted)` | Package name text color. |
| `--bs-download-stats-package-font-size` | `0.8125rem` | Package name font size. |
| `--bs-download-stats-number-color` | `var(--tc-text)` | Stat number text color. |
| `--bs-download-stats-number-font-size` | `1.375rem` | Stat number font size. |
| `--bs-download-stats-period-color` | `var(--tc-text-muted)` | Period label (Weekly / Monthly / Total) text color. |
| `--bs-download-stats-period-font-size` | `0.6875rem` | Period label font size. |
| `--bs-download-stats-cell-separator-color` | `var(--tc-slate-100)` | Inner hairline between stat cells (fainter than the outer frame). |
| `--bs-download-stats-sparkline-color` | `var(--tc-text-muted)` | Sparkline stroke and dot fill color. |
| `--bs-download-stats-sparkline-height` | `36px` | Sparkline SVG rendered height. |

```html
<!-- npm package with all three counts and a sparkline -->
<tc-download-stats
    id="ds1"
    package-name="@toolcase/web-components"
    weekly="148320"
    monthly="612000"
    total="4800000"
    registry="npm"
></tc-download-stats>
<script>
    document.getElementById('ds1').sparkline = [12, 18, 15, 24, 20, 32, 28, 40, 35, 48]
</script>

<!-- PyPI package, weekly + total only -->
<tc-download-stats
    package-name="toolcase-sdk"
    weekly="9200"
    total="390000"
    registry="pypi"
></tc-download-stats>

<!-- crates.io package, monthly + total only -->
<tc-download-stats
    package-name="toolcase"
    monthly="4100"
    total="52000"
    registry="crates"
></tc-download-stats>
```

---