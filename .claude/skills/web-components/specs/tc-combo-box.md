---
component: tc-combo-box
---

### tc-combo-box

A trigger button with a filterable dropdown of options. Clicking the trigger opens an overlay popover with a search field and a listbox; typing filters the options by `label`, `value`, or `keywords`. Selecting an option closes the popover and fires `tc-change`. Implements the combobox/listbox ARIA pattern. Styled to the web-components design system.

**Tag:** `tc-combo-box`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | — | `value` of the currently selected option |
| `placeholder` | string | `"Select…"` | Trigger label shown when nothing is selected |
| `disabled` | boolean | false | Dims the trigger and prevents the dropdown from opening |
| `max-height` | number \| CSS length | `240px` | Caps how tall the option list grows before it scrolls. A bare number is read as px (`max-height="320"`); any CSS length (`50vh`, `20rem`) is honoured as-is |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `options` | `ComboOption[]` | Options list — set via JS property, not attribute |
| `maxHeight` | string | Reflects the `max-height` attribute |
| `value` | string | Reflects the `value` attribute |
| `placeholder` | string | Reflects the `placeholder` attribute |
| `disabled` | boolean | Reflects the `disabled` attribute |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired alongside `tc-change` |

Each `ComboOption`:

| Field | Type | Description |
|-------|------|-------------|
| `value` | string | Unique identifier; becomes the selected `value` |
| `label` | string | Display text shown in the trigger and option row |
| `keywords` | string[]? | Optional extra search terms matched by the filter |

**Events:** `tc-change` with `{ detail: { value: string } }` — fired only when the selection actually changes.

**Slots:** none — the option list is generated from the `options` JS property.

**Keyboard**

| Key | Action |
|-----|--------|
| `Enter` (in search) | Select the first filtered option |
| `Enter` / `Space` (on option) | Select the focused option |
| `Escape` | Close the popover, return focus to the trigger |
| `Tab` | Move focus through the search field and options |

```html
<tc-combo-box id="fw" placeholder="Choose a framework…"></tc-combo-box>
<script>
const el = document.getElementById('fw')
el.options = [
  { value: 'react',  label: 'React',  keywords: ['meta', 'jsx'] },
  { value: 'vue',    label: 'Vue',    keywords: ['progressive'] },
  { value: 'svelte', label: 'Svelte', keywords: ['compiler'] },
]
el.addEventListener('tc-change', e => console.log('selected:', e.detail.value))
</script>

<!-- Preselected value -->
<tc-combo-box value="vue" placeholder="Choose a framework…"></tc-combo-box>

<!-- Disabled -->
<tc-combo-box value="react" disabled></tc-combo-box>
```

---