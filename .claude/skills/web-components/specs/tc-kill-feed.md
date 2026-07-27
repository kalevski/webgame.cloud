---
component: tc-kill-feed
---

### tc-kill-feed

Stacking feed of kill/event entries rendered in a bordered container. Supports optional per-entry name colours (set as CSS custom properties on each span), a weapon label, and a headshot indicator. Entries are set via the `entries` JS property; only the newest `max-visible` entries are shown. The host carries `role="log"`. Sharp corners; slate neutrals; JetBrains Mono for names.

**Tag:** `tc-kill-feed`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-visible` | number | `5` | Maximum number of entries displayed. Only the most recent entries are rendered; older entries are discarded. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxVisible` | `number` | `5` | Reflected JS accessor for the `max-visible` attribute. |
| `entries` | `KillFeedEntry[]` | `[]` | Array of feed entries. Setting this property re-renders the feed. Pattern: `el.entries = [...el.entries, newEntry]`. |

**KillFeedEntry shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique entry identifier (stamped as `data-id` on the row). |
| `killerName` | `string` | yes | Killer display name. |
| `victimName` | `string` | yes | Victim display name. |
| `killerColor` | `string` | no | CSS colour applied to the killer name via `--bs-kill-feed-killer-color` inline style. |
| `victimColor` | `string` | no | CSS colour applied to the victim name via `--bs-kill-feed-victim-color` inline style. |
| `weapon` | `string` | no | Weapon label text (emoji or short string). Defaults to `⚔` when absent. |
| `headshot` | `boolean` | no | When `true`, renders a `✦` headshot indicator between the weapon and victim name. |

**Events**

None.

**Slots**

None. `tc-kill-feed` is purely data-driven via the `entries` JS property.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-kill-feed-bg` | `var(--tc-surface)` | Feed background colour. |
| `--bs-kill-feed-border` | `1px solid var(--tc-border)` | Outer border of the feed container. |
| `--bs-kill-feed-row-border` | `1px solid var(--tc-slate-100)` | Hairline separator between rows. |
| `--bs-kill-feed-name-font-size` | `0.8125rem` | Font size for killer and victim names. |
| `--bs-kill-feed-killer-color` | `var(--tc-text)` | Default killer name colour (overridden per-entry by `killerColor`). |
| `--bs-kill-feed-victim-color` | `var(--tc-text-muted)` | Default victim name colour (overridden per-entry by `victimColor`). |
| `--bs-kill-feed-weapon-color` | `var(--tc-text-faint)` | Weapon label colour. |
| `--bs-kill-feed-weapon-font-size` | `0.75rem` | Weapon label font size. |
| `--bs-kill-feed-headshot-color` | `var(--tc-accent)` | Headshot indicator colour. |
| `--bs-kill-feed-headshot-font-size` | `0.6875rem` | Headshot indicator font size. |

**Example**

```html
<tc-kill-feed id="feed" max-visible="5"></tc-kill-feed>

<script>
  const feed = document.getElementById('feed')

  feed.entries = [
    { id: '1', killerName: 'Aldric', victimName: 'Goblin', killerColor: '#3b82f6', victimColor: '#ef4444', weapon: '⚔' },
    { id: '2', killerName: 'Brina', victimName: 'Wraith', killerColor: '#22c55e', victimColor: '#a855f7', weapon: '✦', headshot: true },
    { id: '3', killerName: 'Caelum', victimName: 'Bandit', weapon: '🏹' },
  ]

  // append a new entry
  feed.entries = [...feed.entries, {
    id: '4',
    killerName: 'Deva',
    victimName: 'Troll',
    killerColor: '#06b6d4',
    victimColor: '#ef4444',
    weapon: '⚔',
    headshot: true,
  }]
</script>
```

---