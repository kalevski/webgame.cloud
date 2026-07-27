---
component: tc-extended-select
---

### tc-extended-select

Searchable dropdown with debounced filtering (150 ms), keyboard navigation, optional item descriptions, and native form-submission support via a hidden `<input>`. Implements the combobox/listbox ARIA pattern.

**Tag:** `tc-extended-select`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | — | Key of the currently selected item. Under `multiple` it is the comma-separated list of selected keys |
| `multiple` | boolean | false | Multi-select mode: rows render as a checkbox list, the menu stays open while toggling, and the value becomes a comma-separated key list |
| `name` | string | — | Field name for native form submission (`<input type="hidden">`) |
| `placeholder` | string | `"Select…"` | Trigger label when nothing is selected |
| `search-placeholder` | string | `"Search…"` | Placeholder text in the search input |
| `no-results-text` | string | `"No results"` | Message shown when the filter returns no matches |
| `loading` | boolean | false | Disables the trigger and shows a spinner; the menu cannot be opened |
| `max-height` | number \| CSS length | `240px` | Caps how tall the option list grows before it scrolls. A bare number is read as px (`max-height="320"`); any CSS length (`50vh`, `20rem`) is honoured as-is |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `ExtendedSelectItem[]` | Options list — set via JS property, not attribute |
| `values` | `string[]` | Selected keys as an array — the parsed form of `value`. Reading works in both modes; writing joins with commas |
| `multiple` | `boolean` | Reflects the `multiple` attribute |
| `onChange` | `((value: string) => void) \| ((value: string[]) => void) \| null` | Optional callback fired alongside `tc-change` — gets the key in single mode, the key array under `multiple` |

Each `ExtendedSelectItem`:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Unique identifier; becomes the selected `value` |
| `label` | string | Primary display text shown in trigger and option row |
| `description` | string? | Optional secondary line shown in muted text below the label |

**Events:** `tc-change` with `{ detail: { value: string } }` — `{ detail: { value: string[] } }` under `multiple`

**Slots:** none — the option list is generated from the `items` JS property.

**Keyboard navigation (while menu is open)**

| Key | Action |
|-----|--------|
| `ArrowDown` | Move highlight to next option (wraps) |
| `ArrowUp` | Move highlight to previous option (wraps) |
| `Home` | Jump to first option |
| `End` | Jump to last option |
| `Enter` | Select highlighted option — toggles it and keeps the menu open under `multiple` |
| `Escape` | Close menu, return focus to trigger |

**Multi-select notes**

- The trigger lists up to three picked labels; beyond that it collapses to the `selectedCount` message (`"{count} selected"`, overridable via `configureMessages`).
- Each key is submitted as its own entry under `name`, so read them with `formData.getAll(name)`.
- `required` is satisfied by one or more picks.
- Keys must not contain commas — `value` is a comma-separated list in this mode.

```html
<tc-extended-select
  id="fw-picker"
  placeholder="Choose a framework…"
  search-placeholder="Search…"
  name="framework"
></tc-extended-select>
<script>
const el = document.getElementById('fw-picker')
el.items = [
  { key: 'react',   label: 'React',   description: 'UI library by Meta' },
  { key: 'vue',     label: 'Vue',     description: 'Progressive framework' },
  { key: 'svelte',  label: 'Svelte',  description: 'Compile-time framework' },
  { key: 'angular', label: 'Angular', description: 'Platform by Google' },
]
el.addEventListener('tc-change', e => console.log('selected:', e.detail.value))
</script>

<!-- Preselected value -->
<tc-extended-select value="vue" name="framework"></tc-extended-select>

<!-- Loading state -->
<tc-extended-select placeholder="Fetching…" loading></tc-extended-select>

<!-- Multi-select -->
<tc-extended-select
  id="fw-multi"
  multiple
  name="frameworks"
  value="react,svelte"
  placeholder="Choose frameworks…"
></tc-extended-select>
<script>
const multi = document.getElementById('fw-multi')
multi.items = [
  { key: 'react',  label: 'React' },
  { key: 'vue',    label: 'Vue' },
  { key: 'svelte', label: 'Svelte' },
]
multi.addEventListener('tc-change', e => console.log(e.detail.value)) // ['react','svelte']
console.log(multi.values) // ['react','svelte']
</script>
```

---