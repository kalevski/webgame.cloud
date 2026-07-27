---
component: tc-game-showcase-card
---

### tc-game-showcase-card

Game showcase card with an artwork region, title, pitch, tag chips, compliance status indicators, and optional corner stamps. Rich-node regions are distributed via named slots; array data (stamps, tags, compliance) is set as JS properties. When `onClick` is assigned, the card becomes keyboard-activatable with `role="button"` and dispatches `tc-click` on click, Enter, or Space.

**Tag:** `tc-game-showcase-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Card title text. Fallback when no `slot="title"` child is present. |
| `pitch` | string | — | Card pitch/description text. Fallback when no `slot="pitch"` child is present. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `stamps` | `GameStamp[]` | `[]` | Corner stamps/badges rendered at the top of the card body. Setting triggers a re-render. |
| `tags` | `string[]` | `[]` | Tag chip labels rendered below the pitch. Setting triggers a re-render. |
| `compliance` | `ComplianceState[]` | `[]` | Compliance status indicators rendered in a footer row. Setting triggers a re-render. |
| `pitch` | `string \| null` | `null` | Reflected as the `pitch` attribute. Settable via JS without going through `setAttribute`. |
| `onClick` | `(() => void) \| null` | `null` | Optional callback invoked alongside `tc-click`. Setting activates the interactive card state (adds `role="button"`, `tabindex="0"`, keyboard activation). |

**`GameStamp` shape**

```ts
interface GameStamp {
    label: string      // Required stamp label text
    icon?: string      // Optional lucide icon name (kebab-case), e.g. "star"
    tone?: string      // Optional tone modifier class suffix: "success" | "warning" | "danger" | "info"
}
```

**`ComplianceState` shape**

```ts
interface ComplianceState {
    label: string                              // Indicator label (e.g. "PEGI 12")
    state: 'pass' | 'warn' | 'fail' | string  // Status drives icon + color; unknown values render the icon from the icon field
    icon?: string                              // Optional lucide icon name for unknown states (kebab-case)
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-click` | `{}` | Fired (bubbles, composed) when the card is clicked, or Enter/Space is pressed while focused. Fires regardless of whether `onClick` is set. |

**Slots**

| Slot | Description |
|------|-------------|
| `art` | Artwork content (image, canvas, div). When present, the `art-placeholder` slot is hidden. |
| `art-placeholder` | Placeholder shown in the art region when no `art` slot content is provided. |
| `meta-left` | Left region of the meta row (e.g. version label). |
| `meta-right` | Right region of the meta row (e.g. studio name). |
| `title` | Card title. When present, the `title` attribute is ignored. |
| `pitch` | Card pitch/description. When present, the `pitch` attribute is ignored. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-game-showcase-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-game-showcase-card-border` | `1px solid var(--tc-border)` | Card border. |
| `--bs-game-showcase-card-shadow` | `var(--tc-shadow-sm)` | Resting box-shadow. |
| `--bs-game-showcase-card-shadow-hover` | `var(--tc-shadow-hover)` | Hover box-shadow. |
| `--bs-game-showcase-card-art-height` | `10rem` | Height of the artwork region. |
| `--bs-game-showcase-card-art-bg` | `var(--tc-surface-muted)` | Placeholder background when no art is provided. |
| `--bs-game-showcase-card-title-color` | `var(--tc-text)` | Title text color. |
| `--bs-game-showcase-card-title-font-size` | `1rem` | Title font size. |
| `--bs-game-showcase-card-title-weight` | `600` | Title font weight. |
| `--bs-game-showcase-card-pitch-color` | `var(--tc-text-muted)` | Pitch text color. |
| `--bs-game-showcase-card-pitch-font-size` | `0.8125rem` | Pitch font size. |
| `--bs-game-showcase-card-tag-bg` | `var(--tc-surface-muted)` | Tag chip background. |
| `--bs-game-showcase-card-tag-color` | `var(--tc-text-muted)` | Tag chip text color. |
| `--bs-game-showcase-card-pass-color` | `var(--tc-success)` | Compliance `pass` indicator color. |
| `--bs-game-showcase-card-warn-color` | `var(--tc-warning)` | Compliance `warn` indicator color. |
| `--bs-game-showcase-card-fail-color` | `var(--tc-danger)` | Compliance `fail` indicator color. |
| `--bs-game-showcase-card-stamp-bg` | `var(--tc-ink)` | Default stamp background. |

```html
<!-- Basic: title + pitch attributes -->
<tc-game-showcase-card
  title="Dragon Realm"
  pitch="An epic fantasy RPG set in a world of ancient dragons."
></tc-game-showcase-card>

<!-- With JS properties -->
<tc-game-showcase-card id="card" title="Horizon Breach" pitch="Open-world co-op action."></tc-game-showcase-card>
<script>
  const card = document.getElementById('card')
  card.stamps = [{ label: 'New', tone: 'success' }, { label: 'Featured', icon: 'star' }]
  card.tags = ['Action', 'Co-op', 'Early Access']
  card.compliance = [
    { label: 'PEGI 18', state: 'fail' },
    { label: 'Accessibility', state: 'pass' },
  ]
</script>

<!-- With art slot and meta labels -->
<tc-game-showcase-card title="Neon Streets" pitch="Cyberpunk city builder.">
  <img slot="art" src="cover.jpg" alt="Neon Streets cover" style="width:100%;height:100%;object-fit:cover" />
  <span slot="meta-left">v2.1.0</span>
  <span slot="meta-right">Studio X</span>
</tc-game-showcase-card>

<!-- Clickable card (dispatches tc-click, keyboard-activatable) -->
<tc-game-showcase-card id="clickable" title="Mind Maze" pitch="Contemplative puzzle game."></tc-game-showcase-card>
<script>
  const el = document.getElementById('clickable')
  el.onClick = () => console.log('card activated')
  el.addEventListener('tc-click', e => console.log('tc-click', e.detail))
</script>
```