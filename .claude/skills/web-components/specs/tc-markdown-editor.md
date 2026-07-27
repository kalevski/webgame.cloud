---
component: tc-markdown-editor
---

### tc-markdown-editor

Split-pane markdown editor with Write/Preview tabs and a formatting toolbar. The toolbar (bold, italic, heading, link, list, quote, code) wraps or prefixes the current textarea selection; switching to Preview renders a small, safe internal markdown-to-HTML conversion (headings, bold/italic, inline code, code fences, links, lists, blockquotes, paragraphs) with all text HTML-escaped and link hrefs protocol-sanitised.

**Tag:** `tc-markdown-editor`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | `''` | Markdown source. Also a JS property kept in sync; set via property for multi-line content. |
| `placeholder` | string | `Write some **Markdown**…` | Textarea placeholder |
| `height` | number \| string | `360` | Editor body height (bare number → px; string passthrough, e.g. `"24rem"`) |
| `toolbar` | boolean | shown | Formatting toolbar. **Shown by default**; set `toolbar="false"` to hide it. |
| `label` | string | — | Optional field label above the editor |
| `disabled` | boolean | false | Disables editing and the toolbar (opacity + `pointer-events: none`) |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | string | Get/set the markdown source. Setting it updates the textarea without losing the active tab. |
| `onChange` | `(value: string) => void \| null` | Optional callback mirror of the `tc-change` event |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-change` | `{ value: string }` | Fired on every edit (typing, toolbar action, Tab indent) |

**Slots:** none.

**Notes:** the textarea has an accessible name (via `label` `<label for>` linkage, or `aria-label="Markdown editor"` when no label). The tab strip is `role="tablist"` with arrow-key / Home / End navigation between Write and Preview; the body is the `role="tabpanel"`. Toolbar buttons carry `aria-label`s. Tab inside the textarea inserts two-space indentation instead of moving focus.

```html
<tc-markdown-editor label="Notes" height="320"></tc-markdown-editor>
<script>
  const ed = document.querySelector('tc-markdown-editor')
  ed.value = '# Hello\n\nSome **markdown**.'
  ed.addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---