---
component: tc-bitmap-font-generator
---

### tc-bitmap-font-generator

Canvas-based bitmap-font atlas generator. Owns its own control panel (font/fill/effects/layout/content groups), a live preview `<canvas>`, a generate button, and a multi-format export descriptor block with copy/download. Lays glyphs out in a grid of `glyphs-per-row` columns with padding/letter-spacing/line-height, applies a solid or gradient fill, one or more stroke borders, a drop shadow, and a glow, and (optionally) snaps the atlas to the next power of two. Simple scalars are reflected attributes; the complex effect objects are JS properties. Sharp corners, slate neutrals, mono numeric inputs + descriptor block.

**Tag:** `tc-bitmap-font-generator`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `font-family` | string | `Arial` | Font used to rasterise the glyphs |
| `font-size` | number | `32` | Glyph size in px |
| `glyphs` | string | full ASCII set | Characters to render into the atlas (duplicates removed) |
| `text` | string | `Hello World!` | Live-preview text drawn with the current effects |
| `letter-spacing` | number | `0` | Extra px added to each glyph cell width |
| `padding` | number | `2` | Px padding baked around each glyph cell |
| `glyphs-per-row` | number | `16` | Glyphs packed per atlas row |
| `line-height` | number | `0` | Reported BMFont lineHeight; `0` = auto (cell height) |
| `power-of-two` | boolean | `false` | Round atlas dimensions up to the next power of two |
| `scale` | number | `1` | Multiplies all geometry for a hi-res export atlas |
| `background` | string | — (transparent) | Atlas/preview background colour; absent = transparent |
| `export-format` | `xml\|json\|fnt` | `xml` | Descriptor format returned in `output.text` |
| `disabled` | boolean | `false` | Controls become non-interactive (opacity + `pointer-events: none`) |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `fill` | `BitmapFontFill` | `{ type: 'solid'\|'gradient'; color?; gradientColors?; gradientAngle?; gradientType?: 'linear'\|'radial' }`. Defaults to a white solid fill |
| `border` | `BitmapFontBorder \| null` | Single stroke `{ color; thickness; align?: 'inner'\|'outer'\|'center' }`. Ignored when `borders` is non-empty |
| `borders` | `BitmapFontBorder[]` | Stacked outlines, drawn thickest-first (concentric). Overrides `border` |
| `dropShadow` | `BitmapFontDropShadow \| null` | `{ color; size; offsetX?; offsetY?; blur? }`. Offsets/blur default off `size` |
| `glow` | `BitmapFontGlow \| null` | Symmetric outer glow `{ color; size }` |
| `onGenerate` | `(output: BitmapFontOutput) => void \| null` | Optional callback fired alongside `tc-generate` |

**Methods**

| Method | Returns | Description |
|--------|---------|-------------|
| `generate()` | `Promise<BitmapFontOutput \| null>` | Rasterises the atlas, fires `tc-generate`/`onGenerate`, resolves the output (or `null` when disabled / already generating) |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-generate` | `BitmapFontOutput` | Fired when a generation/export completes — `{ png: Blob; xml; text; format; glyphs; width; height }` |

**No slots** — the element owns its canvas and controls.

```html
<tc-bitmap-font-generator font-family="Arial" font-size="48" text="Toolcase" export-format="xml"></tc-bitmap-font-generator>

<script>
  const gen = document.querySelector('tc-bitmap-font-generator')
  gen.fill = { type: 'gradient', gradientColors: ['#ff6b6b', '#ffd93d'], gradientAngle: 90 }
  gen.border = { color: '#1e293b', thickness: 3, align: 'center' }
  gen.glow = { color: '#22d3ee', size: 6 }
  gen.addEventListener('tc-generate', (e) => console.log(e.detail.format, e.detail.width, e.detail.height))
</script>
```

---