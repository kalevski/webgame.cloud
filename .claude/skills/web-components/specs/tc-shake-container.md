---
component: tc-shake-container
---

### tc-shake-container

rAF-driven camera-shake wrapper that translates its slotted content with a decaying random offset. Styled to the web-components design system — no Shadow DOM; a flat block wrapper whose inner `.tc-shake-container-inner` div JS translates on demand. Re-shakes whenever the `trigger` attribute changes to a new value; intensity decays linearly from `intensity` px to 0 over `duration` ms. Respects `prefers-reduced-motion`. All cosmetics flow through `--bs-shake-container-*` custom properties.

**Tag:** `tc-shake-container`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `trigger` | string \| null | absent | Change this to any new non-null value to start a shake. Setting the same value twice is a no-op. |
| `intensity` | number | `8` | Peak shake offset in pixels. Amplitude decays linearly over `duration` ms. |
| `duration` | number | `350` | Shake duration in milliseconds. |

**JS Properties**

| Property | Type | Maps to |
|----------|------|---------|
| `trigger` | `string \| null` | `trigger` attribute |
| `intensity` | `number` | `intensity` attribute |
| `duration` | `number` | `duration` attribute |

**Methods**

| Method | Description |
|--------|-------------|
| `shake()` | Imperatively trigger a shake without changing the `trigger` attribute. |

**Events**

None. `tc-shake-container` is a passive wrapper — it shakes on demand but fires no events.

**Slots**

| Slot | Description |
|------|-------------|
| *(default)* | The content to shake. Moved into the inner `.tc-shake-container-inner` element and preserved across attribute changes. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-shake-container-bg` | `transparent` | Host background. |
| `--bs-shake-container-border-color` | `transparent` | Host border color. |
| `--bs-shake-container-border-width` | `0px` | Host border width. |
| `--bs-shake-container-border-radius` | `0` | Host border radius (always `0` per design system rules). |

#### Example

```html
<button id="shake-btn">Shake</button>
<tc-shake-container id="shaker" intensity="8" duration="350">
  <div style="padding: 1rem; border: 1px solid var(--tc-border); background: var(--tc-surface);">
    Shaking content
  </div>
</tc-shake-container>

<script>
  const shaker = document.querySelector('#shaker')
  let _seq = 0

  // Attribute-driven: set trigger to a new value each time
  document.querySelector('#shake-btn').addEventListener('click', () => {
    shaker.trigger = String(++_seq)
  })

  // Or use the imperative API
  shaker.shake()
</script>
```

---