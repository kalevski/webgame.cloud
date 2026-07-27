---
component: tc-tag-input
---

### tc-tag-input

Tag input with autocomplete recommendations and optional create-on-type. A form-surface control holds committed tag chips and a text field; typing filters the `recommendations` pool (excluding already-selected tags) into an overlay listbox. Enter or comma commits the highlighted suggestion or — with `allow-create` — the raw typed value as a new tag. Arrow keys move the highlight, Backspace on an empty field removes the last tag, Escape closes the menu. Supports a `max-tags` cap, controlled/uncontrolled value, a disabled state, and a loading skeleton. Sharp corners, pure-slate chips, no per-tag colour.

**Tag:** `tc-tag-input`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | string | — | Optional field label rendered above the control and associated with the input. |
| `placeholder` | string | `Add a tag…` | Placeholder for the text field (shown only while there are no tags). |
| `disabled` | boolean | `false` | When present, blocks all interaction. |
| `allow-create` | boolean | `false` | When present, a typed value not in `recommendations` can be committed as a new tag. |
| `max-tags` | number | `0` | Cap on tag count (`0` = unlimited). Once reached, the field is blocked and a "Tag limit reached" hint is shown. |
| `loading` | boolean | `false` | When present, renders an animated placeholder skeleton instead of the control. |
| `max-height` | number \| CSS length | `220px` | Caps how tall the suggestion menu grows before it scrolls. A bare number is read as px (`max-height="320"`); any CSS length (`50vh`, `20rem`) is honoured as-is. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `recommendations` | `string[]` | `[]` | Autocomplete suggestion pool. |
| `value` | `string[] \| undefined` | `undefined` | When set, the component is **controlled**: the current tags come from `value` and are not self-mutated — changes only emit the event. |
| `defaultValue` | `string[]` | `[]` | Seeds the internal tag list when uncontrolled. |
| `onchangetags` | `((tags: string[]) => void) \| null` | `null` | Optional callback fired alongside the `tc-change` event with the updated tags array. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string[] }` | Dispatched whenever a tag is added or removed; `detail.value` is the updated tags array (canonical field-change shape). |

**Slots:** none.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-tag-input-bg` | `var(--tc-surface)` | Control (form surface) fill |
| `--bs-tag-input-border-color` | `var(--tc-border-strong)` | Control hairline border |
| `--bs-tag-input-focus-border` | `rgba(30, 41, 59, 0.5)` | Border colour on `:focus-within` |
| `--bs-tag-input-focus-ring` | `0 0 0 0.2rem rgba(30, 41, 59, 0.12)` | Focus ring on `:focus-within` |
| `--bs-tag-input-chip-bg` | `var(--tc-surface-muted)` | Tag chip fill (pure slate) |
| `--bs-tag-input-chip-border-color` | `var(--tc-border)` | Tag chip hairline |
| `--bs-tag-input-menu-bg` | `var(--tc-surface)` | Suggestion overlay background |
| `--bs-tag-input-menu-shadow` | `var(--tc-shadow-lg)` | Suggestion overlay shadow |
| `--bs-tag-input-menu-z-index` | `var(--tc-z-dropdown)` | Suggestion overlay stack order |
| `--bs-tag-input-menu-max-height` | `220px` | Options list max height before scroll |
| `--bs-tag-input-option-hover-bg` | `var(--tc-surface-muted)` | Option hover background (slate well) |
| `--bs-tag-input-option-active-bg` | `var(--tc-app-accent)` | Highlighted/active option background (ink fill) |
| `--bs-tag-input-option-active-color` | `#fff` | Highlighted/active option text colour |

```html
<tc-tag-input id="ti" label="Languages" placeholder="Add a language…" allow-create></tc-tag-input>
<script>
  const ti = document.getElementById('ti')
  ti.recommendations = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go']
  ti.defaultValue = ['TypeScript']
  ti.addEventListener('tc-change', e => {
    console.log('tags:', e.detail.value)
  })
</script>

<!-- Capped at three tags -->
<tc-tag-input id="ti-cap" label="Frameworks" max-tags="3"></tc-tag-input>
<script>
  const cap = document.getElementById('ti-cap')
  cap.recommendations = ['React', 'Vue', 'Svelte', 'Angular', 'Solid']
</script>

<!-- Controlled -->
<tc-tag-input id="ti-ctl" label="Stack"></tc-tag-input>
<script>
  const ctl = document.getElementById('ti-ctl')
  ctl.recommendations = ['Go', 'Rust', 'Zig']
  ctl.value = ['Go']
  ctl.addEventListener('tc-change', e => {
    ctl.value = e.detail.value // parent owns the state
  })
</script>

<!-- Loading skeleton -->
<tc-tag-input label="Tags" loading></tc-tag-input>
```

---