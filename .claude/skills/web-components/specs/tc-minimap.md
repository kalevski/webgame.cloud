---
component: tc-minimap
---

### tc-minimap

Positioned-marker map surface with a fixed player dot at the centre. World coordinates (`world-x`, `world-y`, `world-width`, `world-height`) define the visible bounds; entity markers are projected onto the surface proportionally. The `rotation` attribute spins the map around the fixed player dot. Entity markers are circles (sanctioned shape); all other chrome uses sharp corners and the slate neutral ramp.

**Tag:** `tc-minimap`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `world-x` | `number` | `0` | Left edge of the visible world region (world-space units). |
| `world-y` | `number` | `0` | Top edge of the visible world region (world-space units). |
| `world-width` | `number` | `100` | Width of the visible world region. Must be at least 1. |
| `world-height` | `number` | `100` | Height of the visible world region. Must be at least 1. |
| `background-image` | `string` | — | URL for the map background image. Applied as `url(…)` via `--bs-minimap-bg-image`. |
| `size` | `number` | — | Side length of the square minimap in pixels. When absent, `--bs-minimap-size` (default `200px`) is used. |
| `rotation` | `number` | `0` | Degrees to rotate the map surface (counter-clockwise) around the fixed player dot. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `markers` | `MinimapMarker[]` | `[]` | Array of entity marker descriptors. Setting this property triggers a re-render. Markers outside the world bounds are silently omitted. |

**MinimapMarker shape**

```ts
interface MinimapMarker {
    id: string       // Unique identifier; used for aria-label.
    x: number        // World-space X position.
    y: number        // World-space Y position.
    color?: string   // CSS colour for this marker (overrides --bs-minimap-marker-color).
    size?: number    // Marker diameter in pixels (overrides --bs-minimap-marker-size).
}
```

#### Events

None. `tc-minimap` is a purely presentational element.

#### Slots

None. `tc-minimap` is attribute- and property-driven.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-minimap-size` | `200px` | Side length of the square minimap (overridden by the `size` attribute when set). |
| `--bs-minimap-surface` | `var(--tc-surface)` | Host background colour. |
| `--bs-minimap-border-color` | `var(--tc-border)` | 1px hairline border around the minimap. |
| `--bs-minimap-bg-image` | `none` | Background image URL (set automatically from the `background-image` attribute). |
| `--bs-minimap-bg-color` | `var(--tc-slate-900)` | Fallback background fill behind the grid and image. |
| `--bs-minimap-grid-color` | `var(--tc-border)` | Colour of the tiled grid hairlines. |
| `--bs-minimap-grid-size` | `20px` | Cell size of the tiled grid. |
| `--bs-minimap-marker-color` | `var(--tc-accent)` | Default entity marker colour (overridable per-marker via the `color` field). |
| `--bs-minimap-marker-size` | `8px` | Default entity marker diameter (overridable per-marker via the `size` field). |
| `--bs-minimap-player-color` | `var(--tc-app-accent)` | Fixed player dot colour (always rendered at the centre). |
| `--bs-minimap-player-size` | `10px` | Fixed player dot diameter. |

#### Example

```html
<tc-minimap id="map" world-width="200" world-height="200" size="240"></tc-minimap>
<script>
    const map = document.getElementById('map');
    map.markers = [
        { id: 'ally',      x: 30,  y: 50,  color: 'var(--tc-success)', size: 10 },
        { id: 'enemy-1',   x: 120, y: 80,  color: 'var(--tc-danger)'            },
        { id: 'objective', x: 100, y: 100, color: 'var(--tc-warning)', size: 14 },
    ];
</script>
```