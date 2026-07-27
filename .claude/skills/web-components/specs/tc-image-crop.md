---
component: tc-image-crop
---

### tc-image-crop

Canvas-based image cropper with drag-to-pan, scroll-to-zoom (around the cursor), a zoom slider, an optional fixed aspect ratio, and an optional circular mask. The image is drawn on an interactive stage; a translucent ink scrim dims everything outside the crop window (a 1px outlined rectangle, or a perfect circle when `circular`). Applying renders the cropped region to an output canvas (respecting device pixel ratio, with a circular clip when `circular`), exports it as a PNG `Blob`, and dispatches `tc-crop`. The apply button is the ink-gradient primary; reset is an outline/ghost button. No slots — all configuration is via attributes plus the `onCrop`/`onError` JS properties.

**Tag:** `tc-image-crop`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | — | **Required.** Source image URL or data URI. Loaded into an offscreen `Image` with `crossOrigin="anonymous"`. Changing it reloads and resets the crop transform. |
| `aspect-ratio` | number | `1` | Crop frame width:height ratio (e.g. `1.7777` for 16:9). Values ≤ 0 fall back to `1`. |
| `circular` | boolean | `false` | Mask the crop window — and the exported output — as a circle. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string` | Get/set the source image (reflects to the `src` attribute). |
| `aspectRatio` | `number` | Get/set the crop frame ratio (reflects to `aspect-ratio`). |
| `circular` | `boolean` | Get/set the circular mask (reflects to `circular`). |
| `onCrop` | `((blob: Blob) => void) \| null` | Optional callback fired when the crop is committed. Mirrors the `tc-crop` event. |
| `onError` | `((error: Error) => void) \| null` | Optional callback fired when the image fails to load or the canvas cannot export. Mirrors the `tc-error` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-crop` | `{ blob: Blob }` | Fired when the user applies the crop; `blob` is the cropped PNG. |
| `tc-error` | `{ error: Error }` | Fired when the source image fails to load or the export canvas is tainted/unavailable. |

**Keyboard:** the zoom slider and buttons are standard focusable form controls. The canvas is focusable (`tabindex="0"`); arrow keys pan, `+`/`-` zoom.

**No slots.**

```html
<tc-image-crop src="https://picsum.photos/seed/toolcase/800/600" aspect-ratio="1" circular></tc-image-crop>
<script>
  const el = document.querySelector('tc-image-crop')
  el.addEventListener('tc-crop', e => {
    const url = URL.createObjectURL(e.detail.blob)
    document.querySelector('#preview').src = url
  })
  el.addEventListener('tc-error', e => console.error(e.detail.error))
</script>
```

---