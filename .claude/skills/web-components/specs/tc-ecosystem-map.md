---
component: tc-ecosystem-map
---

### tc-ecosystem-map

Concentric ring diagram showing ecosystem relationships, rendered as an inline SVG. Always renders a semantic list fallback (`tc-ecosystem-map__list`) alongside the diagram for accessibility and no-SVG contexts. Set `core` and `rings` via JS properties; `size` via attribute.

**Tag:** `tc-ecosystem-map`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `size` | number | `480` | Diameter of the SVG diagram in pixels. Re-renders when changed. |
| `title` | string | — | Optional heading rendered above the diagram as an `<h3>`. When set, takes precedence over the `slot="title"` slot. Read via `getAttribute('title')` (native `HTMLElement.title` reflection). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `core` | `{ name: string; label?: string }` | `{ name: '' }` | Center node of the diagram. Set via JS (`el.core = { name: '@pkg/core', label: 'core' }`). Re-renders when changed. |
| `rings` | `EcosystemRing[]` | `[]` | Array of rings, each with an optional `label` and an `items: EcosystemNode[]` array. Each node has `name: string`, optional `href?: string` (makes the SVG node a link), and optional `accent?: string` (CSS value for `--em-node-accent`). Set via JS (`el.rings = [...]`). Re-renders when changed. |

**Events**

| Event | `detail` | Description |
|-------|----------|-------------|
| `tc-select` | `{ id: string }` | Dispatched (bubbles, composed) when a non-href node in the SVG is clicked or activated via keyboard. `id` encodes the ring index, node index, and name (`"ri-ni-name"`). |

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich content rendered above the diagram when the `title` attribute is not set. Use for headings with markup. |

**Accessibility**

- The SVG carries `role="img"` with an `aria-label` and an inner `<title>` summarising the ecosystem (e.g. `"Ecosystem map: @core, 2 rings, 10 nodes"`).
- The list fallback (`tc-ecosystem-map__list`) is always rendered and is the primary accessible content for screen readers — it is NOT `aria-hidden`.
- Non-href nodes in the SVG are `<g role="button" tabindex="0">` — keyboard-reachable with Enter/Space to dispatch `tc-select`. Focus shows a 2px `--tc-app-accent` outline and a thickened dot stroke.
- `<a href>` nodes in the SVG are native SVG anchors — fully keyboard navigable.
- `prefers-reduced-motion` removes all CSS transitions.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-ecosystem-map-core-fill` | `var(--tc-app-accent)` | Core disc fill (slate ink). |
| `--bs-ecosystem-map-core-text` | `#fff` | Text color on the core disc. |
| `--bs-ecosystem-map-ring-stroke` | `var(--tc-border)` | Dashed ring circle stroke color. |
| `--bs-ecosystem-map-connector-stroke` | `var(--tc-border)` | Connector line stroke color. |
| `--bs-ecosystem-map-node-fill` | `var(--tc-surface)` | Node dot fill. |
| `--bs-ecosystem-map-node-stroke` | `var(--tc-border)` | Node dot border stroke. |
| `--bs-ecosystem-map-node-text` | `var(--tc-text)` | Node text color in the list fallback. |
| `--bs-ecosystem-map-node-label-color` | `var(--tc-text-muted)` | SVG node label text color. |
| `--bs-ecosystem-map-list-bg` | `var(--tc-surface)` | List node chip background. |
| `--bs-ecosystem-map-list-border` | `var(--tc-border)` | List node chip border color. |
| `--bs-ecosystem-map-list-label-color` | `var(--tc-text-faint)` | List group label color. |
| `--bs-ecosystem-map-title-color` | `var(--tc-text)` | Title `<h3>` color. |

```html
<tc-ecosystem-map id="map" title="Package ecosystem" size="480"></tc-ecosystem-map>
<script>
  const el = document.getElementById('map')
  el.core = { name: '@your/core', label: 'core' }
  el.rings = [
    {
      label: 'Official',
      items: [
        { name: '@your/auth' },
        { name: '@your/cache' },
        { name: '@your/queue' },
        { name: '@your/router' },
      ],
    },
    {
      label: 'Community',
      items: [
        { name: 'lib-x', href: 'https://example.com/lib-x' },
        { name: 'lib-y' },
        { name: 'lib-z' },
      ],
    },
  ]
  el.addEventListener('tc-select', e => {
    console.log('selected node id:', e.detail.id)
  })
</script>
```

---