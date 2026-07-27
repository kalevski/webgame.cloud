---
component: tc-quick-start
---

### tc-quick-start

Numbered step-by-step guide with optional code snippets and output sections. Each step has a circular numbered marker connected by a vertical rail line. Code blocks include an optional copy button that dispatches a `tc-copy` event. Purely data-driven — no slot content.

**Tag:** `tc-quick-start`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title-text` | `string` | — | Optional heading rendered above the steps as an `<h2>`. The attribute is named `title-text` (not `title`) to avoid collision with the native `HTMLElement.title` tooltip property. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `titleText` | `string \| null` | Reflects the `title-text` attribute. Setting `null` removes the attribute. |
| `steps` | `QuickStartStep[]` | Array of step objects. Setting re-renders the guide. Default `[]`. |

**`QuickStartStep` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | yes | Step heading rendered as `<h3>`. |
| `description` | `string` | no | Prose paragraph below the heading, rendered in `--tc-text-muted`. |
| `code` | `string` | no | Code string shown in a `<pre><code>` block. HTML is escaped. A copy button appears when this field is present. |
| `output` | `string` | no | Output string shown in a `<pre>` block below the code block. HTML is escaped. |
| `language` | `string` | no | Language hint (informational only — not rendered; syntax highlighting is not applied). |

**Events**

| Event | Bubbles | Detail | Description |
|-------|---------|--------|-------------|
| `tc-copy` | yes (composed) | `{ code: string }` | Fired when the copy button on a code block is clicked. `detail.code` is the raw (unescaped) code string for that step. |

**Slots**

None. All content is supplied via the `title-text` attribute and the `steps` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-quick-start-title-font-size` | `1.125rem` | Title heading font size. |
| `--bs-quick-start-title-font-weight` | `600` | Title heading font weight. |
| `--bs-quick-start-title-color` | `var(--tc-text)` | Title heading text color. |
| `--bs-quick-start-marker-size` | `2rem` | Diameter of the circular step-number marker. |
| `--bs-quick-start-marker-font-size` | `0.8125rem` | Font size of the number inside the marker. |
| `--bs-quick-start-marker-color` | `var(--tc-text-muted)` | Number text color inside the marker. |
| `--bs-quick-start-marker-border` | `1px solid var(--tc-border-strong)` | Ring border of the circular marker. |
| `--bs-quick-start-marker-bg` | `var(--tc-surface)` | Background fill of the circular marker. |
| `--bs-quick-start-connector-color` | `var(--tc-border)` | Color of the vertical rail line between markers. |
| `--bs-quick-start-step-title-font-size` | `0.9375rem` | Step heading font size. |
| `--bs-quick-start-step-title-font-weight` | `500` | Step heading font weight. |
| `--bs-quick-start-step-title-color` | `var(--tc-text)` | Step heading text color. |
| `--bs-quick-start-step-desc-font-size` | `0.875rem` | Step description font size. |
| `--bs-quick-start-step-desc-color` | `var(--tc-text-muted)` | Step description text color. |
| `--bs-quick-start-code-bg` | `var(--tc-surface-muted)` | Code block background (monospace surface). |
| `--bs-quick-start-code-color` | `var(--tc-text)` | Code block text color. |
| `--bs-quick-start-code-font-size` | `0.8125rem` | Code block font size. |
| `--bs-quick-start-code-border` | `1px solid var(--tc-border)` | Code block hairline border. |
| `--bs-quick-start-output-bg` | `var(--tc-surface-hover)` | Output block background (distinct from code surface). |
| `--bs-quick-start-output-color` | `var(--tc-text-muted)` | Output block text color. |
| `--bs-quick-start-output-font-size` | `0.8125rem` | Output block font size. |
| `--bs-quick-start-output-border` | `1px solid var(--tc-border)` | Output block border (top edge omitted — shares border with code block above). |
| `--bs-quick-start-copy-size` | `1.75rem` | Copy button square size. |
| `--bs-quick-start-copy-color` | `var(--tc-text-muted)` | Copy button icon color. |
| `--bs-quick-start-copy-hover-bg` | `var(--tc-surface-hover)` | Copy button hover fill. |
| `--bs-quick-start-copy-hover-color` | `var(--tc-text)` | Copy button icon color on hover. |
| `--bs-quick-start-copy-icon-size` | `0.875rem` | Copy icon size. |

```html
<!-- Steps only (no title) -->
<tc-quick-start id="qs"></tc-quick-start>
<script>
  document.getElementById('qs').steps = [
    {
      title: 'Install the package',
      description: 'Add the package to your project.',
      code: 'npm install @toolcase/web-components',
      language: 'bash',
    },
    {
      title: 'Register',
      code: "import { register } from '@toolcase/web-components'\nregister()",
      language: 'typescript',
    },
  ]
</script>

<!-- With title-text and output -->
<tc-quick-start id="qs2" title-text="Quick Setup"></tc-quick-start>
<script>
  document.getElementById('qs2').steps = [
    {
      title: 'Run the build',
      code: 'npm run build',
      language: 'bash',
      output: '✓ Built in 1.2s',
    },
  ]
</script>

<!-- Listen for tc-copy to implement clipboard write -->
<tc-quick-start id="qs3"></tc-quick-start>
<script>
  const el = document.getElementById('qs3')
  el.steps = [{ title: 'Copy this', code: 'echo hello' }]
  el.addEventListener('tc-copy', e => {
    navigator.clipboard.writeText(e.detail.code)
  })
</script>
```

---