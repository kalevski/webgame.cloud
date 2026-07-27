---
component: tc-json-editor
---

### tc-json-editor

Schema-driven form editor for JSON objects. A required `schema` JSON string drives the generated fields: each property renders a control matched to its type — text input (`string`), number input (`number`/`integer`), a switch (`boolean`), a select (any property carrying an `enum` array), a collapsible group (`object`, with a rotating chevron), or a repeatable list (`array`) with an add button and per-row remove buttons. Edits update an internal working copy and dispatch `tc-change` with the full updated value object on every change. Light DOM, sharp corners, slate neutrals; composes the shared `.form-control` / `.form-select` / `.form-check.form-switch` classes. Invalid schema JSON renders an inline `--tc-danger` error.

**Tag:** `tc-json-editor`

**Schema property shape:** `{ key: string, type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array', label?: string, defaultValue?: unknown, enum?: (string | number)[], itemType?: 'string' | 'number' | 'integer' | 'boolean', properties?: SchemaProperty[] }`. `object` and array-of-objects use `properties`; primitive arrays use `itemType`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `schema` | string (JSON) | — | **Required.** JSON array of property definitions driving the fields |
| `disabled` | boolean | false | Disables all controls and applies `pointer-events: none` |
| `loading` | boolean | false | Renders animated skeleton placeholder rows |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `Record<string, unknown>` | Controlled object value. Setting it reflects into the fields |
| `defaultValue` | `Record<string, unknown>` | Initial uncontrolled value (seeds the working copy on first render) |
| `onChange` | `((value: Record<string, unknown>) => void) \| null` | Optional callback fired alongside `tc-change` |

**Events:** `tc-change` with `{ detail: { value: Record<string, unknown> } }` — fired on every edit (field change, array add/remove) with the full updated value object.

**Accessibility:** every field has an associated `<label>`; collapsible groups use `aria-expanded` + `aria-controls`; add/remove buttons carry `aria-label`s; the disabled state is real (native `disabled` on controls); focus is visible and reduced motion is honoured.

```html
<tc-json-editor id="je"></tc-json-editor>
<script>
const el = document.querySelector('#je')
el.setAttribute('schema', JSON.stringify([
    { key: 'name', type: 'string' },
    { key: 'port', type: 'integer', defaultValue: 8080 },
    { key: 'enabled', type: 'boolean' },
    { key: 'logLevel', type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
    { key: 'database', type: 'object', properties: [
        { key: 'host', type: 'string' },
        { key: 'ssl', type: 'boolean' },
    ] },
    { key: 'tags', type: 'array', itemType: 'string' },
]))
el.defaultValue = { name: 'api', port: 8080, enabled: true, logLevel: 'info', database: { host: 'localhost', ssl: false }, tags: ['edge'] }
el.addEventListener('tc-change', (e) => console.log(e.detail.value))
</script>
```

---