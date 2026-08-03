### tc-bitmap-font-generator

Canvas-only bitmap-font atlas generator. **The element renders no controls** — no input panel, no generate button, no descriptor block: it owns a single live preview `<canvas>` and everything else is configured from the outside. Attributes cover the whole surface (font, content, solid/gradient fill, stacked outlines, drop shadow, glow, atlas layout, power-of-two snapping, export scale/format, and the preview's own backdrop/padding/scale/alignment); the structured effect objects can additionally be set as JS properties, which override the matching attributes until cleared with `null`. Generation, clipboard copy, and download are imperative methods (or set `auto-generate` to re-export on every change). Sharp corners, slate neutrals, checkerboard preview stage.

**Tag:** `tc-bitmap-font-generator`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `font-family` | string | `Arial` | Font used to rasterise the glyphs |
| `font-size` | number | `32` | Glyph size in px |
| `glyphs` | string | full ASCII set | Characters to render into the atlas (duplicates removed) |
| `text` | string | `Hello World!` | Live-preview text drawn with the current effects (`\n` breaks lines) |
| `fill-type` | `solid\|gradient` | `solid` | Fill mode |
| `fill-color` | string | `#ffffff` | Solid fill colour (also the gradient fallback) |
| `gradient-type` | `linear\|radial` | `linear` | Gradient shape |
| `gradient-colors` | comma list | — | Gradient stops, e.g. `#ff6b6b,#ffd93d,#6bccff` |
| `gradient-angle` | number | `90` | Linear-gradient angle in degrees |
| `border-color` | string | `#000000` | Outline colour (its presence implies `border-thickness="2"`) |
| `border-thickness` | number | `0` | Outline thickness in px; `0` = no outline |
| `border-align` | `inner\|outer\|center` | `center` | Where the stroke sits relative to the glyph edge |
| `borders` | JSON string | — | Stacked outlines, e.g. `[{"color":"#000","thickness":3},{"color":"#fff","thickness":6}]`; overrides the single-border attributes |
| `shadow-color` | string | `#000000` | Drop-shadow colour (its presence implies `shadow-size="4"`) |
| `shadow-size` | number | `0` | Drop-shadow size in px; `0` = no shadow |
| `shadow-offset-x` / `shadow-offset-y` | number | `size * 0.5` | Shadow offsets |
| `shadow-blur` | number | `size` | Shadow blur radius |
| `glow-color` | string | `#00e5ff` | Glow colour (its presence implies `glow-size="8"`) |
| `glow-size` | number | `0` | Symmetric outer-glow size in px; `0` = no glow |
| `letter-spacing` | number | `0` | Extra px added to each glyph cell width |
| `padding` | number | `2` | Px padding baked around each glyph cell |
| `glyphs-per-row` | number | `16` | Glyphs packed per atlas row |
| `line-height` | number | `0` | Reported BMFont lineHeight; `0` = auto (cell height) |
| `power-of-two` | boolean | `false` | Round atlas dimensions up to the next power of two |
| `scale` | number | `1` | Multiplies all geometry for a hi-res export atlas |
| `background` | string | — (transparent) | Atlas background colour; absent = transparent |
| `export-format` | `xml\|json\|fnt` | `xml` | Descriptor format returned in `output.text` |
| `auto-generate` | boolean | `false` | Re-runs `generate()` (debounced) on every config change |
| `preview-background` | string | falls back to `background` | Preview canvas backdrop; absent = transparent (checkerboard shows) |
| `preview-padding` | number | `16` | Preview margin in CSS px |
| `preview-line-gap` | number | `8` | Extra px between wrapped preview lines |
| `preview-scale` | number | `1` | Scales the preview geometry only (export uses `scale`) |
| `preview-align` | `start\|center\|end` | `start` | Horizontal alignment of each preview line |
| `canvas-width` | CSS length | `100%` | Preview-canvas width (bare numbers are px, e.g. `480`; `%` / `vw` / `calc()` pass through) |
| `canvas-height` | CSS length | `240px` | Preview-canvas height (bare numbers are px). Under `fit-parent` it becomes the minimum height |
| `fit-parent` | boolean | `false` | Auto-scale: the element and canvas stretch to fill the parent box instead of using `canvas-height`. Give the parent a definite height (`height`, grid/flex track, `aspect-ratio`); where it has none, `canvas-height` is the floor. Preview-only — the exported atlas is unaffected |
| `disabled` | boolean | `false` | Blocks `generate()` and dims the canvas |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `fill` | `BitmapFontFill` | `{ type: 'solid'\|'gradient'; color?; gradientColors?; gradientAngle?; gradientType?: 'linear'\|'radial' }`. Reading returns the attribute-derived value unless an object was assigned; assign `null` to fall back to the attributes |
| `border` | `BitmapFontBorder \| null` | Single stroke `{ color; thickness; align?: 'inner'\|'outer'\|'center' }`. Ignored when `borders` is non-empty |
| `borders` | `BitmapFontBorder[]` | Stacked outlines, drawn thickest-first (concentric). Overrides `border` and the border attributes |
| `dropShadow` | `BitmapFontDropShadow \| null` | `{ color; size; offsetX?; offsetY?; blur? }`. Offsets/blur default off `size` |
| `glow` | `BitmapFontGlow \| null` | Symmetric outer glow `{ color; size }` |
| `output` | `BitmapFontOutput \| null` (read-only) | The most recent `generate()` result |
| `onGenerate` | `(output: BitmapFontOutput) => void \| null` | Optional callback fired alongside `tc-generate` |

Every attribute above also has a matching camelCase property (`fontFamily`, `fontSize`, `glyphs`, `text`, `letterSpacing`, `padding`, `glyphsPerRow`, `lineHeight`, `powerOfTwo`, `scale`, `background`, `exportFormat`, `autoGenerate`, `previewBackground`, `previewPadding`, `previewLineGap`, `previewScale`, `previewAlign`, `canvasWidth`, `canvasHeight`, `fitParent`, `disabled`).

**Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `generate()` | `Promise<BitmapFontOutput \| null>` | Rasterises the atlas, fires `tc-generate`/`onGenerate`, resolves the output (or `null` when disabled / already generating) |
| `copyDescriptor()` | `Promise<boolean>` | Copies the descriptor text to the clipboard (generating first if needed) |
| `download(baseName?)` | `Promise<boolean>` | Downloads the atlas PNG + descriptor file (generating first if needed) |
| `refresh()` | `void` | Repaints the preview canvas |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-generate` | `BitmapFontOutput` | Fired when a generation/export completes — `{ png: Blob; xml; text; format; glyphs; width; height }` |

**No slots, no controls** — the element owns exactly one canvas; build your own UI around it.

```html
<tc-bitmap-font-generator
    font-family="Arial"
    font-size="48"
    text="Toolcase"
    fill-type="gradient"
    gradient-colors="#38bdf8,#a855f7"
    gradient-angle="120"
    border-color="#0f172a" border-thickness="3" border-align="outer"
    shadow-color="#000" shadow-size="5"
    glow-color="#22d3ee" glow-size="4"
    preview-align="center"
    export-format="xml"
></tc-bitmap-font-generator>

<!-- fixed preview box, then auto-scaled to a sized parent -->
<tc-bitmap-font-generator canvas-width="100%" canvas-height="320"></tc-bitmap-font-generator>

<div style="height: 50vh">
    <tc-bitmap-font-generator fit-parent canvas-height="180"></tc-bitmap-font-generator>
</div>

<script>
  const gen = document.querySelector('tc-bitmap-font-generator')
  // Structured objects are still available as properties:
  gen.borders = [{ color: '#1e293b', thickness: 3 }, { color: '#ffffff', thickness: 6 }]
  // Your own buttons drive the element:
  document.querySelector('#generate').onclick = () => gen.generate()
  document.querySelector('#copy').onclick = () => gen.copyDescriptor()
  document.querySelector('#save').onclick = () => gen.download('my-font')
  gen.addEventListener('tc-generate', (e) => console.log(e.detail.format, e.detail.width, e.detail.height))
</script>
```

---