---
component: tc-guild-panel
---

### tc-guild-panel

Guild / clan panel with a header (eyebrow, guild name + tag, optional motto), a stats strip (optional level, members count or count/cap, online count), and a member roster (status pip, name, optional rank chip, optional contribution). The roster is set via the JS `members` property; the online count and headcount are derived from it automatically. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners (the status pip is the only sanctioned `border-radius`), online/offline status as the only color, and JetBrains Mono for the eyebrows, stat values, tag, rank chips, and contribution figures.

**Tag:** `tc-guild-panel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `guild-name` | string | `""` | Guild display name. Mirrored by the `guildName` JS property. |
| `tag` | string | _(none)_ | Short guild tag, rendered as `[TAG]` beside the name. Hidden when absent. |
| `motto` | string | _(none)_ | Optional motto, rendered in quotes below the name. Hidden when absent. |
| `level` | number | _(none)_ | Optional guild level. When absent, the Level stat is omitted. |
| `member-cap` | number | _(none)_ | Optional roster capacity. When set, the Members stat shows `count/cap`; otherwise just `count`. Mirrored by the `memberCap` JS property. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `members` | `GuildMember[]` | Array of member objects. Set via `el.members = [...]`. Getter returns a copy; setter triggers a re-render. |
| `guildName` | `string` | Reflects the `guild-name` attribute. |
| `tag` | `string` | Reflects the `tag` attribute. |
| `motto` | `string` | Reflects the `motto` attribute. |
| `level` | `number \| null` | Reflects the `level` attribute (`null` when absent). |
| `memberCap` | `number \| null` | Reflects the `member-cap` attribute (`null` when absent). |

`GuildMember` shape:

```ts
interface GuildMember {
    id: string
    name: string
    rank?: string          // optional mono rank chip
    online?: boolean        // drives the status pip (defaults to offline)
    contribution?: number   // optional, rendered with toLocaleString()
}
```

**Events**

None. `tc-guild-panel` is a presentational component driven entirely by attributes and the `members` property.

**Slots**

None. All content is driven by attributes and the `members` JS property.

**Accessibility**

- The host carries `role="group"` (set automatically unless one is already present).
- The roster is a `<ul role="list">`; each member is an `<li role="listitem">`.
- The status pip carries `role="img"` with an `aria-label`/`title` of `"Online"` or `"Offline"`.
- Offline rows are dimmed via `opacity` (never color-only) and the row hover transition respects `prefers-reduced-motion`.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-guild-panel-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-guild-panel-border` | `var(--tc-border)` | Outer border color. |
| `--bs-guild-panel-separator` | `var(--tc-slate-100)` | Header / stat / row separator hairline. |
| `--bs-guild-panel-padding` | `1rem` | Header, stats, and roster padding. |
| `--bs-guild-panel-eyebrow-color` | `var(--tc-text-faint)` | Eyebrow + stat-label micro-label color. |
| `--bs-guild-panel-name-color` | `var(--tc-text)` | Guild name color. |
| `--bs-guild-panel-name-size` | `1.0625rem` | Guild name font size. |
| `--bs-guild-panel-tag-color` | `var(--tc-text-muted)` | Tag color. |
| `--bs-guild-panel-motto-color` | `var(--tc-text-muted)` | Motto color. |
| `--bs-guild-panel-stats-bg` | `var(--tc-surface-muted)` | Stat cell background. |
| `--bs-guild-panel-stat-label-color` | `var(--tc-text-faint)` | Stat label color. |
| `--bs-guild-panel-stat-value-color` | `var(--tc-text)` | Stat value color. |
| `--bs-guild-panel-row-hover-bg` | `var(--tc-surface-hover)` | Member row background on hover. |
| `--bs-guild-panel-member-name-color` | `var(--tc-text)` | Member name color. |
| `--bs-guild-panel-member-rank-bg` | `var(--tc-surface-muted)` | Rank chip background. |
| `--bs-guild-panel-member-rank-color` | `var(--tc-text-muted)` | Rank chip text color. |
| `--bs-guild-panel-member-contribution-color` | `var(--tc-text-muted)` | Contribution figure color. |
| `--bs-guild-panel-pip-size` | `8px` | Status pip diameter. |
| `--bs-guild-panel-pip-online` | `var(--tc-success)` | Online pip color. |
| `--bs-guild-panel-pip-offline` | `var(--tc-text-faint)` | Offline pip color. |

```html
<tc-guild-panel id="gp" guild-name="Iron Vanguard" tag="IRON"
    motto="No retreat, no surrender." level="42" member-cap="50"></tc-guild-panel>

<script>
const gp = document.querySelector('#gp')
gp.members = [
    { id: '1', name: 'Aria Vex', rank: 'Leader',  online: true,  contribution: 48230 },
    { id: '2', name: 'Kestrel',  rank: 'Officer', online: true,  contribution: 31540 },
    { id: '3', name: 'Vesper',   rank: 'Veteran', online: false, contribution: 22810 },
]
</script>
```

---