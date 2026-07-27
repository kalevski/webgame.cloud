---
component: tc-chip-group
---

### tc-chip-group

Grouped set of interactive chip buttons with an optional title, subtitle, and hairline border frame. Composes `tc-chip` internally — one chip per item in the `items` JS property. Selection is managed internally (uncontrolled): clicking a chip toggles its `selected` state and dispatches `tc-toggle` with the item id. Sharp corners, slate neutrals, no extra status colour at the group level.

**Tag:** `tc-chip-group`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Group title text rendered in `.tc-chip-group-title`. Also settable as a JS property accepting an HTML string or DOM Node. |
| `subtitle` | string | — | Subtitle text rendered below the title in `.tc-chip-group-subtitle`. Also settable as a JS property accepting an HTML string or DOM Node. |
| `border` | boolean | false | When present, draws a 1 px `--tc-border` hairline frame with sharp corners (`border-radius: 0`) and slate padding around the group. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `ChipGroupItem[]` | `[]` | Array of chip descriptors. Setting this property re-renders all chips. Each item: `{ id: string, label: string, selected?: boolean, icon?: string, count?: number\|string, disabled?: boolean, variant?: string }`. |
| `title` | `string \| Node` | `''` | Group title. Pass a string to set text content; pass a DOM Node to append it directly into `.tc-chip-group-title`. Mirrors the `title` attribute for string values. |
| `subtitle` | `string \| Node` | `''` | Group subtitle. Same Node-or-string contract as `title`. Mirrors the `subtitle` attribute. |
| `onToggle` | `((id: string) => void) \| null` | `null` | Optional callback invoked alongside `tc-toggle` when a chip is toggled. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-toggle` | `{ id: string }` | Fired (bubbles, composed) when a non-disabled chip is activated. The group has already updated the matching item's `selected` state before the event fires. |

**Accessibility**

- The outer `.tc-chip-group` `<div>` carries `role="group"` with `aria-labelledby` pointing to the title span when a title is present.
- Each chip is a real `<button>` (via `tc-chip`) with `aria-pressed` reflecting its `selected` state.
- Disabled items have `opacity: 0.5` and `pointer-events: none` (from `tc-chip`).
- Focus moves through chips via Tab; focus rings use `2px solid var(--tc-app-accent)`.
- 44 px minimum coarse-pointer touch targets are inherited from `tc-chip`.
- Reduced-motion: chip transitions are suppressed by `_chip.scss`.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-chip-group-gap` | `0.5rem` | Vertical gap between header and chip row |
| `--bs-chip-group-item-gap` | `0.375rem` | Gap between individual chips |
| `--bs-chip-group-padding` | `0.75rem` | Padding inside the bordered frame |
| `--bs-chip-group-border-color` | `var(--tc-border)` | Hairline frame colour (when `border` is set) |
| `--bs-chip-group-title-font-size` | `0.875rem` | Title font size |
| `--bs-chip-group-title-font-weight` | `600` | Title font weight |
| `--bs-chip-group-subtitle-font-size` | `0.78125rem` | Subtitle font size (12.5 px) |
| `--bs-chip-group-subtitle-color` | `var(--tc-text-muted)` | Subtitle text colour |

```html
<!-- Basic group — items set via JS property -->
<tc-chip-group id="tags" title="Tags"></tc-chip-group>
<script>
    document.getElementById('tags').items = [
        { id: 'react', label: 'React', selected: true },
        { id: 'ts', label: 'TypeScript' },
        { id: 'rust', label: 'Rust', icon: 'Zap' },
        { id: 'gql', label: 'GraphQL', count: 12 },
        { id: 'legacy', label: 'Legacy', disabled: true },
    ]
    document.getElementById('tags').addEventListener('tc-toggle', e => {
        console.log('toggled:', e.detail.id)
    })
</script>

<!-- Bordered group with subtitle -->
<tc-chip-group title="Issue labels" subtitle="Select labels to filter by" border id="labels"></tc-chip-group>
<script>
    document.getElementById('labels').items = [
        { id: 'bug', label: 'Bug', icon: 'Bug', variant: 'danger' },
        { id: 'feature', label: 'Feature', icon: 'Star', variant: 'success' },
        { id: 'docs', label: 'Docs', icon: 'FileText' },
    ]
</script>

<!-- onToggle callback -->
<tc-chip-group id="opts" title="Options"></tc-chip-group>
<script>
    const grp = document.getElementById('opts')
    grp.items = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta', selected: true }]
    grp.onToggle = id => console.log('toggled via callback:', id)
</script>
```

---