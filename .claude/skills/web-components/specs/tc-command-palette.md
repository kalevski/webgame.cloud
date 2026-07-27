---
component: tc-command-palette
---

### tc-command-palette

Modal command-search overlay with fuzzy/substring filtering, results grouped by `group`, optional per-item icon and shortcut chips, and full keyboard navigation. Controlled component — fires `tc-select` and `tc-close`; the host does **not** self-close, so set `open=false` in those handlers.

**Tag:** `tc-command-palette`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state — add/remove to show/hide the overlay |
| `placeholder` | string | `Type a command or search…` | Search input placeholder |
| `loading` | boolean | false | Renders a skeleton list instead of results |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `items` | `CommandPaletteItem[]` | Commands to search. Each: `{ id: string; label: string; group?: string; icon?: string; shortcut?: string; keywords?: string[] }`. `icon` is a lucide name; `keywords` extend the search space without being shown. Re-renders on set. |
| `onClose` | `(() => void) \| null` | Callback fired alongside the `tc-close` event |
| `onSelect` | `((item: CommandPaletteItem) => void) \| null` | Callback fired alongside the `tc-select` event |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ item: CommandPaletteItem }` | Fired when an item is chosen (Enter on the highlighted row or click). `tc-close` follows. |
| `tc-close` | `{}` | Fired on backdrop click, Escape, or after a selection. Set `open=false` in this handler — the host does not self-close. |

**Keyboard:** ↑/↓ move the highlight (wrapping), ↵ selects, Esc closes. Typing filters and resets the highlight to the first match.

**Slots:** none — content is driven entirely by the `items` property.

```html
<button id="open-cmd">Open palette</button>
<tc-command-palette id="cmd" placeholder="Type a command…"></tc-command-palette>
<script>
    const cmd = document.querySelector('#cmd')
    cmd.items = [
        { id: 'new', label: 'New File', group: 'File', icon: 'file-plus', shortcut: '⌘ N' },
        { id: 'save', label: 'Save', group: 'File', icon: 'save', shortcut: '⌘ S' },
        { id: 'find', label: 'Find', group: 'Edit', icon: 'search', keywords: ['search'] },
    ]
    document.querySelector('#open-cmd').addEventListener('click', () => cmd.setAttribute('open', ''))
    cmd.addEventListener('tc-select', e => console.log('selected', e.detail.item))
    cmd.addEventListener('tc-close', () => cmd.removeAttribute('open'))
</script>
```

---