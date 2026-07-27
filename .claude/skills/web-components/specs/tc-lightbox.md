---
component: tc-lightbox
---

### tc-lightbox

Modal image gallery with keyboard/swipe navigation, a thumbnail strip, captions, and focus management. Controlled component — fires `tc-close` when the user requests dismissal; the consumer sets `open` to `false` to actually close. Renders nothing when closed.

**Tag:** `tc-lightbox`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | false | Visible state — add/remove to show/hide the overlay |
| `initial-index` | number | `0` | Zero-based slide shown when first opened |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `images` | `LightboxImage[]` | Gallery data — must be set as a property (`el.images = [...]`), not an attribute. Setting it re-renders while open. |
| `onclose` | `(() => void) \| null` | Callback fired when close is requested (alongside the `tc-close` event) |

`LightboxImage` shape: `{ src: string; alt?: string; caption?: string; thumb?: string }` — `thumb` is the optional thumbnail-strip source (falls back to `src`).

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-close` | `{}` | Fired when the user dismisses via the close button, Escape, or a backdrop click. The host does **not** self-close — set `open=false` in this handler. |
| `tc-change` | `{ index: number }` | Fired whenever the active slide changes (arrows, thumbnails, keyboard, or swipe) |

**Keyboard:** `ArrowLeft`/`ArrowRight` navigate (wrap-around), `Home`/`End` jump to first/last, `Escape` closes, `Tab` cycles within the dialog (focus trapped).

**Slots:** none

```html
<button onclick="openLightbox()">Open gallery</button>
<tc-lightbox id="gallery" initial-index="0"></tc-lightbox>
<script>
    const lb = document.querySelector('#gallery')
    lb.images = [
        { src: '/a.jpg', alt: 'Mountains', caption: 'Sunrise', thumb: '/a-thumb.jpg' },
        { src: '/b.jpg', alt: 'Forest', caption: 'Autumn' },
    ]
    function openLightbox() { lb.setAttribute('open', '') }
    lb.addEventListener('tc-close', () => lb.removeAttribute('open'))
    lb.addEventListener('tc-change', (e) => console.log('slide', e.detail.index))
</script>
```

---