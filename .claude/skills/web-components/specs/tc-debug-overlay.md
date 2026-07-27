---
component: tc-debug-overlay
---

### tc-debug-overlay

**Tag:** `tc-debug-overlay`

Dev/perf overlay rendering an fps readout and key/value stat lines on a dark, machine-facing panel (JetBrains Mono, sharp corners, 1px hairline border, overlay-tier shadow). The four built-in stats are reflected numeric attributes; arbitrary extra lines are supplied via the `rows` JS property. The fps value colour-codes by threshold (≥55 good, ≥30 warning, below danger). Purely presentational — no callbacks or events. The host is `display: inline-block` so the panel hugs its content; position it with your own CSS (e.g. `position: fixed`).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `fps` | number | — | Frames per second. Rendered as the colour-coded `FPS` row when present. |
| `draw-calls` | number | — | Draw-call count. Rendered as the `Draw` row when present. |
| `triangles` | number | — | Triangle count. Rendered as the `Tris` row when present. |
| `mem-mb` | number | — | Memory usage in MB. Rendered as the `Mem` row (with a ` MB` suffix) when present. |

Each built-in row is omitted entirely when its attribute is absent or empty. Numeric values are rounded and locale-formatted (thousands separators).

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fps` | `number \| null` | `null` | Reflects the `fps` attribute. |
| `drawCalls` | `number \| null` | `null` | Reflects the `draw-calls` attribute. |
| `triangles` | `number \| null` | `null` | Reflects the `triangles` attribute. |
| `memMb` | `number \| null` | `null` | Reflects the `mem-mb` attribute. |
| `rows` | `DebugRow[]` | `[]` | Arbitrary extra stat lines appended after the built-in rows. Each entry: `{ label: string; value: string \| number }`. Numeric values are rounded + locale-formatted; string values are rendered verbatim (escaped). Setting this property triggers a re-render. |

**Events**

None. `tc-debug-overlay` is purely presentational.

**Slots**

None. Content is driven entirely by attributes and the `rows` property.

**Accessibility**

Static text content, readable as-is. Focus is never suppressed. The overlay contains no motion of its own; the fps status colours are retained under `prefers-reduced-motion`.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-debug-overlay-bg` | `var(--tc-ink)` | Panel background (dark surface). |
| `--bs-debug-overlay-border` | `1px solid var(--tc-border)` | Outer 1px hairline frame. |
| `--bs-debug-overlay-shadow` | `var(--tc-shadow-lg)` | Overlay-tier drop shadow. |
| `--bs-debug-overlay-min-width` | `140px` | Minimum panel width. |
| `--bs-debug-overlay-padding-y` | `0.5rem` | Vertical panel padding. |
| `--bs-debug-overlay-padding-x` | `0.625rem` | Horizontal panel padding. |
| `--bs-debug-overlay-row-gap` | `0.125rem` | Gap between rows. |
| `--bs-debug-overlay-col-gap` | `0.75rem` | Gap between a row's label and value. |
| `--bs-debug-overlay-z` | `var(--tc-z-tooltip)` | Stacking order (top of the fixed z-scale). |
| `--bs-debug-overlay-font-size` | `0.6875rem` | Mono row font size. |
| `--bs-debug-overlay-label-font-size` | `0.625rem` | Mono micro-label font size. |
| `--bs-debug-overlay-label-color` | `var(--tc-text-faint)` | Label colour. |
| `--bs-debug-overlay-value-color` | `var(--tc-text-inverse)` | Value colour. |
| `--bs-debug-overlay-fps-good-color` | `oklch(0.8 0.17 150)` | FPS value colour when ≥55 (bright green). |
| `--bs-debug-overlay-fps-warning-color` | `oklch(0.83 0.15 80)` | FPS value colour when ≥30 (bright amber). |
| `--bs-debug-overlay-fps-danger-color` | `oklch(0.72 0.18 25)` | FPS value colour when <30 (bright red). |

```html
<!-- Built-in stats via attributes -->
<tc-debug-overlay fps="60" draw-calls="118" triangles="48213" mem-mb="312"></tc-debug-overlay>

<!-- Custom rows via the JS property -->
<tc-debug-overlay id="dbg" fps="58"></tc-debug-overlay>
<script>
    document.getElementById('dbg').rows = [
        { label: 'Entities', value: 1284 },
        { label: 'Scene', value: 'Level 3' },
        { label: 'Audio', value: '12 / 32' },
    ]
</script>

<!-- Live update loop -->
<tc-debug-overlay id="live"></tc-debug-overlay>
<script>
    const el = document.getElementById('live')
    setInterval(() => { el.fps = Math.round(30 + Math.random() * 30) }, 500)
</script>
```

---