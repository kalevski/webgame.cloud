---
component: tc-linked-providers-card
---

### tc-linked-providers-card

Section card listing OAuth providers with custom icons and brand colors. A fixed header shows the card title; the body renders one row per provider with an icon tile, label, optional connected-account sub-label, and a connect/disconnect action button. Dispatches `tc-toggle` when an action button is clicked. Empty-state fallback when the `providers` array is empty.

**Tag:** `tc-linked-providers-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | `'Linked providers'` | Card header text rendered as an `<h3>`. |
| `empty-label` | string | `'No providers linked.'` | Text shown when `providers` is an empty array. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `providers` | `LinkedProvider[]` | `[]` | Array of provider objects. Setting it re-renders the list. |
| `brandColors` | `Record<string, string>` | `{}` | Maps a provider key to a CSS color string applied to that provider's icon tile. Only the tile is tinted — all other UI stays slate. |
| `iconForProvider` | `((key: string) => string) or null` | `null` | Optional function returning a lucide icon name (PascalCase) for a given provider key. Falls back to provider.icon, then to 'Link'. |
| `onToggle` | `((key: string, connected: boolean) => void) or null` | `null` | Optional callback fired alongside the `tc-toggle` custom event. |

`LinkedProvider` shape:

```ts
interface LinkedProvider {
    key: string          // unique identifier; used in events and brandColors map
    label: string        // display name shown in the row
    connected?: boolean  // when true: shows a success dot and Unlink action button
    account?: string     // optional sub-label (email or username of connected account)
    icon?: string        // lucide PascalCase icon name; overridden by iconForProvider
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-toggle` | `{ key: string, connected: boolean }` | Fired (bubbles, composed) when the user clicks a row's action button. `key` is the provider key; `connected` is its current state before any toggle. The host does not mutate `providers` automatically — update the array in the handler. |

**Slots**

None. All content is driven by JS properties and attributes.

**Accessibility**

- Card header is a real `<h3>` heading.
- Provider list uses `<ul role="list">` / `<li role="listitem">`.
- Each action button has an `aria-label` describing the provider name and action (`"Connect GitHub"` / `"Disconnect GitHub"`).
- Icon tiles and the connected dot carry `aria-hidden="true"`.
- Focus ring always visible (`outline: 2px solid var(--tc-app-accent)`).
- Touch targets >= 44 px under `@media (pointer: coarse)`.
- `prefers-reduced-motion` is honoured: transitions retain background-color/color but no transforms.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-linked-providers-card-row-separator` | `rgba(148,163,184,0.35)` | Inner hairline between rows (fainter than the outer frame). |
| `--bs-linked-providers-card-row-hover-bg` | `var(--tc-surface-hover)` | Row background on hover. |
| `--bs-linked-providers-card-row-padding-y` | `0.75rem` | Vertical padding of each row. |
| `--bs-linked-providers-card-row-padding-x` | `1.25rem` | Horizontal padding of each row. |
| `--bs-linked-providers-card-label-color` | `var(--tc-text)` | Provider label text color. |
| `--bs-linked-providers-card-account-color` | `var(--tc-text-muted)` | Connected-account sub-label color. |
| `--bs-linked-providers-card-tile-bg` | `var(--tc-surface-muted)` | Icon tile background (slate-100). |
| `--bs-linked-providers-card-tile-size` | `2.125rem` | Square size of the icon tile. |
| `--bs-linked-providers-card-icon-size` | `1rem` | Icon SVG width/height inside the tile. |
| `--bs-linked-providers-card-icon-default-color` | `var(--tc-text-muted)` | Icon color when no brand color is set. |
| `--bs-linked-providers-card-btn-color` | `var(--tc-text-muted)` | Action button icon color at rest. |
| `--bs-linked-providers-card-btn-hover-bg` | `var(--tc-surface-muted)` | Action button hover well background. |
| `--bs-linked-providers-card-btn-size` | `2rem` | Action button hit-area size. |
| `--bs-linked-providers-card-connected-dot-color` | `var(--tc-success)` | Connected state indicator dot color. |
| `--bs-linked-providers-card-empty-color` | `var(--tc-text-faint)` | Empty state text color. |

```html
<!-- Basic usage -->
<tc-linked-providers-card id="lpc" title="Linked providers"></tc-linked-providers-card>
<script>
  const el = document.getElementById('lpc')
  el.providers = [
    { key: 'github', label: 'GitHub', connected: true, account: 'user@example.com', icon: 'Github' },
    { key: 'google', label: 'Google', connected: false, icon: 'Globe' },
  ]
  el.brandColors = { github: '#24292f', google: '#4285F4' }
  el.addEventListener('tc-toggle', e => {
    const { key, connected } = e.detail
    console.log('Toggle:', key, connected)
  })
</script>

<!-- Custom icon resolver -->
<tc-linked-providers-card id="lpc2" title="Integrations"></tc-linked-providers-card>
<script>
  const el2 = document.getElementById('lpc2')
  el2.providers = [{ key: 'zapier', label: 'Zapier', connected: false }]
  el2.iconForProvider = key => key === 'zapier' ? 'Zap' : 'Link'
  el2.brandColors = { zapier: '#ff4a00' }
</script>

<!-- Empty state with custom label -->
<tc-linked-providers-card
  title="Linked providers"
  empty-label="No integrations connected yet.">
</tc-linked-providers-card>
```

---