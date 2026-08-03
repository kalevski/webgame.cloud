---
component: tc-normal-map-generator
---

### tc-normal-map-generator

Canvas-only height→normal map generator. Loads a source image, computes a tangent-space normal map from a luminance emboss + alpha bevel heightmap (Sobel gradient, all in JS), and renders the result on a single layered canvas stage over a checkerboard backdrop. **The element renders no controls at all** — no tool buttons, no preview-mode switcher, no sliders: the whole pipeline (source, strength, emboss, bevel, blur, channel inversion, working resolution, active tool, brush shape, mask overlay, preview mode, light, ambient, zoom, pan) is configured from the outside via attributes/properties. When `editable` and `tool` is a paint tool, pointer-drag paints onto the working buffer (brush raises, erase removes, mask selects); `tool="pan"` drags the view, `tool="none"` makes the canvas inert. Lit modes shade the sprite with a light that follows the cursor unless `light-tracking="off"`. The normal map is recomputed — and a `tc-generate` event fired — whenever the source or any pipeline parameter changes (and after each brush/erase stroke). Sharp corners, slate neutrals, checkerboard stage.

**Tag:** `tc-normal-map-generator`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string (URL) | — | Source image URL (string case of the `source` property) |
| `max-dim` | number | `256` | Working-resolution cap (longest edge, px); changing it re-rasterises the image |
| `canvas-width` | CSS length | `100%` | Preview-canvas width (bare numbers are px, e.g. `480`; `%` / `vw` / `calc()` pass through) |
| `canvas-height` | CSS length | `280px` | Preview-canvas height (bare numbers are px). Under `fit-parent` it becomes the minimum height |
| `fit-parent` | boolean | `false` | Auto-scale: the element and canvas stretch to fill the parent box instead of using `canvas-height`. Give the parent a definite height (`height`, grid/flex track, `aspect-ratio`); where it has none, `canvas-height` is the floor |
| `strength` | number | `1` | Scales the normal-gradient intensity; recomputes on change |
| `emboss-height` | number | `2` | Luminance-emboss height contribution; recomputes on change |
| `bevel-width` | number | `0` | Alpha-bevel reach in px (also softens the surface); recomputes on change |
| `blur-radius` | number | — (auto) | Explicit heightmap blur radius; absent = `bevel-width * 0.5` |
| `invert-x` | boolean | `false` | Flips the red channel (tangent-space handedness) |
| `invert-y` | boolean | `false` | Flips the green channel (OpenGL ↔ DirectX convention) |
| `editable` | boolean | `false` | Enables brush / erase / mask painting on the working buffer |
| `tool` | `brush\|erase\|mask\|pan\|none` | `brush` | Active pointer tool (`none` = inert canvas) |
| `brush-size` | number | `16` | Brush radius in source px |
| `brush-strength` | number | `0.6` | Per-stamp weight at the brush centre |
| `brush-falloff` | number | `1` | Falloff exponent: `1` linear, `>1` softer, `<1` flatter |
| `mask-color` | string | `#22d3ee` | Colour of the translucent mask overlay |
| `mask-opacity` | number | `0.63` | Maximum overlay alpha (0–1) |
| `preview-mode` | `normal\|albedo\|lit\|lit-surface\|height` | `normal` | What the preview canvas renders (`height` = greyscale heightmap) |
| `light-x` / `light-y` | number | `0.35` / `0.3` | Light position, normalised over the sprite |
| `light-z` | number | `0.6` | Light distance in front of the sprite |
| `light-tracking` | `pointer\|off` | `pointer` | Whether the light follows the cursor in lit modes |
| `ambient` | number | `0.2` | Ambient term added to the Lambert shading |
| `zoom` | number | `1` | Extra zoom applied on top of the fit-to-stage scale |
| `pan-x` / `pan-y` | number | `0` | Initial view offset in CSS px (pan tool updates it live) |
| `placeholder` | string | `No source image` | Text drawn on the canvas when no source is loaded |
| `disabled` | boolean | `false` | Disables all interaction (opacity + `pointer-events: none`) |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `source` | `string \| File \| Blob \| null` | Source image. URL strings reflect to the `source` attribute; `File`/`Blob` are loaded via `URL.createObjectURL`. Setting it draws to the source canvas and recomputes |
| `light` | `{ x, y, z }` | Current light position (read/write; writing re-renders the preview) |
| `panX` / `panY` | `number` | Current view offset in CSS px |
| `onGenerate` | `(output: NormalMapOutput) => void \| null` | Optional callback fired alongside `tc-generate` |

Every attribute above also has a matching camelCase property (`strength`, `embossHeight`, `bevelWidth`, `blurRadius`, `invertX`, `invertY`, `maxDim`, `canvasWidth`, `canvasHeight`, `fitParent`, `editable`, `tool`, `brushSize`, `brushStrength`, `brushFalloff`, `maskColor`, `maskOpacity`, `previewMode`, `lightTracking`, `ambient`, `zoom`, `placeholder`, `disabled`).

**Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `regenerate()` | `void` | Recomputes the normal map and re-fires `tc-generate` |
| `clearPaint()` | `void` | Discards painted height offsets and recomputes |
| `clearMask()` | `void` | Discards the selection-mask overlay |
| `resetView()` | `void` | Resets pan to the `pan-x` / `pan-y` origin |
| `toDataURL(type?)` | `string \| null` | Data URL of the computed normal map (`null` before any source loads) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-generate` | `NormalMapOutput` | Fired whenever the normal map is (re)computed — `{ dataUrl: string; width: number; height: number }` (PNG data URL at source resolution) |

**No slots, no controls** — the element owns exactly one canvas; build your own UI around it.

```html
<tc-normal-map-generator
    editable
    tool="brush"
    preview-mode="lit"
    strength="1.5"
    emboss-height="2"
    bevel-width="4"
    brush-size="20"
    invert-y
    light-x="0.2" light-y="0.15" light-tracking="off"
></tc-normal-map-generator>

<!-- fixed canvas box, then auto-scaled to a sized parent -->
<tc-normal-map-generator canvas-width="480" canvas-height="360"></tc-normal-map-generator>

<div style="height: 60vh">
    <tc-normal-map-generator fit-parent canvas-height="200"></tc-normal-map-generator>
</div>

<script>
  const gen = document.querySelector('tc-normal-map-generator')
  gen.source = 'sprite.png' // or a File / Blob
  // Drive tools/modes from your own controls:
  document.querySelector('#erase').onclick = () => gen.setAttribute('tool', 'erase')
  document.querySelector('#reset').onclick = () => gen.clearPaint()
  gen.addEventListener('tc-generate', (e) => {
    document.querySelector('#out').src = e.detail.dataUrl
  })
</script>
```

---