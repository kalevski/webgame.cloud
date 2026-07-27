---
component: tc-tree-view
---

### tc-tree-view

Hierarchical tree navigation with expand/collapse, optional multi-select checkboxes, and async lazy-loaded branches. Renders a `role="tree"` container of `role="treeitem"` rows; each parent row has a rotating lucide chevron disclosure toggle, an optional leading lucide icon, and a label, with children in a nested `role="group"` `<ul>` shown/hidden by the expanded state. Single-select fills the selected row with ink (white text); `checkbox-mode` enables multi-select where each row carries a `.form-check-input` checkbox, parents aggregate their descendants' membership (checked / indeterminate), and the selected affordance becomes a 2px ink left-marker. A node with a `loadChildren` async loader fetches its children on first expand, showing a `.spinner-border.spinner-border-sm` while loading. Full keyboard support: Up/Down move between visible rows, Right expands/enters, Left collapses/exits, Enter/Space activates selection (roving `tabindex`, disabled nodes skipped).

**Tag:** `tc-tree-view`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `checkbox-mode` | boolean | `false` | When present, enables multi-select with a checkbox on every row (parents aggregate children); the selected affordance becomes an ink left-marker instead of a full fill. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `nodes` | `TreeNode[]` | `[]` | The tree data. Setting re-renders (and clears any async-loaded subtrees). |
| `selected` | `string[]` | `[]` | Selected node keys (controlled). Setting re-renders. |
| `expanded` | `string[]` | `[]` | Expanded node keys (controlled). Setting re-renders. |
| `checkboxMode` | `boolean` | `false` | Reflects the `checkbox-mode` attribute. |
| `onSelect` | `((keys: string[]) => void) \| null` | `null` | Optional callback invoked with the new selection (alongside the `tc-select` event). |
| `onExpandChange` | `((keys: string[]) => void) \| null` | `null` | Optional callback invoked with the new expanded set (alongside the `tc-expand-change` event). |

**`TreeNode` shape**

```ts
interface TreeNode {
    key: string                              // Stable identifier (used in selected/expanded + event detail)
    label: string                            // Visible label text
    icon?: string                            // lucide icon name (kebab-case) → inline SVG
    disabled?: boolean                       // Renders inert + aria-disabled; not selectable/focusable
    children?: TreeNode[]                    // Static child nodes
    loadChildren?: () => Promise<TreeNode[]> // Async loader: fetched on first expand (spinner shown)
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ keys: string[] }` | Fired (bubbles, composed) when the selection changes. `keys` is the new selection array — a single key in single-select, the full membership set in `checkbox-mode`. |
| `tc-expand-change` | `{ keys: string[] }` | Fired (bubbles, composed) when a node is expanded or collapsed. `keys` is the new array of expanded node keys. |

**Slots**

None. All data is supplied via the `nodes` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-tree-view-font-size` | `0.8125rem` | Base font size. |
| `--bs-tree-view-row-min-height` | `32px` | Minimum row height (44px under coarse pointers). |
| `--bs-tree-view-indent` | `1.25rem` | Indentation step per depth level. |
| `--bs-tree-view-hover-bg` | `var(--tc-surface-hover)` | Row hover well. |
| `--bs-tree-view-selected-bg` | `var(--tc-app-accent)` | Selected row fill (single-select). |
| `--bs-tree-view-selected-color` | `#fff` | Selected row text colour (single-select). |
| `--bs-tree-view-marker-color` | `var(--tc-app-accent)` | Ink left-marker colour (checkbox-mode selected). |
| `--bs-tree-view-marker-width` | `2px` | Ink left-marker width. |
| `--bs-tree-view-guide-color` | `var(--tc-border)` | Indentation guide hairline colour. |
| `--bs-tree-view-toggle-color` | `var(--tc-text-muted)` | Chevron toggle colour. |
| `--bs-tree-view-icon-color` | `var(--tc-text-faint)` | Leading icon tint. |
| `--bs-tree-view-spinner-color` | `var(--tc-text-muted)` | Async loading spinner colour. |
| `--bs-tree-view-focus-color` | `var(--tc-accent)` | `:focus-visible` outline colour (cyan accent). |

```html
<tc-tree-view id="tree"></tc-tree-view>
<script>
  const tree = document.getElementById('tree')
  tree.nodes = [
    {
      key: 'src', label: 'src', icon: 'folder',
      children: [
        { key: 'index.ts',  label: 'index.ts',  icon: 'file-code' },
        { key: 'button.ts', label: 'Button.ts', icon: 'file-code' },
      ],
    },
    {
      key: 'remote', label: 'Remote', icon: 'cloud',
      loadChildren: () => fetch('/api/tree/remote').then(r => r.json()),
    },
  ]
  tree.expanded = ['src']
  tree.addEventListener('tc-select', e => console.log('selected', e.detail.keys))
  tree.addEventListener('tc-expand-change', e => console.log('expanded', e.detail.keys))
</script>

<!-- Multi-select with checkboxes -->
<tc-tree-view id="perms" checkbox-mode></tc-tree-view>
```

---