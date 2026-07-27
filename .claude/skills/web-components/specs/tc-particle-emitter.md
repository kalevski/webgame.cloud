---
component: tc-particle-emitter
---

### tc-particle-emitter

Canvas-based DOM particle-burst emitter. Each time the `burst` attribute changes to a new value (or the imperative `burst()` method is called), a wave of square particles radiates from the centre of the canvas and fades out under configurable physics. Fires a `tc-burst` CustomEvent on every burst.

**Tag:** `tc-particle-emitter`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `burst` | `string` | — | Toggle attribute — set to any new value to trigger a burst. Duplicate values are ignored. |
| `count` | `number` | `24` | Number of particles per burst. |
| `particle-size` | `number` | `4` | Base particle side length in pixels (randomised ±30 % per particle). |
| `speed` | `number` | `200` | Base particle launch speed in pixels per second (randomised ±30 % per particle). |
| `lifetime` | `number` | `700` | Base particle lifetime in milliseconds (randomised ±20 % per particle). |
| `gravity` | `number` | `600` | Downward acceleration in pixels per second². |
| `width` | `number` | `240` | Canvas width in pixels. Changing this attribute recreates the canvas. |
| `height` | `number` | `160` | Canvas height in pixels. Changing this attribute recreates the canvas. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `colors` | `string[]` | `['#0f172a','#475569','#22d3ee','#cbd5e1']` | Array of CSS colour strings used randomly per particle. Set to override the slate/cyan palette defaults. |
| `count` | `number` | `24` | Mirrors the `count` attribute. |
| `particleSize` | `number` | `4` | Mirrors the `particle-size` attribute. |
| `speed` | `number` | `200` | Mirrors the `speed` attribute. |
| `lifetime` | `number` | `700` | Mirrors the `lifetime` attribute. |
| `gravity` | `number` | `600` | Mirrors the `gravity` attribute. |
| `width` | `number` | `240` | Mirrors the `width` attribute. |
| `height` | `number` | `160` | Mirrors the `height` attribute. |
| `onBurst` | `((count: number) => void) \| null` | `null` | Optional callback fired alongside `tc-burst`. |

#### Methods

| Method | Description |
|---|---|
| `burst(value?: string)` | Imperatively trigger a burst. Internally sets the `burst` attribute to `value` (defaults to `Date.now()`). |

#### Events

| Event | Detail | Description |
|---|---|---|
| `tc-burst` | `{ count: number }` | Fired when a burst begins. `count` is the number of particles spawned. Bubbles. |

#### Slots

None. `tc-particle-emitter` is canvas-based; all visual output is drawn programmatically.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-particle-emitter-bg` | `transparent` | Canvas background fill. |
| `--bs-particle-emitter-border-color` | `var(--tc-border)` | 1px hairline border colour around the canvas. |
| `--bs-particle-emitter-border-width` | `1px` | Border width. Set to `0` to remove the border. |
| `--bs-particle-emitter-color-1` | `#0f172a` | Documentation anchor for the first default particle colour (slate-900). |
| `--bs-particle-emitter-color-2` | `#475569` | Documentation anchor for the second default particle colour (slate-600). |
| `--bs-particle-emitter-color-3` | `#22d3ee` | Documentation anchor for the third default particle colour (cyan accent). |
| `--bs-particle-emitter-color-4` | `#cbd5e1` | Documentation anchor for the fourth default particle colour (slate-300). |

> **Note:** Particle colours are drawn onto a `<canvas>` via the 2D API and cannot read CSS custom properties at draw time. Use the `colors` JS property to set colours programmatically.

> **Reduced motion:** When `prefers-reduced-motion: reduce` is active the RAF animation loop is skipped; the `tc-burst` event still fires but no visual animation plays.

#### Usage

```html
<!-- Basic usage — burst on button click -->
<tc-particle-emitter id="pe" width="300" height="200"></tc-particle-emitter>
<button onclick="document.getElementById('pe').burst()">Fire</button>

<!-- Attribute-driven burst -->
<tc-particle-emitter burst="1" width="300" height="200"></tc-particle-emitter>

<!-- Heavy gravity + large particles -->
<tc-particle-emitter width="300" height="220" gravity="1200" lifetime="500" particle-size="6"></tc-particle-emitter>
```

```js
// Custom palette
const pe = document.querySelector('tc-particle-emitter')
pe.colors = ['#22d3ee', '#06b6d4', '#0e7490', '#cffafe']
pe.burst()

// Listen for the burst event
pe.addEventListener('tc-burst', e => {
    console.log(`Burst: ${e.detail.count} particles`)
})
```

---