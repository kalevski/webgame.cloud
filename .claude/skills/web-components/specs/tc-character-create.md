---
component: tc-character-create
---

### tc-character-create

Character-creation panel: a character-name field plus a data-driven list of appearance/class fields (text, select, number, range) and a confirm action. Fields are supplied via the `fields` JS property; current values via the `values` property (controlled) or accumulated internally as the user edits (uncontrolled). Fires `tc-name` on every name keystroke, `tc-change` when any field changes, and `tc-confirm` when the confirm button is clicked. Styled to the toolcase design system (flat slate card, hairline borders, sharp corners, shared form controls, ink primary action).

**Tag:** `tc-character-create`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | — | Character name; reflected as the user types the name field |
| `heading` | string | `New Character` | Mono micro-label (eyebrow) shown above the name field |
| `confirm-label` | string | `Confirm` | Text on the confirm button |
| `name-placeholder` | string | `Character name` | Placeholder text for the name input |
| `id` | string | — | Standard HTML `id` on the host element |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `fields` | `CharacterCreateField[]` | Appearance/class fields to render (set via JS, not attribute) |
| `values` | `Record<string, string \| number>` | Current field values keyed by field `id`; setting re-renders the controls |
| `name` | string | Mirror of the `name` attribute |
| `onName` | `((value: string) => void) \| null` | Optional callback fired alongside `tc-name` |
| `onChange` | `((id: string, value: string \| number) => void) \| null` | Optional callback fired alongside `tc-change` |
| `onConfirm` | `((name: string, values: Record<string, string \| number>) => void) \| null` | Optional callback fired alongside `tc-confirm` |

Each `CharacterCreateField`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique key; used in `values` and the `tc-change` detail |
| `label` | string | Visible field label |
| `type` | `'text' \| 'select' \| 'number' \| 'range'` | Control type (default `text`) |
| `options` | `{ value: string, label: string }[]?` | Options for `select` fields |
| `min` | number? | Minimum for `number` / `range` (range default 0) |
| `max` | number? | Maximum for `number` / `range` (range default 100) |

**Events**

| Event | `detail` | Fired when |
|-------|----------|------------|
| `tc-name` | `{ value: string }` | The name field changes |
| `tc-change` | `{ id: string, value: string \| number }` | A field control changes |
| `tc-confirm` | `{ name: string, values: Record<string, string \| number> }` | The confirm button is clicked |

**Slots:** none — the name field, the field list, and the confirm button are all generated.

```html
<tc-character-create id="hero"></tc-character-create>
<script>
const el = document.getElementById('hero')
el.fields = [
    { id: 'class', label: 'Class', type: 'select', options: [
        { value: 'warrior', label: 'Warrior' },
        { value: 'mage', label: 'Mage' },
    ] },
    { id: 'age', label: 'Age', type: 'number', min: 18, max: 120 },
    { id: 'strength', label: 'Strength', type: 'range', min: 1, max: 20 },
]
el.values = { class: 'mage', age: 31, strength: 14 } // pre-fill (optional)
el.addEventListener('tc-confirm', e => console.log(e.detail.name, e.detail.values))
</script>
```

---