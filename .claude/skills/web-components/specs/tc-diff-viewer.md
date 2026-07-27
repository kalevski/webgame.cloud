---
component: tc-diff-viewer
---

### tc-diff-viewer

Side-by-side or unified line diff of two text blocks with per-line add/remove highlighting. Uses an LCS-based line diff algorithm. No syntax highlighting — the component renders plain text with semantic color cues only.

**Tag:** `tc-diff-viewer`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `before` | `string` | `""` | The "before" text. May also be set via the JS property for large multi-line content. |
| `after` | `string` | `""` | The "after" text. May also be set via the JS property for large multi-line content. |
| `mode` | `"split" \| "unified"` | `"split"` | Layout mode. `split` renders two side-by-side panes; `unified` renders a single column with `+`/`-` prefixes. |
| `language` | `string \| null` | `null` | Optional language label displayed in the header (e.g. `"typescript"`). |
| `filename` | `string \| null` | `null` | Optional filename displayed in the header. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `before` | `string` | The "before" text. Setting this property re-renders immediately without touching the attribute — preferred for large multi-line strings. |
| `after` | `string` | The "after" text. Same semantics as `before`. |
| `mode` | `DiffViewerMode` | Reflected from the `mode` attribute. |
| `language` | `string \| null` | Reflected from the `language` attribute. |
| `filename` | `string \| null` | Reflected from the `filename` attribute. |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-render` | `{}` | Dispatched (bubbles, composed) after each diff re-render. Useful for timing measurements or post-render hooks. |

**Slots**

None. Driven entirely by attributes and JS properties.

**Accessibility**

- Each pane / the unified view renders as a `<table role="table">` so screen readers can traverse rows.
- Gutter line-number cells carry `aria-hidden="true"` — they are decorative.
- Added and removed rows carry `aria-label="Added: <line text>"` / `aria-label="Removed: <line text>"` so color is not the only cue.
- Empty counterpart rows in split mode carry `aria-hidden="true"`.
- Prefix cells (`+` / `-`) in unified mode carry `aria-hidden="true"` — the row `aria-label` is the accessible cue.
- `prefers-reduced-motion` is honoured (no transitions are used; the block ensures forward-compatibility).

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-diff-viewer-bg` | `var(--tc-surface)` | Viewer background. |
| `--bs-diff-viewer-border` | `1px solid var(--tc-border)` | Outer hairline border. |
| `--bs-diff-viewer-header-bg` | `var(--tc-surface-muted)` | Header bar background. |
| `--bs-diff-viewer-header-border` | `1px solid var(--tc-border)` | Header bottom border. |
| `--bs-diff-viewer-header-filename-color` | `var(--tc-text)` | Filename text color. |
| `--bs-diff-viewer-header-language-color` | `var(--tc-text-faint)` | Language label color. |
| `--bs-diff-viewer-sep` | `1px solid var(--tc-border)` | Separator between split panes. |
| `--bs-diff-viewer-gutter-width` | `3.5rem` | Width of the line-number gutter column. |
| `--bs-diff-viewer-gutter-color` | `var(--tc-text-faint)` | Gutter number color. |
| `--bs-diff-viewer-gutter-bg` | `var(--tc-surface-muted)` | Gutter background. |
| `--bs-diff-viewer-gutter-sep` | `1px solid var(--tc-border)` | Gutter right-border separator. |
| `--bs-diff-viewer-code-font-size` | `0.8125rem` | Code cell font size. |
| `--bs-diff-viewer-code-line-height` | `1.6` | Code line height. |
| `--bs-diff-viewer-added-bg` | `var(--tc-success-bg)` | Added line row background. |
| `--bs-diff-viewer-added-gutter-bg` | `#bbf7d0` | Added line gutter background (deeper tint). |
| `--bs-diff-viewer-added-color` | `var(--tc-success)` | Added line gutter/prefix color. |
| `--bs-diff-viewer-removed-bg` | `var(--tc-danger-bg)` | Removed line row background. |
| `--bs-diff-viewer-removed-gutter-bg` | `#fecaca` | Removed line gutter background (deeper tint). |
| `--bs-diff-viewer-removed-color` | `var(--tc-danger)` | Removed line gutter/prefix color. |
| `--bs-diff-viewer-empty-bg` | `var(--tc-surface-muted)` | Empty counterpart rows in split mode. |

```html
<!-- Split mode (default) with filename and language -->
<tc-diff-viewer
  id="dv1"
  mode="split"
  filename="src/server.ts"
  language="typescript"
></tc-diff-viewer>
<script>
  const dv1 = document.getElementById('dv1')
  dv1.before = 'function hello() {\n  console.log("hi")\n}'
  dv1.after  = 'function hello(name: string): void {\n  console.log(`hi ${name}`)\n}'
</script>

<!-- Unified mode -->
<tc-diff-viewer
  id="dv2"
  mode="unified"
  filename="deploy.sh"
  language="bash"
></tc-diff-viewer>
<script>
  const dv2 = document.getElementById('dv2')
  dv2.before = '#!/bin/bash\nnpm install\nnpm run build'
  dv2.after  = '#!/bin/bash\nnpm ci\nnpm run build\nnpm test'
</script>

<!-- Attribute-set content (short strings) -->
<tc-diff-viewer
  mode="split"
  before="hello world"
  after="hello toolcase"
></tc-diff-viewer>
```

---