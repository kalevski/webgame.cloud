---
component: tc-grid
---

### tc-grid

CSS-grid layout primitive. Set a column and/or row count, a gap, and a uniform cell size; children are laid out directly as grid items. Purely structural — no visible chrome, no shadows, no border-radius. All cosmetics flow through `--bs-grid-*` custom properties.

**Responsive (mobile-first).** Every layout attribute has per-breakpoint variants — `columns-{bp}`, `rows-{bp}`, `gap-{bp}`, `cell-size-{bp}` where `{bp}` is `sm | md | lg | xl | xxl` (576 / 768 / 992 / 1200 / 1400 px). The bare attribute is the base/mobile value; each breakpoint variant overrides it from that viewport up, exactly like `tc-col`'s `span-{bp}`. The breakpoint cascade is resolved in pure CSS media queries — there is no JS resize listener, so it reflows for free and is SSR-safe.

**Tag:** `tc-grid`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `columns` | string \| number | — | Number of equal-width columns. Produces `grid-template-columns: repeat(<columns>, <cell-size>)`. When omitted, no explicit column track is set. |
| `rows` | string \| number | — | Number of equal-height rows. Produces `grid-template-rows: repeat(<rows>, <cell-size>)`. When omitted, no explicit row track is set. |
| `gap` | string \| number | `0` | Gap between cells. Bare numbers are treated as `px` (e.g. `gap="8"` → `8px`); any CSS length string is accepted (`1rem`, `0.5em`, …). |
| `cell-size` | string \| number | `1fr` | Size of each track in the `repeat()`. Bare numbers are treated as `px` (e.g. `cell-size="64"` → `64px`); any CSS grid track size is accepted (`1fr`, `64px`, `minmax(0, 1fr)`, …). |
| `columns-{bp}` | string \| number | — | Per-breakpoint column count (`{bp}` = `sm`/`md`/`lg`/`xl`/`xxl`). Overrides `columns` from that breakpoint up. |
| `rows-{bp}` | string \| number | — | Per-breakpoint row count. Overrides `rows` from that breakpoint up. |
| `gap-{bp}` | string \| number | — | Per-breakpoint gap. Overrides `gap` from that breakpoint up. |
| `cell-size-{bp}` | string \| number | — | Per-breakpoint track size. Overrides `cell-size` (for both column and row tracks) from that breakpoint up. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `columns` | string | Reflects the `columns` attribute. |
| `rows` | string | Reflects the `rows` attribute. |
| `gap` | string | Reflects the `gap` attribute. |
| `cellSize` | string | Reflects the `cell-size` attribute. |

**Events**

None. `tc-grid` is a purely presentational element.

**Slots**

Default slot — the grid items (any elements). They are laid out directly; the element does not wrap or re-render them.

**Theming custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-grid-template-columns` | `none` | Resolved base column template; written by the element when `columns` is set. |
| `--bs-grid-template-rows` | `none` | Resolved base row template; written by the element when `rows` is set. |
| `--bs-grid-gap` | `0` | Resolved base gap; written by the element when `gap` is set. |
| `--bs-grid-template-columns-{bp}` | — | Per-breakpoint column template; written only when that breakpoint overrides `columns`/`cell-size`. Falls back through smaller breakpoints to the base var. |
| `--bs-grid-template-rows-{bp}` | — | Per-breakpoint row template; written only when that breakpoint overrides `rows`/`cell-size`. |
| `--bs-grid-gap-{bp}` | — | Per-breakpoint gap; written only when that breakpoint overrides `gap`. |

```html
<!-- Three equal columns, 8px gap -->
<tc-grid columns="3" gap="8">
    <div>1</div><div>2</div><div>3</div>
    <div>4</div><div>5</div><div>6</div>
</tc-grid>

<!-- Responsive: 1 column on mobile, 2 from md, 4 from lg; gap grows too -->
<tc-grid columns="1" columns-md="2" columns-lg="4" gap="8" gap-md="16">
    <div>1</div><div>2</div><div>3</div><div>4</div>
</tc-grid>

<!-- Fixed 64px square cells, 4 columns -->
<tc-grid columns="4" cell-size="64px" gap="1rem">
    <div>A</div><div>B</div><div>C</div><div>D</div>
</tc-grid>

<!-- Hairline grid: 1px gap over a slate background -->
<div style="background: var(--tc-border)">
    <tc-grid columns="3" gap="1">
        <div style="background: var(--tc-surface)">cpu</div>
        <div style="background: var(--tc-surface)">mem</div>
        <div style="background: var(--tc-surface)">disk</div>
    </tc-grid>
</div>
```

---