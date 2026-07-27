---
component: tc-compass-bar
---

### tc-compass-bar

Horizontal compass strip showing a slice of the heading ring — the field of view (`fov`) — with cardinal ticks (N/NE/E/…) and positioned markers. A fixed ink pointer at the top centre marks the current bearing, and a mono readout shows the zero-padded heading in degrees. Cardinals and markers slide across the strip as the `heading` changes (position tracking transitions are frozen under `prefers-reduced-motion`). Styled to the toolcase design system: flat slate track, 1px hairline frame, sharp corners (the rotated-square marker diamond is still `border-radius: 0`), mono machine-facing text, and the slate ink accent for pointer/markers. No slot children — set markers via the JS `markers` property.

**Tag:** `tc-compass-bar`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `heading` | number | `0` | Current bearing in degrees. Any finite number; normalised to `[0, 360)` for the readout. The strip centres on this heading. |
| `fov` | number | `90` | Field of view in degrees — the angular slice visible across the full strip width. Must be `> 0`; non-positive/invalid values fall back to `90`. Markers and cardinals outside `heading ± fov/2` are not rendered. |
| `width` | number | `320` | Strip width in pixels (bare number → `Npx`, written to `--bs-compass-bar-width`). Omit to use the default. |
| `height` | number | `32` | Track height in pixels (written to `--bs-compass-bar-height`). Omit to use the default (bumped to `40` under coarse pointers). |
| `show-cardinals` | boolean | `false` | When present, renders the eight cardinal/intercardinal ticks (N, NE, E, SE, S, SW, W, NW) at their positions within the FOV. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `markers` | `CompassMarker[]` | Array of marker descriptors positioned by their `heading` within the FOV. Setting this property triggers a re-render. Mirrors the attributes above via `heading`/`fov`/`width`/`height`/`showCardinals` getters/setters. |

**`CompassMarker` shape**

```ts
interface CompassMarker {
  id: string        // unique id, written as data-id
  heading: number   // bearing in degrees; hidden when outside the FOV
  color?: string    // any CSS color; overrides --bs-compass-bar-marker-color for this marker
  label?: string    // optional mono micro-label rendered under the tick
  icon?: string     // optional text glyph; when set, replaces the default diamond tick
}
```

**Events**

None. `tc-compass-bar` is a purely presentational element.

**Slots**

None. The component owns its track and all tick/marker rendering.

**CSS custom properties** (cosmetics flow through `--bs-compass-bar-*`)

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-compass-bar-width` | `320px` | Overall strip width (set from the `width` attribute) |
| `--bs-compass-bar-height` | `32px` | Track height (set from the `height` attribute; `40px` under coarse pointers) |
| `--bs-compass-bar-track-bg` | `var(--tc-surface-muted)` | Track background fill |
| `--bs-compass-bar-track-border` | `1px solid var(--tc-border-strong)` | Track hairline frame |
| `--bs-compass-bar-cardinal-color` | `var(--tc-text-muted)` | Cardinal tick label color |
| `--bs-compass-bar-pointer-color` | `var(--tc-app-accent)` | Fixed centre pointer (ink accent) |
| `--bs-compass-bar-center-color` | `var(--tc-app-accent)` | Faint centre axis line |
| `--bs-compass-bar-marker-color` | `var(--tc-app-accent)` | Marker diamond/glyph color (override per-marker via `CompassMarker.color`) |
| `--bs-compass-bar-marker-label-color` | `var(--tc-text-muted)` | Marker mono micro-label color |
| `--bs-compass-bar-heading-color` | `var(--tc-text)` | Mono heading readout color |
| `--bs-compass-bar-transition` | `var(--tc-transition-fast)` | Position-tracking transition (frozen under reduced motion) |

**Example**

```html
<tc-compass-bar id="compass" heading="45" fov="120" show-cardinals></tc-compass-bar>
<script>
  document.getElementById('compass').markers = [
    { id: 'obj',  heading: 30,  label: 'Objective', color: 'var(--tc-accent)' },
    { id: 'ally', heading: 75,  label: 'Ally' },
    { id: 'base', heading: 350, label: 'Base', icon: '⌂' },
  ]
</script>
```

---