---
component: tc-stepper
---

### tc-stepper

Multi-step progress indicator with completion icons and optional clickable navigation. Steps are set via the JS `steps` property; states are derived from the `active-step` attribute. Steps before the active one are `complete` (success fill + check icon), the active step is `active` (ink fill + number), and the rest are `pending` (hairline border + faint number). A connector line joins adjacent steps and inherits the colour of the preceding step's state. Clickable steps are real `<button>` elements; non-clickable steps are inert `<div>`s.

**Tag:** `tc-stepper`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active-step` | string | — | Key of the currently active step. Steps before it are `complete`, the matching step is `active`, steps after are `pending`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction. Horizontal arranges steps in a row; vertical stacks them. |
| `clickable` | boolean | `false` | When present, renders steps as `<button>` elements. Clicking dispatches `tc-step-click`. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `StepItem[]` | `[]` | Array of step descriptors. Setting triggers a re-render. |
| `onstepclick` | `((key: string) => void) \| null` | `null` | Optional callback invoked with the clicked step key (alongside the `tc-step-click` event). Only fires when `clickable`. |

**`StepItem` shape**

```ts
interface StepItem {
    key: string           // Unique identifier
    label: string         // Step title
    description?: string  // Optional subtitle shown below the label
    optional?: boolean    // Shows an "(optional)" hint when true
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-step-click` | `{ key: string }` | Fired (bubbles, composed) when a clickable step is activated. Only fires when the `clickable` attribute is set. |

**Slots**

None. All data is supplied via the `steps` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-stepper-marker-size` | `2rem` | Diameter of the circular step marker. |
| `--bs-stepper-marker-font-size` | `0.8125rem` | Font size of the step number inside the marker. |
| `--bs-stepper-marker-font-weight` | `600` | Font weight of the step number. |
| `--bs-stepper-connector-thickness` | `1px` | Thickness of connector lines between steps. |
| `--bs-stepper-connector-color` | `var(--tc-border)` | Colour of pending connectors. |
| `--bs-stepper-connector-complete-color` | `var(--tc-success)` | Connector colour after a complete step. |
| `--bs-stepper-connector-active-color` | `var(--tc-app-accent)` | Connector colour after the active step. |
| `--bs-stepper-pending-border` | `var(--tc-border)` | Marker ring colour for pending steps. |
| `--bs-stepper-pending-color` | `var(--tc-text-faint)` | Number colour for pending steps. |
| `--bs-stepper-active-bg` | `var(--tc-app-accent)` | Marker fill for the active step. |
| `--bs-stepper-active-color` | `#fff` | Number colour for the active step. |
| `--bs-stepper-complete-bg` | `var(--tc-success)` | Marker fill for complete steps. |
| `--bs-stepper-complete-color` | `#fff` | Icon colour for complete steps. |
| `--bs-stepper-check-icon-size` | `1rem` | Size of the lucide check icon in complete markers. |
| `--bs-stepper-label-font-size` | `0.875rem` | Font size of step labels. |
| `--bs-stepper-connector-min-cross` | `1.5rem` | Minimum height of connectors in vertical mode. |

```html
<tc-stepper id="onboard" active-step="profile"></tc-stepper>
<script>
  document.getElementById('onboard').steps = [
    { key: 'account', label: 'Account',  description: 'Create your account' },
    { key: 'profile', label: 'Profile',  description: 'Set up your profile', optional: true },
    { key: 'plan',    label: 'Plan',     description: 'Choose a plan' },
    { key: 'confirm', label: 'Confirm',  description: 'Review and confirm' },
  ]
</script>

<!-- Clickable variant -->
<tc-stepper id="wizard" active-step="plan" clickable></tc-stepper>
<script>
  const el = document.getElementById('wizard')
  el.steps = [
    { key: 'account', label: 'Account' },
    { key: 'plan',    label: 'Plan' },
    { key: 'confirm', label: 'Confirm' },
  ]
  el.addEventListener('tc-step-click', e => {
    el.setAttribute('active-step', e.detail.key)
  })
</script>

<!-- Vertical orientation -->
<tc-stepper id="vertical" active-step="plan" orientation="vertical"></tc-stepper>
<script>
  document.getElementById('vertical').steps = [
    { key: 'account', label: 'Account' },
    { key: 'plan',    label: 'Plan' },
    { key: 'confirm', label: 'Confirm' },
  ]
</script>
```

---