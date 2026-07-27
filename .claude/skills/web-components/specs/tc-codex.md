---
component: tc-codex
---

### tc-codex

Codex / bestiary browser: a scrollable list of entries paired with a detail panel that shows the active entry's description and stat rows. Entries are supplied via the `entries` JS property; the current selection is reflected on the `selected-id` attribute. Fires `tc-select` when a row is chosen (click / Enter / Space). Undiscovered entries render masked (`???` name + a muted lucide glyph) but stay focusable and selectable — selecting one shows an "Undiscovered." detail. Styled to the toolcase design system (flat slate list, hairline borders, sharp corners, slate hover well, a solid-ink fill on the selected row, and lucide glyphs in place of the `◆`/`?` unicode markers).

**Tag:** `tc-codex`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `selected-id` | string | — | `id` of the currently selected entry; reflected as the selection changes |
| `id` | string | — | Standard HTML `id` on the host element |

The host element automatically gains `role="group"`; the list is `role="list"` and each row is `role="listitem"`.

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `entries` | `CodexEntry[]` | Entries to render in the list (set via JS, not attribute); setting re-renders the list |
| `selectedId` | string | Mirror of the `selected-id` attribute |
| `onSelect` | `((id: string) => void) \| null` | Optional callback fired alongside `tc-select` |

Each `CodexEntry`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique key; used in `selected-id` and the event `detail` |
| `name` | string | Entry display name (masked to `???` when `discovered` is falsy) |
| `icon` | string? | lucide icon name for the row glyph (kebab-case, e.g. `skull`); defaults to `diamond` |
| `discovered` | boolean? | When falsy, the entry renders masked (`???` + muted glyph) and the detail reads "Undiscovered." |
| `description` | string? | Longer description shown in the detail panel |
| `stats` | `{ label: string, value: string \| number }[]?` | Stat rows shown in the detail panel (numbers are locale-formatted) |

**Events**

| Event | `detail` | Fired when |
|-------|----------|------------|
| `tc-select` | `{ id: string }` | A row is selected (click, Enter, or Space) |

**Slots:** none — the entry list and detail panel are all generated from the `entries` property.

```html
<tc-codex id="bestiary" selected-id="gloomfang"></tc-codex>
<script>
const el = document.getElementById('bestiary')
el.entries = [
    { id: 'gloomfang', name: 'Gloomfang', icon: 'skull', discovered: true,
      description: 'A pack hunter that stalks the lower caverns.',
      stats: [{ label: 'Threat', value: 'High' }, { label: 'Health', value: 2400 }] },
    { id: 'emberwisp', name: 'Emberwisp', icon: 'flame', discovered: true },
    { id: 'unknown-1', name: 'Unknown', discovered: false },
]
el.addEventListener('tc-select', e => console.log('selected', e.detail.id))
</script>
```

---