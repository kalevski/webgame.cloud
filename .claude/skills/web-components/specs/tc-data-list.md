---
component: tc-data-list
---

### tc-data-list

Generic, data-driven row list. Owns the skeleton every domain list repeats — an `items` array that re-renders on assignment, an optional `list-title` header, an `empty-text` fallback, delegated per-row action buttons, and an optional single-select listbox mode. Domain rendering is supplied at the call site through the `renderRow` function property, so one element replaces the family of near-identical "render an array of rows" components (mute / team / credits / achievement / … lists). Each row must carry a `data-id`; a per-row button marks itself with `data-action="…"`.

**Tag:** `tc-data-list`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `list-title` | string | — | Optional header label shown above the rows. Omit for a bare list. |
| `empty-text` | string | `Nothing to show.` | Text rendered when `items` is empty. |
| `selectable` | boolean | absent | When present, the body becomes a `listbox`, rows become focusable `option`s, and clicking/Enter/Space on a row selects it (`tc-select`). |
| `selected-id` | string | — | The currently selected row's id (selectable mode). Reflected onto rows as `aria-selected` + a `--selected` modifier without a full rebuild. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `any[]` | `[]` | Row data. Re-renders on each set; the getter returns a copy. |
| `renderRow` | `(item, index) => string` | `null` | Row renderer returning the full markup for one row (typically an `<li class="tc-data-list__row" data-id="…">`). Without it, a built-in row reads `id` / `label` / `secondary` / `trailing` off each item. |
| `selectedId` | `string` | `''` | Get/set the selected row id (mirrors `selected-id`). |
| `onAction` | `(detail: { action, id }) => void` \| `null` | `null` | Callback mirror of the `tc-action` event. |
| `onSelect` | `(detail: { id }) => void` \| `null` | `null` | Callback mirror of the `tc-select` event. |

**Row markup contract**

`renderRow` returns whatever markup you like, but the delegated handlers rely on two hooks: the row root carries `data-id="<id>"`, and any actionable button carries `data-action="<name>"`. Reusable BEM parts ship in the stylesheet: `__row` (with `--selected`), `__icon`, `__text` + `__primary` / `__secondary`, `__trailing`, `__action`, `__empty`.

**Events**

| Event | `detail` | Fired when |
|-------|----------|-----------|
| `tc-action` | `{ action: string, id: string }` | A `[data-action]` button inside a row is clicked. `action` is the button's `data-action`; `id` is the row's `data-id`. |
| `tc-select` | `{ id: string }` | A row is selected in `selectable` mode (click or Enter/Space). Also updates `selected-id`. |

Both bubble and are `composed`.

**Slots**

None. Content is driven by `items` + `renderRow`.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-data-list-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-data-list-border` | `1px solid var(--tc-border)` | Outer frame. |
| `--bs-data-list-separator` | `1px solid var(--tc-border)` | Row/header separators. |
| `--bs-data-list-row-hover-bg` | `var(--tc-surface-hover)` | Row hover background. |
| `--bs-data-list-row-selected-bg` | `var(--tc-surface-muted)` | Selected row background (selectable mode). |
| `--bs-data-list-header-bg` | `var(--tc-surface-muted)` | Header strip background. |
| `--bs-data-list-title-color` | `var(--tc-text)` | Header title color. |
| `--bs-data-list-primary-color` | `var(--tc-text)` | Primary line color. |
| `--bs-data-list-secondary-color` | `var(--tc-text-muted)` | Secondary line color. |
| `--bs-data-list-trailing-color` | `var(--tc-text-faint)` | Trailing meta color (mono). |
| `--bs-data-list-action-bg` | `var(--tc-surface)` | Action button background. |
| `--bs-data-list-action-hover-bg` | `var(--tc-app-accent)` | Action button hover background. |
| `--bs-data-list-action-hover-color` | `#fff` | Action button hover text. |
| `--bs-data-list-empty-color` | `var(--tc-text-faint)` | Empty-state text color. |

```html
<tc-data-list id="mutes" empty-text="No muted players."></tc-data-list>

<script>
const el = document.getElementById('mutes')
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

el.renderRow = (p) =>
    `<li class="tc-data-list__row" data-id="${esc(p.id)}" role="listitem">` +
    `<div class="tc-data-list__text">` +
    `<span class="tc-data-list__primary">${esc(p.name)}</span>` +
    (p.reason ? `<span class="tc-data-list__secondary">${esc(p.reason)}</span>` : '') +
    `</div>` +
    `<button type="button" class="tc-data-list__action" data-action="unmute">Unmute</button>` +
    `</li>`

el.items = [
    { id: '1', name: 'ToxicWizard92', reason: 'Spam' },
    { id: '2', name: 'ChatBot_AFK' },
]

el.addEventListener('tc-action', e => {
    // e.detail = { action: 'unmute', id: '1' }
})
</script>
```

---