---
component: tc-blur-overlay
---

### tc-blur-overlay

Full-surface backdrop-blur scrim for pause screens and dialog backdrops. Styled to the web-components design system — a slate-ink scrim on the fixed overlay tier (`--tc-z-modal-backdrop`), with sharp edges and no fantasy chrome. The host pins to the viewport, blurs whatever sits behind it, and centres its slotted content. Purely structural and passive (no shadow root): the consumer mounts/unmounts it to show/hide; it fires no events. The two cosmetic knobs accept free-form CSS values and are written through to `--bs-blur-overlay-*` custom properties.

**Tag:** `tc-blur-overlay`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `blur-amount` | CSS length | `8px` | Backdrop-filter blur radius (any CSS length, e.g. `14px`, `0.5rem`) |
| `background` | CSS color | `rgba(15, 23, 42, 0.45)` | Scrim fill over the blur (any CSS color value) |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `blurAmount` | string | Reflects the `blur-amount` attribute (default `8px`) |
| `background` | string | Reflects the `background` attribute (default `rgba(15, 23, 42, 0.45)`) |

**Events**

None. `tc-blur-overlay` is a passive scrim — the consumer mounts/unmounts it and wires its own dismissal (e.g. a `click` listener on the host for backdrop dismissal).

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-blur-overlay-blur` | `8px` | Blur radius (overridden inline by the `blur-amount` attribute). |
| `--bs-blur-overlay-bg` | `rgba(15, 23, 42, 0.45)` | Scrim fill (overridden inline by the `background` attribute). |
| `--bs-blur-overlay-z` | `var(--tc-z-modal-backdrop)` | Stacking tier on the fixed z-index scale. |
| `--bs-blur-overlay-gap` | `1rem` | Gap between centred slotted children. |
| `--bs-blur-overlay-padding` | `1.5rem` | Inset padding around the centred content. |
| `--bs-blur-overlay-fade` | `var(--tc-transition-base)` | Fade-in timing (frozen under `prefers-reduced-motion`). |

**Slots:** default (content centred over the scrim — e.g. a pause menu or dialog panel)

```html
<button onclick="document.body.appendChild(scrim())">Pause</button>
<script>
    function scrim() {
        const o = document.createElement('tc-blur-overlay')
        o.setAttribute('blur-amount', '14px')
        o.innerHTML = '<div class="card p-4">Paused <button>Resume</button></div>'
        // Backdrop click dismisses; the inner panel stops propagation.
        o.addEventListener('click', () => o.remove())
        o.querySelector('div').addEventListener('click', e => e.stopPropagation())
        return o
    }
</script>
```

---