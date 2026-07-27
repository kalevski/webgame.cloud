---
component: tc-interact-prompt
---

### tc-interact-prompt

Contextual "press X to interact" prompt — a keycap paired with a mono uppercase machine-facing label, plus an optional hold-to-interact progress bar. Styled to the web-components design system: a flat `--tc-surface` chip with a 1px hairline border and an overlay-tier shadow (it floats over content), a keycap mirroring the `tc-kbd` motif, and a hold-progress fill that uses the ink accent. Visibility is driven by the `show` attribute — the element renders nothing (`display: none`) until `show` is present. The host carries `role="status"` + `aria-live="polite"`, and the hold bar carries `role="progressbar"`.

**Tag:** `tc-interact-prompt`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `show` | boolean | false | When present, the prompt is visible. When absent, the element is hidden (`display: none`) and removed from the accessibility tree |
| `key-label` | string | — | Label shown inside the keycap (e.g. `E`, `Space`). When absent, no keycap is rendered |
| `text` | string | — | The prompt text shown beside the keycap, rendered as a mono uppercase label |
| `hold-progress` | number | — | When set, renders a progress bar below the row. Clamped to `0`–`1`. When absent, no bar is rendered |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `show` | boolean | Reflects the `show` attribute |
| `keyLabel` | string | Reflects the `key-label` attribute |
| `text` | string | Reflects the `text` attribute |
| `holdProgress` | number \| null | Reflects the `hold-progress` attribute; `null` when absent. Setter clamps to `0`–`1` |

**Slots**

None. `tc-interact-prompt` is driven entirely by attributes/properties.

**Events**

None. `tc-interact-prompt` is a purely presentational prompt element.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-interact-prompt-bg` | `var(--tc-surface)` | Chip background |
| `--bs-interact-prompt-color` | `var(--tc-text)` | Base text color |
| `--bs-interact-prompt-border-color` | `var(--tc-border)` | Hairline border color |
| `--bs-interact-prompt-border-width` | `1px` | Border width |
| `--bs-interact-prompt-padding-y` | `0.5rem` | Vertical padding |
| `--bs-interact-prompt-padding-x` | `0.75rem` | Horizontal padding |
| `--bs-interact-prompt-gap` | `0.625rem` | Gap between the row and the hold bar |
| `--bs-interact-prompt-row-gap` | `0.625rem` | Gap between the keycap and the text |
| `--bs-interact-prompt-min-width` | `160px` | Minimum chip width |
| `--bs-interact-prompt-shadow` | `var(--tc-shadow-md)` | Overlay-tier drop shadow |
| `--bs-interact-prompt-text-font` | `var(--bs-font-monospace)` | Prompt-text font family |
| `--bs-interact-prompt-text-size` | `0.78125rem` | Prompt-text size (~12.5px) |
| `--bs-interact-prompt-text-weight` | `500` | Prompt-text weight |
| `--bs-interact-prompt-text-spacing` | `0.08em` | Prompt-text letter-spacing |
| `--bs-interact-prompt-text-color` | `var(--tc-text-muted)` | Prompt-text color |
| `--bs-interact-prompt-key-font` | `var(--bs-font-monospace)` | Keycap font family |
| `--bs-interact-prompt-key-size` | `0.71875rem` | Keycap font size (~11.5px) |
| `--bs-interact-prompt-key-weight` | `500` | Keycap font weight |
| `--bs-interact-prompt-key-color` | `var(--tc-text)` | Keycap text color |
| `--bs-interact-prompt-key-bg` | `var(--tc-surface-muted)` | Keycap fill |
| `--bs-interact-prompt-key-border-color` | `var(--tc-border-strong)` | Keycap border color |
| `--bs-interact-prompt-key-padding-x` | `0.4em` | Keycap horizontal padding |
| `--bs-interact-prompt-key-padding-y` | `0.2em` | Keycap vertical padding |
| `--bs-interact-prompt-key-min-width` | `1.5em` | Keycap minimum width |
| `--bs-interact-prompt-hold-height` | `3px` | Hold-bar height |
| `--bs-interact-prompt-hold-track-bg` | `var(--tc-surface-muted)` | Hold-bar track fill |
| `--bs-interact-prompt-hold-track-border-color` | `var(--tc-border)` | Hold-bar track border |
| `--bs-interact-prompt-hold-fill-bg` | ink gradient | Hold-bar fill (uses `--tc-app-accent`) |
| `--bs-interact-prompt-hold-transition` | `width 0.08s linear` | Fill width transition (dropped under reduced motion) |

```html
<!-- Basic prompt -->
<tc-interact-prompt show key-label="E" text="Interact"></tc-interact-prompt>
<tc-interact-prompt show key-label="Space" text="Jump"></tc-interact-prompt>

<!-- Without a keycap -->
<tc-interact-prompt show text="Talk to merchant"></tc-interact-prompt>

<!-- Hold to interact -->
<tc-interact-prompt show key-label="R" text="Hold to revive" hold-progress="0.65"></tc-interact-prompt>

<!-- Hidden until `show` is set -->
<tc-interact-prompt key-label="E" text="Interact"></tc-interact-prompt>
```

```js
// Drive the hold bar from JS
const prompt = document.querySelector('tc-interact-prompt')
prompt.show = true
prompt.keyLabel = 'E'
prompt.text = 'Hold to revive'
prompt.holdProgress = 0.4 // clamped to 0–1
```

---