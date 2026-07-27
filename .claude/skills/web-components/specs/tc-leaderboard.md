---
component: tc-leaderboard
---

### tc-leaderboard

Table-based leaderboard with avatar, tier, sprints, trend, and points columns. Entries are supplied as a JS property (not an attribute). Interactive rows (entries with an `id`) dispatch a `tc-select` event and support keyboard navigation (Enter/Space).

**Tag:** `tc-leaderboard`

**Attributes**

None. All data is supplied via JS properties.

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `entries` | `LeaderboardEntry[]` | `[]` | Array of row data. Set via `el.entries = [...]`. Triggers a re-render. |
| `columns` | `LeaderboardColumns` | `{}` (all visible) | Column visibility and header overrides. Each key (`rank`, `dev`, `tier`, `sprints`, `trend`, `points`) can be `false` (hidden) or a `string` (custom header label). `undefined` shows the column with the default label. |
| `onSelect` | `function \| null` | `null` | Optional callback fired when an interactive row is selected. Receives the `LeaderboardEntry` object. |

**LeaderboardEntry shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rank` | `number` | ✓ | Row rank number. Ranks 1–3 get gold/silver/bronze accent. |
| `name` | `string` | ✓ | Displayed name. Used as avatar `alt` text and initials fallback. |
| `avatarUrl` | `string` | — | If set, renders an `<img>` avatar. Otherwise renders an initials circle. |
| `tier` | `string` | — | Tier label shown in the Tier column (e.g. `"Diamond"`, `"Gold"`). |
| `sprints` | `number` | — | Sprint count shown in the Sprints column. |
| `trend` | `{ value: string; direction: 'up' \| 'down' \| 'flat' }` | — | Trend data rendered via `tc-leaderboard-trend`. |
| `points` | `number` | ✓ | Points value, rendered right-aligned in JetBrains Mono. |
| `id` | `string` | — | When set, makes the row interactive (focusable, keyboard-activatable, fires `tc-select`). |

**Default column headers**

| Column key | Default label |
|------------|---------------|
| `rank` | `#` |
| `dev` | `Developer` |
| `tier` | `Tier` |
| `sprints` | `Sprints` |
| `trend` | `Trend` |
| `points` | `Points` |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-select` | `{ id: string, entry: LeaderboardEntry }` | Fired when an interactive row (one with an `id`) is clicked or activated via Enter/Space. Bubbles and composed. |

**Slots**

None. `tc-leaderboard` is data-driven via the `entries` JS property.

**Accessibility**

Renders a semantic `<table>` with `<thead>`, `<tbody>`, and `<th scope="col">` column headers. Avatar images carry `alt` text; initials circles are `aria-hidden`. Interactive rows are focusable (`tabindex="0"`) and respond to Enter/Space. Focus ring uses `:focus-visible`. Reduced motion is honoured globally. Touch targets for interactive rows are ≥44 px on coarse-pointer devices.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-leaderboard-bg` | `var(--tc-surface)` | Table background. |
| `--bs-leaderboard-border` | `1px solid var(--tc-border)` | Outer frame border. |
| `--bs-leaderboard-row-hairline` | `1px solid var(--tc-slate-100)` | Inner row separator. |
| `--bs-leaderboard-th-font-size` | `0.6875rem` | Header label font size. |
| `--bs-leaderboard-th-color` | `var(--tc-text-muted)` | Header label color. |
| `--bs-leaderboard-td-color` | `var(--tc-text)` | Default cell text color. |
| `--bs-leaderboard-row-hover-bg` | `var(--tc-surface-hover)` | Row hover background. |
| `--bs-leaderboard-row-active-bg` | `var(--tc-surface-muted)` | Row active/pressed background. |
| `--bs-leaderboard-avatar-size` | `2rem` | Avatar diameter. |
| `--bs-leaderboard-avatar-font-size` | `0.6875rem` | Initials font size. |
| `--bs-leaderboard-points-font-size` | `0.875rem` | Points value font size. |
| `--bs-leaderboard-gold` | `#d97706` | Gold accent for rank 1. |
| `--bs-leaderboard-silver` | `#94a3b8` | Silver accent for rank 2. |
| `--bs-leaderboard-bronze` | `#b45309` | Bronze accent for rank 3. |
| `--bs-leaderboard-stripe-width` | `3px` | Left-border stripe width on top-3 rank cells. |

```html
<!-- Basic setup via JS property -->
<tc-leaderboard id="board"></tc-leaderboard>
<script>
  document.getElementById('board').entries = [
    { id: 'u1', rank: 1, name: 'Alice Chen', avatarUrl: '/avatars/alice.png', tier: 'Diamond', sprints: 24, trend: { value: '+240', direction: 'up' }, points: 9420 },
    { id: 'u2', rank: 2, name: 'Bob Müller', tier: 'Platinum', sprints: 21, trend: { value: '-130', direction: 'down' }, points: 8870 },
    { rank: 3, name: 'Carol Diaz', tier: 'Gold', points: 7100 },
  ]

  document.getElementById('board').addEventListener('tc-select', e => {
    console.log('Selected:', e.detail.id, e.detail.entry)
  })

  // Or use the callback property:
  document.getElementById('board').onSelect = entry => console.log('Selected:', entry.name)
</script>
```

```html
<!-- Column-config variant: hide Tier and Sprints, override Trend header -->
<tc-leaderboard id="compact"></tc-leaderboard>
<script>
  const el = document.getElementById('compact')
  el.entries = [ /* ... */ ]
  el.columns = { tier: false, sprints: false, trend: 'Δ 7d' }
</script>
```

---