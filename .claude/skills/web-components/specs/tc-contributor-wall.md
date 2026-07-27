---
component: tc-contributor-wall
---

### tc-contributor-wall

Grid of contributor avatar tiles with optional overflow counter and profile links. Avatars are sanctioned circles; initials tiles shown when no `avatarUrl` is provided. Purely presentational — no callbacks or events.

**Tag:** `tc-contributor-wall`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-visible` | number | — | Maximum number of avatars to display. When contributors exceed this limit, a `+N` overflow chip is shown after the last visible avatar. |
| `title` | string | — | Optional plain-text heading rendered above the grid. Use `slot="title"` for rich content. When both are absent, no header is rendered. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `contributors` | `Contributor[]` | Array of contributor entries to render. Set via JS property. Default: `[]`. Re-renders on assignment. |
| `maxVisible` | `number \| null` | Reflects the `max-visible` attribute. `null` when absent. |
| `title` | `string` | Reflects the `title` attribute. |

`Contributor` shape:
```ts
interface Contributor {
    name: string              // display name; used for initials and aria-label
    avatarUrl?: string        // avatar image URL; initials tile shown when absent
    profileUrl?: string       // when set, avatar is rendered as an <a> linking to the profile
    contributions?: number    // optional count included in the accessible label
}
```

**Events**

None. `tc-contributor-wall` is purely presentational.

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich heading content rendered above the grid. Used when the `title` attribute is absent. |

**Accessibility**

Linked avatars are real `<a>` elements with an `aria-label` that includes the contributor name and, when present, the contribution count (e.g. "Alice Martin — 142 contributions"). Non-linked avatars use `role="img"` with the same `aria-label`. The overflow chip carries `aria-label="N more contributors"`. Images use `alt=""` (decorative) since the accessible name is on the ancestor element. Focus ring is always visible. `prefers-reduced-motion` suppresses the 1 px hover lift while keeping the ring transition.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-contributor-wall-avatar-size` | `2.5rem` | Width and height of each avatar circle. |
| `--bs-contributor-wall-avatar-bg` | `var(--tc-surface-muted)` | Background for initials tiles. |
| `--bs-contributor-wall-avatar-color` | `var(--tc-text)` | Initials text color. |
| `--bs-contributor-wall-avatar-ring-color` | `var(--tc-surface)` | Color of the outer ring around each avatar (white by default — use to create an overlapping-avatar effect with negative gap). |
| `--bs-contributor-wall-avatar-ring-size` | `2px` | Thickness of the ring around each avatar. |
| `--bs-contributor-wall-hover-translate` | `-1px` | Vertical lift on hover (`translateY`). |
| `--bs-contributor-wall-hover-ring-color` | `var(--tc-app-accent)` | Ring color on hover/focus. |
| `--bs-contributor-wall-more-bg` | `var(--tc-surface-muted)` | Overflow chip background. |
| `--bs-contributor-wall-more-color` | `var(--tc-text-muted)` | Overflow chip text color. |
| `--bs-contributor-wall-title-color` | `var(--tc-text)` | Heading text color. |
| `--bs-contributor-wall-initials-font-size` | `0.8125rem` | Font size for initials and overflow chip text. |
| `--bs-contributor-wall-gap` | `0.375rem` | Gap between avatar tiles. |

```html
<!-- Basic — all avatars with profile links -->
<tc-contributor-wall id="cw1" title="Top Contributors"></tc-contributor-wall>
<script>
    document.getElementById('cw1').contributors = [
        { name: 'Alice Martin', avatarUrl: 'https://example.com/alice.jpg', profileUrl: 'https://github.com/alice', contributions: 142 },
        { name: 'Bob Chen', profileUrl: 'https://github.com/bob', contributions: 98 },
        { name: 'Chloe Dupont', avatarUrl: 'https://example.com/chloe.jpg', profileUrl: 'https://github.com/chloe', contributions: 74 },
    ]
</script>

<!-- With overflow chip (max-visible=5) -->
<tc-contributor-wall id="cw2" title="Contributors" max-visible="5"></tc-contributor-wall>
<script>
    document.getElementById('cw2').contributors = [
        { name: 'Alice Martin', avatarUrl: 'https://example.com/alice.jpg', profileUrl: '#', contributions: 142 },
        { name: 'Bob Chen', profileUrl: '#', contributions: 98 },
        { name: 'Chloe Dupont', avatarUrl: 'https://example.com/chloe.jpg', profileUrl: '#', contributions: 74 },
        { name: 'David Osei', profileUrl: '#', contributions: 61 },
        { name: 'Eva Rossi', profileUrl: '#', contributions: 43 },
        { name: 'Frank Müller', profileUrl: '#', contributions: 38 },
        { name: 'Grace Kim', profileUrl: '#', contributions: 29 },
    ]
</script>

<!-- Rich title via slot -->
<tc-contributor-wall id="cw3">
    <span slot="title"><strong>Project team</strong></span>
</tc-contributor-wall>
```

---