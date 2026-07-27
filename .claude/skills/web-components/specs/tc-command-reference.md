---
component: tc-command-reference
---

### tc-command-reference

Searchable reference guide for CLI commands with usage, descriptions, flags, and aliases. Filters results in real time by command name, description, aliases, and flag text.

**Tag:** `tc-command-reference`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `searchable` | `string` | `true` | Show the search input. Set to `"false"` to hide it; any other value (or absent) enables search. |
| `search-placeholder` | `string` | `"Search commands…"` | Placeholder text for the search input (also used as its accessible label). |
| `title` | `string` | — | Optional heading text rendered above the search bar. When absent, use the `title` slot instead. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `commands` | `CommandItem[]` | Required. Array of command descriptors. Each item: `{ name: string; usage?: string; description?: string; flags?: { flag: string; description?: string }[]; aliases?: string[] }`. Setting re-renders. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-search` | `{ query: string }` | Dispatched (bubbles, composed) whenever the search query changes. |

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Slotted title content (e.g. a `<span slot="title">…</span>`). Used when the `title` attribute is absent. Preserved across re-renders. |

**Accessibility**

- Search input has a visually-hidden `<label>` linked via `for`/`id`.
- Results region has `role="region"` and `aria-label="Commands"` for landmark navigation.
- Results region has `tabindex="0"` so keyboard users can scroll without a pointer.
- Focus ring visible on both the search input (via `:focus-within` on the wrapper) and the results region (`:focus-visible`).
- `prefers-reduced-motion` is honoured globally via the reset layer.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-command-reference-border-color` | `var(--tc-border)` | Outer frame and section divider color |
| `--bs-command-reference-bg` | `var(--tc-surface)` | Component background |
| `--bs-command-reference-title-bg` | `var(--tc-surface-muted)` | Title header cap background |
| `--bs-command-reference-title-color` | `var(--tc-text)` | Title text color |
| `--bs-command-reference-title-font-size` | `0.9375rem` | Title font size |
| `--bs-command-reference-title-font-weight` | `600` | Title font weight |
| `--bs-command-reference-search-bg` | `var(--tc-surface)` | Search bar background |
| `--bs-command-reference-search-icon-color` | `var(--tc-text-muted)` | Search icon color |
| `--bs-command-reference-search-icon-size` | `0.9rem` | Search icon size |
| `--bs-command-reference-input-color` | `var(--tc-text)` | Search input text color |
| `--bs-command-reference-input-border` | `1px solid var(--tc-border-strong)` | Search input border |
| `--bs-command-reference-input-focus-ring` | `0 0 0 2px var(--tc-focus-ring)` | Focus ring shadow |
| `--bs-command-reference-item-border` | `1px solid var(--tc-slate-100)` | Between-item hairline |
| `--bs-command-reference-name-color` | `var(--tc-text)` | Command name text color |
| `--bs-command-reference-name-font-size` | `0.875rem` | Command name font size |
| `--bs-command-reference-usage-color` | `var(--tc-text-muted)` | Usage string color |
| `--bs-command-reference-desc-color` | `var(--tc-text)` | Description text color |
| `--bs-command-reference-alias-color` | `var(--tc-text-muted)` | Alias chip text color |
| `--bs-command-reference-alias-bg` | `var(--tc-surface-muted)` | Alias chip background |
| `--bs-command-reference-flag-name-color` | `var(--tc-text)` | Flag name text color |
| `--bs-command-reference-flag-desc-color` | `var(--tc-text-muted)` | Flag description text color |
| `--bs-command-reference-empty-color` | `var(--tc-text-faint)` | Empty-state text color |

**Examples**

```html
<!-- Searchable with full command data (set via JS) -->
<tc-command-reference id="cr"></tc-command-reference>
<script>
    const cr = document.getElementById('cr')
    cr.commands = [
        {
            name: 'build',
            usage: 'build [options]',
            description: 'Compile and bundle the project for production.',
            aliases: ['b'],
            flags: [
                { flag: '--watch', description: 'Rebuild on file changes.' },
                { flag: '--minify', description: 'Enable output minification.' },
            ],
        },
        {
            name: 'dev',
            usage: 'dev [port]',
            description: 'Start the development server with HMR.',
            flags: [
                { flag: '--port <number>', description: 'Port to listen on (default: 5173).' },
            ],
        },
    ]
    cr.addEventListener('tc-search', e => console.log('query:', e.detail.query))
</script>

<!-- With title attribute -->
<tc-command-reference title="CLI Reference" search-placeholder="Filter…"></tc-command-reference>

<!-- With slotted title -->
<tc-command-reference>
    <span slot="title">my-cli — command reference</span>
</tc-command-reference>

<!-- Non-searchable -->
<tc-command-reference searchable="false"></tc-command-reference>
```

---