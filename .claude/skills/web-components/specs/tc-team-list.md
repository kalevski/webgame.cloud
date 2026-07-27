---
component: tc-team-list
---

### tc-team-list

List of team members rendered as gradient avatar tiles, names, optional emails, and optional role chips. Purely presentational — no events, no slots; driven entirely by the `members` JS property. White `--tc-surface` rows separated by hairlines; sharp corners everywhere except the circular avatar tile (the only sanctioned curve). The avatar is an `<img>` when `avatarUrl` is set, otherwise a slate-ink gradient tile showing the member's `initials` (used verbatim when provided, else derived from `name`).

**Tag:** `tc-team-list`

**Attributes**

None — content is driven exclusively by the `members` property.

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `members` | `TeamMember[]` | `[]` | The members to render. Set via the JS property; re-renders on assignment. |

**TeamMember shape**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Stable identifier for the member. |
| `name` | `string` | Display name; also the accessible label and the basis for derived initials. |
| `email` | `string` | Optional email, shown muted in JetBrains Mono below the name. |
| `role` | `string` | Optional role; rendered as a trailing muted mono chip when present. |
| `initials` | `string` | Optional explicit initials; when absent they are derived from `name` (first letters of up to two words). |
| `avatarUrl` | `string` | Optional image URL; when set the avatar is an `<img>` instead of an initials tile. |
| `gradient` | `boolean` | Whether the initials tile uses the slate-ink gradient (default `true`; set `false` for a plain muted tile). |

**Events**

None (purely presentational).

**Slots**

None.

**Accessibility**

- Container is `role="list"`; each member is `role="listitem"`.
- The initials avatar carries `aria-hidden="true"` (the name text is the accessible label); image avatars get the member name as `alt`.
- `prefers-reduced-motion` disables the row hover transition.

```html
<tc-team-list></tc-team-list>

<script>
const list = document.querySelector('tc-team-list')
list.members = [
    { id: '1', name: 'Alice Chen', email: 'alice@toolcase.dev', role: 'Owner' },
    { id: '2', name: 'Bob Müller', role: 'Maintainer' },
    { id: '3', name: 'Carol Diaz', avatarUrl: 'https://example.com/carol.png' },
]
</script>
```

---