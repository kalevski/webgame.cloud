---
component: tc-normal-map-generator
---

### tc-normal-map-generator

Interactive height→normal map generator. Loads a source image, computes a tangent-space normal map from a luminance emboss + alpha bevel heightmap (Sobel gradient, all in JS), and renders the result on a layered canvas stage. A slate toolbar carries the editing tools (brush / erase / mask / pan icon-buttons) and a segmented preview-mode control (Normal / Albedo / Lit / Surface); three sliders drive strength, emboss height, and bevel width. When `editable`, pointer-drag paints onto the working buffer with the active tool (brush raises, erase removes, mask selects); the `pan` tool drags the view. Lit modes shade the sprite with a cursor-tracked light. The normal map is recomputed — and a `tc-generate` event fired — whenever the source or any parameter changes (and after each brush/erase stroke). Sharp corners, slate neutrals, checkerboard stage, mono numeric read-outs.

**Tag:** `tc-normal-map-generator`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string (URL) | — | Source image URL (string case of the `source` property) |
| `strength` | number | `1` | Scales the normal-gradient intensity; recomputes on change |
| `emboss-height` | number | `2` | Luminance-emboss height contribution; recomputes on change |
| `bevel-width` | number | `0` | Alpha-bevel reach in px (also softens the surface); recomputes on change |
| `editable` | boolean | `false` | Enables brush / erase / mask painting on the working buffer |
| `tool` | `brush\|erase\|mask\|pan` | `brush` | Active editing tool |
| `preview-mode` | `normal\|albedo\|lit\|lit-surface` | `normal` | What the preview canvas renders |
| `disabled` | boolean | `false` | Disables all interaction (opacity + `pointer-events: none`) |

**Properties**

| Property | Type | Description |
|----------|------|-------------|
| `source` | `string \| File \| Blob \| null` | Source image. URL strings reflect to the `source` attribute; `File`/`Blob` are loaded via `URL.createObjectURL`. Setting it draws to the source canvas and recomputes |
| `onGenerate` | `(output: NormalMapOutput) => void \| null` | Optional callback fired alongside `tc-generate` |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-generate` | `NormalMapOutput` | Fired whenever the normal map is (re)computed — `{ dataUrl: string; width: number; height: number }` (PNG data URL at source resolution) |

**No slots** — the element owns its canvas, toolbar, and controls.

```html
<tc-normal-map-generator editable tool="brush" preview-mode="normal" strength="1.5" emboss-height="2" bevel-width="4"></tc-normal-map-generator>

<script>
  const gen = document.querySelector('tc-normal-map-generator')
  gen.source = 'sprite.png' // or a File / Blob
  gen.addEventListener('tc-generate', (e) => {
    console.log(e.detail.width, e.detail.height)
    document.querySelector('#out').src = e.detail.dataUrl
  })
</script>
```

---