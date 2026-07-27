---
component: tc-waypoint-marker
---

### tc-waypoint-marker

Absolutely-positioned world-space waypoint marker with a configurable Lucide icon glyph, optional label chip, and formatted distance readout (metres / kilometres). Styled to the toolcase design system: slate neutrals, sharp corners, 1px hairlines. Drop it inside a `position: relative` container and set `x`/`y` to world coordinates. The element is `position: absolute` and transforms to pin the glyph tip at the target point. No shadow root; light DOM; `display: inline-flex`.

**Tag:** `tc-waypoint-marker`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `x` | `number \| null` | `null` | Horizontal position in pixels (`style.left`). Omit to leave unset. |
| `y` | `number \| null` | `null` | Vertical position in pixels (`style.top`). Omit to leave unset. |
| `label` | `string` | `''` | Waypoint label displayed below the glyph. Omit for no text chip. |
| `distance` | `number \| null` | `null` | Distance in metres. Values ≥ 1000 are formatted as `N.Nkm`. Omit for no distance readout. |
| `color` | `string` | `''` | CSS colour for the glyph and border. Writes `--bs-waypoint-marker-color` inline. |
| `icon` | `string` | `''` | Lucide icon name (kebab-case, e.g. `navigation`, `flag`, `map-pin`). Defaults to `navigation` when absent. |
| `size` | `number \| null` | `null` | Glyph icon size in pixels. Writes `--bs-waypoint-marker-size` inline. |

#### JS Properties

| Property | Type | Description |
|---|---|---|
| `x` | `number \| null` | Reflects the `x` attribute. |
| `y` | `number \| null` | Reflects the `y` attribute. |
| `label` | `string` | Reflects the `label` attribute. |
| `distance` | `number \| null` | Reflects the `distance` attribute. |
| `color` | `string` | Reflects the `color` attribute. |
| `icon` | `string` | Reflects the `icon` attribute. |
| `size` | `number \| null` | Reflects the `size` attribute. |

#### Events

None. `tc-waypoint-marker` is a purely presentational element.

#### Slots

None. `tc-waypoint-marker` is attribute-driven; all content is generated internally.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-waypoint-marker-size` | `18px` | Icon glyph size in pixels (overridden by the `size` attribute when set). |
| `--bs-waypoint-marker-color` | `var(--tc-app-accent)` | Glyph and chip-border accent colour (overridden by the `color` attribute when set). |
| `--bs-waypoint-marker-bg` | `var(--tc-surface)` | Background of the label/distance chip. |
| `--bs-waypoint-marker-border-color` | `var(--tc-border)` | 1px hairline border around the label/distance chip. |
| `--bs-waypoint-marker-text-color` | `var(--tc-text)` | Label text colour. |
| `--bs-waypoint-marker-distance-color` | `var(--tc-text-muted)` | Distance readout colour. |
| `--bs-waypoint-marker-label-size` | `11px` | Label font size. |
| `--bs-waypoint-marker-distance-size` | `10px` | Distance readout font size. |

#### Example

```html
<div style="position: relative; height: 200px;">
    <tc-waypoint-marker x="150" y="120" label="Checkpoint A" distance="42"></tc-waypoint-marker>
    <tc-waypoint-marker x="340" y="80"  label="Danger Zone"  distance="1250" color="var(--tc-danger)" icon="flag"></tc-waypoint-marker>
</div>

<!-- JS property update -->
<tc-waypoint-marker id="wp" label="Enemy Base" distance="0"></tc-waypoint-marker>
<script>
    const marker = document.getElementById('wp');
    marker.x = 200;
    marker.y = 150;
    marker.distance = 88;
    marker.color = 'var(--tc-danger)';
    marker.icon = 'skull';
</script>
```

---