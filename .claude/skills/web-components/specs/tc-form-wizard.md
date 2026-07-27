---
component: tc-form-wizard
---

### tc-form-wizard

Multi-step form wizard with a tab-strip header, scrollable content body, and Back / Next / Complete footer. Steps are set via the JS `steps` property. Step content is supplied as a string, an `HTMLElement`, a factory function, or via light-DOM children with `slot="step-<index>"` / `data-step="<index>"` attributes. Navigating to already-visited steps is allowed by clicking their header tab. Pressing Complete on the last step dispatches `tc-complete`.

**Tag:** `tc-form-wizard`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `complete-label` | string | `"Complete"` | Label text shown on the final-step action button. |
| `complete-icon` | string | — | Lucide icon name (kebab-case, e.g. `"rocket"`) shown on the Complete button. |
| `loading` | boolean | `false` | When present, disables both footer buttons and shows a spinner on the action button. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `FormWizardStep[]` | `[]` | Array of step descriptors. Setting triggers a re-render. |
| `onComplete` | `(() => void) \| null` | `null` | Optional callback invoked alongside the `tc-complete` event. |
| `onStepChange` | `((detail: { index: number }) => void) \| null` | `null` | Optional callback invoked alongside `tc-step-change`. |

**`FormWizardStep` shape**

```ts
interface FormWizardStep {
    id?: string                                    // Optional identifier (unused by the element itself)
    label: string                                  // Tab label shown in the header
    icon?: string                                  // Lucide icon name (kebab-case) shown in the step marker
    content?: HTMLElement | string | (() => HTMLElement)  // Step body content (alternative to slotting)
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-complete` | `{}` | Fired (bubbles, composed) when the Complete button is pressed on the last step. |
| `tc-step-change` | `{ index: number }` | Fired (bubbles, composed) whenever the active step index changes. |

**Slots**

Step content can be supplied as light-DOM children instead of (or in addition to) the `content` JS property. A child element is distributed to step N when it carries `slot="step-N"` or `data-step="N"`.

| Slot | Description |
|------|-------------|
| `step-0`, `step-1`, … | Content for the corresponding step index. |
| `data-step="0"`, `data-step="1"`, … | Alternative `data-*` form for the same slots. |

When both `step.content` and a matching slot child are present, the JS property takes precedence.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-form-wizard-marker-size` | `2rem` | Diameter of the circular step marker. |
| `--bs-form-wizard-marker-font-size` | `0.8125rem` | Font size of the step number inside the marker. |
| `--bs-form-wizard-done-bg` | `var(--tc-app-accent)` | Marker fill for completed steps. |
| `--bs-form-wizard-done-color` | `#fff` | Icon colour inside completed-step markers. |
| `--bs-form-wizard-current-bg` | `var(--tc-app-accent)` | Marker fill for the current step. |
| `--bs-form-wizard-current-color` | `#fff` | Number/icon colour inside the current-step marker. |
| `--bs-form-wizard-current-underline` | `var(--tc-app-accent)` | Colour of the 2 px underline below the current tab. |
| `--bs-form-wizard-upcoming-border` | `var(--tc-border-strong)` | Ring colour for upcoming (unvisited) step markers. |
| `--bs-form-wizard-upcoming-color` | `var(--tc-text-faint)` | Number colour for upcoming steps. |
| `--bs-form-wizard-connector-color` | `var(--tc-border)` | Hairline connector colour between tabs. |
| `--bs-form-wizard-connector-done-color` | `var(--tc-app-accent)` | Connector colour after a completed step. |
| `--bs-form-wizard-label-font-size` | `0.8125rem` | Font size of step labels below the markers. |
| `--bs-form-wizard-body-padding` | `1.5rem` | Padding inside the content body. |
| `--bs-form-wizard-body-min-height` | `8rem` | Minimum height of the content body. |
| `--bs-form-wizard-footer-padding` | `0.875rem 1.5rem` | Padding inside the footer row. |

```html
<tc-form-wizard id="wiz"></tc-form-wizard>
<script>
  const wiz = document.getElementById('wiz')
  wiz.steps = [
    { label: 'Account',  icon: 'user',        content: '<p>Create your account.</p>' },
    { label: 'Profile',  icon: 'settings',    content: '<p>Set up your profile.</p>' },
    { label: 'Plan',     icon: 'credit-card', content: '<p>Choose a plan.</p>' },
    { label: 'Confirm',  icon: 'check',       content: '<p>Review and confirm.</p>' },
  ]
  wiz.addEventListener('tc-step-change', e => console.log('step', e.detail.index))
  wiz.addEventListener('tc-complete',    () => console.log('done!'))
</script>

<!-- Custom complete label and icon -->
<tc-form-wizard id="deploy" complete-label="Launch" complete-icon="rocket"></tc-form-wizard>
<script>
  document.getElementById('deploy').steps = [
    { label: 'Setup',  content: '<p>Configure initial settings.</p>' },
    { label: 'Deploy', content: '<p>Deploy to production.</p>' },
    { label: 'Done',   content: '<p>Your app is live!</p>' },
  ]
</script>

<!-- Slotted step content -->
<tc-form-wizard id="slotted">
  <div slot="step-0"><p>Details form here.</p></div>
  <div slot="step-1"><p>Address form here.</p></div>
  <div slot="step-2"><p>Review before confirming.</p></div>
</tc-form-wizard>
<script>
  document.getElementById('slotted').steps = [
    { label: 'Details' },
    { label: 'Address' },
    { label: 'Review' },
  ]
</script>
```