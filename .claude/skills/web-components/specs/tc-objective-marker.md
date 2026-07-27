---
component: tc-objective-marker
---

### tc-objective-marker

Absolutely-positioned world-space marker with a map-pin glyph, optional label, and formatted distance readout (metres / kilometres). Drop it inside a `position: relative` container and set `x`/`y` to world coordinates. The element is `position: absolute` and transforms to pin the glyph tip at the target point. No shadow root; light DOM; `display: inline-flex`.

**Tag:** `tc-objective-marker`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `x` | `number \| null` | `null` | Horizontal position in pixels (`style.left`). Omit to leave unset. |
| `y` | `number \| null` | `null` | Vertical position in pixels (`style.top`). Omit to leave unset. |
| `label` | `string` | `''` | Objective label displayed below the glyph. Omit for no text chip. |
| `distance` | `number \| null` | `null` | Distance in metres. Values ≥ 1000 are formatted as `N.Nkm`. Omit for no distance readout. |
| `color` | `string` | `''` | CSS colour for the glyph and border. Writes `--bs-objective-marker-color` inline. |
| `size` | `number \| null` | `null` | Glyph icon size in pixels. Writes `--bs-objective-marker-size` inline. |
| `pulse` | `boolean` | `false` | Boolean presence attribute. Enables a scale/fade pulse animation on the glyph. |

#### JS Properties

| Property | Type | Description |
|---|---|---|
| `x` | `number \| null` | Reflects the `x` attribute. |
| `y` | `number \| null` | Reflects the `y` attribute. |
| `label` | `string` | Reflects the `label` attribute. |
| `distance` | `number \| null` | Reflects the `distance` attribute. |
| `color` | `string` | Reflects the `color` attribute. |
| `size` | `number \| null` | Reflects the `size` attribute. |
| `pulse` | `boolean` | Reflects the `pulse` boolean attribute. |

#### Events

None. `tc-objective-marker` is a purely presentational element.

#### Slots

None. `tc-objective-marker` is attribute-driven; all content is generated internally.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-objective-marker-size` | `18px` | Map-pin glyph size in pixels (overridden by the `size` attribute when set). |
| `--bs-objective-marker-color` | `var(--tc-app-accent)` | Glyph and chip-border accent colour (overridden by the `color` attribute when set). |
| `--bs-objective-marker-bg` | `var(--tc-surface)` | Background of the label/distance chip. |
| `--bs-objective-marker-border-color` | `var(--tc-border)` | 1px hairline border around the label/distance chip. |
| `--bs-objective-marker-text-color` | `var(--tc-text)` | Label text colour. |
| `--bs-objective-marker-distance-color` | `var(--tc-text-muted)` | Distance readout colour. |
| `--bs-objective-marker-label-size` | `11px` | Label font size. |
| `--bs-objective-marker-distance-size` | `10px` | Distance readout font size. |

#### Example

```html
<div style="position: relative; height: 200px;">
    <tc-objective-marker x="150" y="120" label="Capture" distance="42"></tc-objective-marker>
    <tc-objective-marker x="340" y="80"  label="Boss"    distance="1250" color="var(--tc-danger)" pulse></tc-objective-marker>
</div>

<!-- JS property update -->
<tc-objective-marker id="target" label="Enemy" distance="0"></tc-objective-marker>
<script>
    const marker = document.getElementById('target');
    marker.x = 200;
    marker.y = 150;
    marker.distance = 88;
    marker.color = 'var(--tc-danger)';
    marker.pulse = true;
</script>
```

---