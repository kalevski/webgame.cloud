---
component: tc-controls-rebind-list
---

### tc-controls-rebind-list

A list of input actions, each rebindable to a key/button. Each row shows an action label on the left and, on the right, the currently-bound key (a sharp mono key-cap) or an "Unbound" placeholder, followed by a "Rebind" affordance that ink-accents on hover/focus. Rows are clickable and keyboard-activatable (Enter/Space) and fire `tc-rebind` with the action id — the consumer is expected to capture the next key press and update the binding. Driven entirely by the `bindings` JS property. Styled to the toolcase design system: a hairline-framed list-group with slate-100 internal separators, a slate-well row hover, and JetBrains Mono key-caps — neutrals carry the list, and the ink accent marks only the active "Rebind" affordance.

**Tag:** `tc-controls-rebind-list`

**Attributes**

None. `tc-controls-rebind-list` is driven entirely by the `bindings` JS property. (The host sets `role="list"` on connect unless one is already present.)

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bindings` | `ControlBinding[]` | `[]` | Array of binding objects. Each item must have `id` and `action`; optional `key` (the bound key/button label — omit or leave empty to render an "Unbound" placeholder). Setting re-renders the list. Getter returns a copy. |
| `onRebind` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-rebind` event. |

`ControlBinding` shape: `{ id: string; action: string; key?: string }`.

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-rebind` | `{ id: string }` | Dispatched when a row is clicked or activated with Enter/Space. `bubbles: true`, `composed: true`. `id` is the activated binding's id. |

**Slots**

None. The component owns every row; content comes from the `bindings` property.

**CSS Custom Properties** (cosmetics flow through `--bs-controls-rebind-list-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-controls-rebind-list-bg` | `var(--tc-surface)` | List background. |
| `--bs-controls-rebind-list-border-color` | `var(--tc-border)` | Outer 1px hairline frame. |
| `--bs-controls-rebind-list-separator-color` | `var(--tc-surface-muted)` | 1px hairline between rows (fainter than the frame). |
| `--bs-controls-rebind-list-row-hover-bg` | `var(--tc-surface-hover)` | Row hover/focus well. |
| `--bs-controls-rebind-list-padding-x` | `0.875rem` | Row horizontal padding. |
| `--bs-controls-rebind-list-padding-y` | `0.625rem` | Row vertical padding. |
| `--bs-controls-rebind-list-gap` | `0.75rem` | Gap between action, key, and rebind affordance. |
| `--bs-controls-rebind-list-action-color` | `var(--tc-text)` | Action label color. |
| `--bs-controls-rebind-list-action-font-size` | `0.8125rem` | Action label size. |
| `--bs-controls-rebind-list-action-font-weight` | `500` | Action label weight. |
| `--bs-controls-rebind-list-empty-color` | `var(--tc-text-faint)` | "Unbound" placeholder color. |
| `--bs-controls-rebind-list-empty-font-size` | `0.71875rem` | "Unbound" placeholder size. |
| `--bs-controls-rebind-list-empty-letter-spacing` | `0.06em` | "Unbound" placeholder letter-spacing. |
| `--bs-controls-rebind-list-key-font-family` | `var(--bs-font-monospace)` | Key-cap font (JetBrains Mono). |
| `--bs-controls-rebind-list-key-font-size` | `0.71875rem` | Key-cap size. |
| `--bs-controls-rebind-list-key-font-weight` | `500` | Key-cap weight. |
| `--bs-controls-rebind-list-key-color` | `var(--tc-text)` | Key-cap text color. |
| `--bs-controls-rebind-list-key-bg` | `var(--tc-surface-muted)` | Key-cap fill. |
| `--bs-controls-rebind-list-key-border-color` | `var(--tc-border-strong)` | Key-cap border. |
| `--bs-controls-rebind-list-key-padding-x` | `0.4em` | Key-cap horizontal padding. |
| `--bs-controls-rebind-list-key-padding-y` | `0.2em` | Key-cap vertical padding. |
| `--bs-controls-rebind-list-key-min-width` | `2rem` | Key-cap minimum width. |
| `--bs-controls-rebind-list-rebind-color` | `var(--tc-text-faint)` | "Rebind" affordance color at rest. |
| `--bs-controls-rebind-list-rebind-hover-color` | `var(--tc-app-accent)` | "Rebind" affordance color on row hover/focus (ink). |
| `--bs-controls-rebind-list-rebind-font-size` | `0.6875rem` | "Rebind" affordance size. |
| `--bs-controls-rebind-list-rebind-letter-spacing` | `0.08em` | "Rebind" affordance letter-spacing. |

**Example**

```html
<tc-controls-rebind-list id="controls"></tc-controls-rebind-list>
<script>
  const list = document.getElementById('controls')
  list.bindings = [
    { id: 'move-up', action: 'Move Up', key: 'W' },
    { id: 'jump', action: 'Jump', key: 'Space' },
    { id: 'crouch', action: 'Crouch' }, // no key → "Unbound"
  ]
  list.addEventListener('tc-rebind', (e) => {
    console.log('rebind requested for', e.detail.id)
    // capture the next key press and update list.bindings…
  })
</script>
```

---