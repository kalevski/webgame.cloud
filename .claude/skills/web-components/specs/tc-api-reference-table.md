---
component: tc-api-reference-table
---

### tc-api-reference-table

Documentation-style API reference table. Renders API items grouped by category with name, signature, returns, and description columns. Deprecated items render an inline warning badge with an optional deprecation note. Purely presentational — no events.

**Tag:** `tc-api-reference-table`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Optional title rendered as a header cap above the table. When absent, slotted children are used as the title instead. |
| `class` | `string` | — | Extra CSS classes passed through to the host element by the author. Not managed by the component. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `groups` | `ApiReferenceGroup[]` | `[]` | Array of group objects. Each group renders a category heading and a table. Takes precedence over `items`. Setting re-renders. |
| `items` | `ApiItem[]` | `[]` | Flat list of API items. Rendered as a single ungrouped section when `groups` is empty. Setting re-renders. |

**ApiReferenceGroup shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `string` | yes | Category label rendered as a mono uppercase heading above the group's table. |
| `items` | `ApiItem[]` | yes | Items in this group. |

**ApiItem shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | yes | API member name. Rendered in JetBrains Mono. |
| `signature` | `string` | no | Type signature or parameter list. Rendered in muted JetBrains Mono. |
| `returns` | `string` | no | Return type. Rendered in JetBrains Mono. |
| `description` | `string` | no | Prose description in Inter. |
| `deprecated` | `boolean \| string` | no | Marks the item deprecated. `true` shows a "Deprecated" badge; a string value additionally shows the string as a deprecation note. |

**Events**

None. `tc-api-reference-table` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Optional title content placed before the tables. Captured and projected into `.tc-api-reference-table-title`. Ignored when the `title` attribute is set. |

**Accessibility**

- Tables use proper `<table>`/`<thead>`/`<tbody>` semantics with `<th scope="col">` header cells.
- The deprecation badge uses `role="note"` and includes the text "Deprecated" — deprecation is not indicated by color alone.
- Focus and contrast are preserved for all text via `--tc-text` / `--tc-text-muted` tokens.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-api-reference-table-border` | `1px solid var(--tc-border)` | Outer frame border. |
| `--bs-api-reference-table-bg` | `var(--tc-surface)` | Table background. |
| `--bs-api-reference-table-title-bg` | `var(--tc-surface-muted)` | Title cap background. |
| `--bs-api-reference-table-title-color` | `var(--tc-text)` | Title text color. |
| `--bs-api-reference-table-title-font-size` | `0.9375rem` | Title font size. |
| `--bs-api-reference-table-title-font-weight` | `600` | Title font weight. |
| `--bs-api-reference-table-group-heading-color` | `var(--tc-text-faint)` | Category heading text color. |
| `--bs-api-reference-table-group-heading-font-size` | `0.6875rem` | Category heading font size. |
| `--bs-api-reference-table-thead-bg` | `var(--tc-slate-50)` | Column header row background. |
| `--bs-api-reference-table-thead-color` | `var(--tc-text-muted)` | Column header text color. |
| `--bs-api-reference-table-row-border` | `1px solid var(--tc-slate-100)` | Inner row separator (fainter than outer frame). |
| `--bs-api-reference-table-name-color` | `var(--tc-text)` | Name column text color. |
| `--bs-api-reference-table-sig-color` | `var(--tc-text-muted)` | Signature column text color. |
| `--bs-api-reference-table-returns-color` | `var(--tc-text)` | Returns column text color. |
| `--bs-api-reference-table-desc-color` | `var(--tc-text-muted)` | Description column text color. |
| `--bs-api-reference-table-depr-badge-bg` | `var(--tc-warning-bg)` | Deprecation badge background. |
| `--bs-api-reference-table-depr-badge-color` | `var(--tc-warning)` | Deprecation badge text and icon color. |
| `--bs-api-reference-table-depr-note-color` | `var(--tc-text-muted)` | Deprecation note text color. |

```html
<!-- Grouped API reference -->
<tc-api-reference-table id="api-table" title="My Library API"></tc-api-reference-table>

<script>
const el = document.getElementById('api-table')
el.groups = [
    {
        category: 'Lifecycle',
        items: [
            {
                name: 'connectedCallback',
                signature: '(): void',
                returns: 'void',
                description: 'Called when the element connects to the document.',
            },
            {
                name: 'render',
                signature: '(): void',
                returns: 'void',
                description: 'Writes Bootstrap-compatible classnames into innerHTML.',
                deprecated: 'Use the new update() method instead.',
            },
        ],
    },
    {
        category: 'Properties',
        items: [
            {
                name: 'items',
                signature: 'ApiItem[]',
                returns: 'ApiItem[]',
                description: 'Array of API items. Setting re-renders the table.',
            },
        ],
    },
]
</script>

<!-- Flat (ungrouped) items -->
<tc-api-reference-table id="flat-table"></tc-api-reference-table>

<script>
document.getElementById('flat-table').items = [
    { name: 'register', signature: '(): void', returns: 'void', description: 'Registers all tc-* elements.' },
    { name: 'icon', signature: '(svg: string): string', returns: 'string', description: 'Wraps a Lucide SVG string.' },
]
</script>

<!-- Slotted title (React node or arbitrary HTML) -->
<tc-api-reference-table>
    <strong>My API</strong> — v2.0 reference
</tc-api-reference-table>
```

---