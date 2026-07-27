---
component: tc-json-schema-def
---

### tc-json-schema-def

Visual editor for defining JSON schema properties. Renders an optional editable schema-name field, a list of property rows, and an "add property" button. Each row holds a mono property-name input, a type `<select>` (`string`, `number`, `integer`, `boolean`, `object`, `array`, `ref`), a conditional `$ref` selector (shown for `ref` types and populated from `refList`; `array` types use `arrayRefList` for the item ref; `object` types use `objectRefList`), a required toggle, reorder up/down chevron buttons, and a remove button. Adding appends a blank row, removing splices it, reordering swaps it up/down, and any change rebuilds the serialized definition and dispatches `tc-change`. Duplicate (and blank) property names are detected and flagged inline with a `--tc-danger` error message plus `aria-invalid` — the editor never silently overwrites. Light DOM, sharp corners, slate neutrals; composes the shared `.form-control` / `.form-select` / `.form-check-input` classes.

**Tag:** `tc-json-schema-def`

**Serialized value shape:** a JSON array of `{ key: string, type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'ref', required?: boolean, ref?: string }`. `ref` is present only for `ref`/`array`/`object` types and holds the selected reference value.

**Reference item shape:** `SchemaRefItem = { value: string, label?: string }` (the option's `label` defaults to its `value`).

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Editable schema name. When present, renders the name field; committing it (blur/Enter) reflects the attribute and fires `tc-label-change` |
| `value` | string (JSON) | — | Controlled serialized definition. Setting it reparses and re-renders the rows |
| `default-value` | string (JSON) | `[]` | Initial uncontrolled value (seeds the working copy on first render) |
| `disabled` | boolean | false | Disables every control and applies `pointer-events: none` |
| `loading` | boolean | false | Renders animated skeleton placeholder rows |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `refList` | `SchemaRefItem[]` | Selectable references for the `ref` (`$ref`) property type |
| `arrayRefList` | `SchemaRefItem[]` | Selectable item references for the `array` property type |
| `objectRefList` | `SchemaRefItem[]` | Selectable references for the `object` property type |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired alongside `tc-change` |
| `onLabelChange` | `((label: string) => void) \| null` | Optional callback fired alongside `tc-label-change` |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired on add/remove/reorder and any field edit, with the full serialized definition |
| `tc-label-change` | `{ label: string }` | Fired when the schema-name field is committed (blur/Enter) with a changed value |

**Accessibility:** the name field and every property control carry labels (`<label>` or `aria-label`); reorder/remove buttons have `aria-label`s; the duplicate/blank-name error is announced via `aria-invalid` + `aria-describedby` pointing at a `role="alert"` message; the disabled state is real (native `disabled` on controls); focus is visible and reduced motion is honoured.

```html
<tc-json-schema-def id="jsd" label="Person"></tc-json-schema-def>
<script>
const el = document.querySelector('#jsd')
el.refList = [{ value: 'User' }, { value: 'Account' }]
el.arrayRefList = [{ value: 'string' }, { value: 'Tag' }]
el.objectRefList = [{ value: 'Profile' }]
el.defaultValue = JSON.stringify([
    { key: 'id', type: 'string', required: true },
    { key: 'owner', type: 'ref', ref: 'User' },
    { key: 'tags', type: 'array', ref: 'string' },
])
el.addEventListener('tc-change', (e) => console.log(e.detail.value))
el.addEventListener('tc-label-change', (e) => console.log(e.detail.label))
</script>
```

---