---
component: tc-image
---

### tc-image

Image wrapper with a loading shimmer skeleton, aspect-ratio control, configurable `object-fit`, and an error fallback. On successful load the skeleton fades out and the image fades in. On error the skeleton hides and the fallback region appears (custom slotted content or the default broken-image icon). Changing `src` resets to the loading state. Sharp corners, slate neutrals only — no border-radius, no status color.

**Tag:** `tc-image`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `src` | string | — | URL of the image, forwarded to the inner `<img>`. Changing this attribute resets the component to the loading state. |
| `alt` | string | `''` | Alt text forwarded to the inner `<img>` for accessibility. |
| `aspect-ratio` | string | — | CSS `aspect-ratio` value (e.g. `16/9`, `4/3`, `1`) applied to the inner wrapper div. Determines the height when the width is constrained. When omitted the wrapper falls back to `--bs-image-min-height`. |
| `object-fit` | `'cover' \| 'contain' \| 'fill' \| 'none'` | `'cover'` | CSS `object-fit` value applied to the inner `<img>`. Controls how the image is scaled within the box. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string \| null` | `null` | Reflects the `src` attribute. |
| `alt` | `string \| null` | `null` | Reflects the `alt` attribute. |
| `aspectRatio` | `string \| null` | `null` | Reflects the `aspect-ratio` attribute. |
| `objectFit` | `'cover' \| 'contain' \| 'fill' \| 'none'` | `'cover'` | Reflects the `object-fit` attribute. |
| `onLoad` | `(() => void) \| null` | `null` | Callback invoked when the image loads successfully, alongside the `tc-load` event. |
| `onError` | `(() => void) \| null` | `null` | Callback invoked when the image fails to load, alongside the `tc-error` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-load` | `{}` | Dispatched when the inner `<img>` fires its native `load` event. |
| `tc-error` | `{}` | Dispatched when the inner `<img>` fires its native `error` event (broken URL, network failure, etc.). |

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | Custom fallback content shown when the image fails to load. Replaces the default broken-image icon. Placed inside `.tc-image-fallback`. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-image-bg` | `var(--tc-surface-muted)` | Background fill of the wrapper while loading or on error. |
| `--bs-image-shimmer-base` | `var(--tc-surface-muted)` | Base color of the loading shimmer. |
| `--bs-image-shimmer-shine` | `var(--tc-surface-hover)` | Leading highlight of the shimmer gradient. |
| `--bs-image-shimmer-shade` | `var(--tc-border)` | Trailing shadow of the shimmer gradient. |
| `--bs-image-shimmer-duration` | `1.5s` | Duration of one shimmer sweep cycle. |
| `--bs-image-fallback-color` | `var(--tc-text-faint)` | Color of the default broken-image icon. |
| `--bs-image-fallback-icon-size` | `2rem` | Size of the default broken-image icon. |
| `--bs-image-transition-duration` | `var(--tc-transition-base, 200ms)` | Duration of the opacity fade-in on successful load. |
| `--bs-image-min-height` | `80px` | Minimum wrapper height when no `aspect-ratio` is set. |

**Example**

```html
<!-- Successful image with aspect ratio -->
<tc-image
  src="https://example.com/photo.jpg"
  alt="A scenic mountain view"
  aspect-ratio="16/9"
  object-fit="cover"
></tc-image>

<!-- Broken src — custom slotted fallback -->
<tc-image src="https://example.invalid/missing.jpg" alt="Photo unavailable" aspect-ratio="16/9">
  <div style="text-align:center;padding:1rem;color:var(--tc-text-muted)">Photo unavailable</div>
</tc-image>

<script>
  const img = document.querySelector('tc-image')
  img.addEventListener('tc-load', () => console.log('loaded'))
  img.addEventListener('tc-error', () => console.log('error'))
  img.onLoad = () => console.log('loaded (callback)')
  img.onError = () => console.log('error (callback)')
</script>
```

---