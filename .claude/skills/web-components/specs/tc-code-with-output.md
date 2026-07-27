---
component: tc-code-with-output
---

### tc-code-with-output

**Tag:** `tc-code-with-output`

Code snippet and its output displayed side-by-side (`split`) or stacked (`stacked`), with separate panes. The output pane switches to a danger-styled error state when the `error` property or `slot="error"` content is provided. Purely presentational — no callbacks or events.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `code` | string | `""` | The source code to display (HTML-escaped before insertion). |
| `language` | `javascript \| typescript \| bash` | `"javascript"` | Language identifier; rendered as an uppercase mono micro-label in the code pane header. |
| `layout` | `split \| stacked` | `"split"` | `split` places the code and output panes side by side; `stacked` places the code pane above the output pane. |
| `title` | string | — | Optional plain-text header rendered above both panes. Use `slot="title"` for rich content. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `code` | `string` | Reflects the `code` attribute. |
| `language` | `CodeWithOutputLanguage` | Reflects the `language` attribute. |
| `layout` | `CodeWithOutputLayout` | Reflects the `layout` attribute. |
| `title` | `string \| null` | Reflects the `title` attribute. |
| `output` | `string` | HTML (or plain text) to render in the output pane. Set via JS property; complements the `slot="output"` slot. |
| `error` | `string` | HTML (or plain text) to render in the output pane when in error state. When non-empty, switches the pane to danger styling. Complements the `slot="error"` slot. |

**Events**

None. `tc-code-with-output` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich content for the optional title header. Used when the `title` attribute is absent. |
| `output` | Rich output content for the output pane (normal state). Alternative to the `output` JS property. |
| `error` | Rich error content for the output pane (error state). When present, triggers danger styling. Alternative to the `error` JS property. |

**Accessibility**

The `<pre>` block is readable text with no extra role. The output pane gains `role="alert"` automatically when in error state. Focus is never removed. `prefers-reduced-motion` suppresses all transitions.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-cwo-border` | `1px solid var(--tc-border)` | Hairline border around the component and between panes. |
| `--bs-cwo-title-bg` | `var(--tc-surface-muted)` | Title header background. |
| `--bs-cwo-title-color` | `var(--tc-text)` | Title header text color. |
| `--bs-cwo-title-padding` | `0.5rem 0.75rem` | Title header padding. |
| `--bs-cwo-title-font-size` | `0.875rem` | Title header font size. |
| `--bs-cwo-title-font-weight` | `500` | Title header font weight. |
| `--bs-cwo-code-bg` | `var(--tc-ink)` | Code pane background (dark surface). |
| `--bs-cwo-code-header-bg` | `var(--tc-ink-2)` | Code pane header strip background. |
| `--bs-cwo-code-header-padding` | `0.375rem 0.75rem` | Code pane header padding. |
| `--bs-cwo-lang-color` | `var(--tc-text-muted)` | Language micro-label color. |
| `--bs-cwo-lang-font-size` | `0.7rem` | Language micro-label font size. |
| `--bs-cwo-lang-letter-spacing` | `0.08em` | Language micro-label letter spacing. |
| `--bs-cwo-code-color` | `var(--tc-text-inverse)` | Code text color (on dark surface). |
| `--bs-cwo-code-font-size` | `0.85rem` | Code block font size. |
| `--bs-cwo-code-padding` | `0.875rem 0.75rem` | Code block inner padding. |
| `--bs-cwo-code-line-height` | `1.6` | Code block line height. |
| `--bs-cwo-output-bg` | `var(--tc-surface)` | Output pane background. |
| `--bs-cwo-output-color` | `var(--tc-text)` | Output pane text color. |
| `--bs-cwo-output-padding` | `0.75rem` | Output pane inner padding. |
| `--bs-cwo-output-font-size` | `0.875rem` | Output pane font size. |
| `--bs-cwo-error-bg` | `var(--tc-danger-bg)` | Output pane background in error state. |
| `--bs-cwo-error-color` | `var(--tc-danger)` | Output pane text color in error state. |

```html
<!-- Split layout with JS property output -->
<tc-code-with-output
    code="console.log('hello');"
    language="javascript"
    title="Quick example"
    id="my-cwo"
></tc-code-with-output>
<script>
    document.getElementById('my-cwo').output = 'hello'
</script>

<!-- Stacked layout -->
<tc-code-with-output
    code="const x = 1 + 2;\nconsole.log(x);"
    language="javascript"
    layout="stacked"
    id="stacked-cwo"
></tc-code-with-output>
<script>
    document.getElementById('stacked-cwo').output = '3'
</script>

<!-- Error state -->
<tc-code-with-output
    code="undefinedFn();"
    language="javascript"
    id="error-cwo"
></tc-code-with-output>
<script>
    document.getElementById('error-cwo').error = 'ReferenceError: undefinedFn is not defined'
</script>

<!-- Slotted content -->
<tc-code-with-output code="Math.PI" language="javascript">
    <span slot="title">Slotted title</span>
    <span slot="output">3.141592653589793</span>
</tc-code-with-output>
```

---