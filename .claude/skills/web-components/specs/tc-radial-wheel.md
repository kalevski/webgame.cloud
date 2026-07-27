---
component: tc-radial-wheel
---

### tc-radial-wheel

**Tag:** `tc-radial-wheel`

**Description:** Modal radial (pie) item / ability selector. A fixed-position overlay displaying a circular disc with options arranged radially. Hovering an option shows its label in the center of the disc. Clicking the backdrop or pressing Escape closes the wheel. Styled to the toolcase design system.

---

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `open` | boolean | `false` | Present → wheel is visible. Absent → wheel is hidden. |
| `radius` | number | `120` | Distance in px from the disc center to each option button center. |
| `option-size` | number | `56` | Diameter in px of each circular option button. |
| `center-label` | string | `''` | Text shown in the disc center when no option is hovered. |

---

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `options` | `RadialOption[]` | `[]` | Array of option objects. Setting this re-renders the wheel. |
| `onSelect` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside `tc-select`. |
| `onClose` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-close`. |

**`RadialOption` shape:**

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | yes | Unique identifier for the option. |
| `icon` | `string` | no | Icon character/emoji displayed in the button. Defaults to `●`. |
| `label` | `string` | no | Human-readable label shown in the disc center on hover. |
| `color` | `string` | no | CSS color applied as `--bs-radial-wheel-option-color` on the button. |
| `disabled` | `boolean` | no | Prevents selection and dims the button. |

---

#### Events

| Event | Detail | Description |
|---|---|---|
| `tc-select` | `{ id: string }` | Fired when a non-disabled option is clicked. The wheel does **not** auto-close on select. |
| `tc-close` | `{}` | Fired when the backdrop is clicked or Escape is pressed. The wheel self-closes (removes `[open]`). |

---

#### Custom properties

| Property | Default | Description |
|---|---|---|
| `--bs-radial-wheel-backdrop-bg` | `#0f172a` | Backdrop scrim color. |
| `--bs-radial-wheel-backdrop-opacity` | `0.55` | Backdrop scrim opacity. |
| `--bs-radial-wheel-z-backdrop` | `var(--tc-z-modal-backdrop)` | Z-index of the backdrop layer. |
| `--bs-radial-wheel-z-disc` | `var(--tc-z-modal)` | Z-index of the disc + options layer. |
| `--bs-radial-wheel-disc-bg` | `var(--tc-surface)` | Circular disc background. |
| `--bs-radial-wheel-disc-border` | `var(--tc-border-strong)` | Disc hairline border color. |
| `--bs-radial-wheel-disc-shadow` | `var(--tc-shadow-lg)` | Disc drop shadow. |
| `--bs-radial-wheel-option-bg` | `var(--tc-surface)` | Option button background at rest. |
| `--bs-radial-wheel-option-border` | `var(--tc-border-strong)` | Option button border. |
| `--bs-radial-wheel-option-color` | `var(--tc-text)` | Option icon/text color at rest (overridden per-option via `options[].color`). |
| `--bs-radial-wheel-option-hover-bg` | `var(--tc-surface-muted)` | Option background on hover. |
| `--bs-radial-wheel-option-hover-color` | `var(--tc-app-accent)` | Option icon color on hover. |
| `--bs-radial-wheel-option-shadow` | `var(--tc-shadow-sm)` | Option button shadow at rest. |
| `--bs-radial-wheel-option-hover-shadow` | `var(--tc-shadow-md)` | Option button shadow on hover. |
| `--bs-radial-wheel-center-color` | `var(--tc-text-muted)` | Center label text color. |
| `--bs-radial-wheel-center-size` | `0.75rem` | Center label font size. |

---

#### Slots

None. All content is driven by the `options` JS property.

---

#### Example

```html
<tc-radial-wheel id="wheel" radius="120" option-size="56" center-label="Choose"></tc-radial-wheel>

<script>
  const wheel = document.getElementById('wheel')
  wheel.options = [
    { id: 'fire',  icon: '🔥', label: 'Fire',  color: '#ef4444' },
    { id: 'ice',   icon: '❄',  label: 'Ice',   color: '#0ea5e9' },
    { id: 'storm', icon: '⚡', label: 'Storm', color: '#a855f7' },
    { id: 'earth', icon: '🪨', label: 'Earth', color: '#22c55e' },
    { id: 'lock',  icon: '🔒', label: 'Locked', disabled: true },
  ]

  wheel.addEventListener('tc-select', e => {
    console.log('Selected:', e.detail.id)
    // Optionally close after selection:
    wheel.removeAttribute('open')
  })

  wheel.addEventListener('tc-close', () => {
    console.log('Wheel closed')
  })

  // Open the wheel:
  document.querySelector('#open-btn').addEventListener('click', () => {
    wheel.setAttribute('open', '')
  })
</script>
```

---