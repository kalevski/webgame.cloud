---
component: tc-toggle
---

### tc-toggle

Atomic standalone on/off switch — a pill-track with a sliding circular knob. The host element IS the switch: it carries `role="switch"`, `aria-checked`, and handles click + Space/Enter. Styled to the toolcase design system (slate neutrals, sharp outer corners, sanctioned pill/circle geometry, ink gradient on checked). Use `tc-toggle-card` when you need a card wrapper around the switch.

**Tag:** `tc-toggle`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `on` | boolean | false | The on/off state. Reflected — toggling the switch sets/removes the attribute. |
| `disabled` | boolean | false | Disables interaction (`opacity` + `pointer-events: none`). Removes the element from the tab order. |
| `label` | string | — | Sets `aria-label` on the host for screen-reader identification. Required when there is no visible text label alongside the switch. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `on` | boolean | Get/set the on/off state. Reflected to the `on` attribute. |
| `disabled` | boolean | Reflected boolean. |
| `label` | `string \| null` | Reflected. |
| `onChange` | `((on: boolean) => void) \| null` | Optional callback fired alongside the `tc-change` event on every toggle. Default `null`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ on: boolean }` | Fired (bubbles, composed) whenever the user toggles the switch (click or Space/Enter). `detail.on` is the new state. Not fired while `disabled`. |

**Slots**

None. Content is driven entirely by attributes.

**Accessibility**

- Host carries `role="switch"` with `aria-checked`, is focusable (`tabindex="0"`), and toggles on click or Space/Enter.
- Disabled removes the host from the tab order (`tabindex="-1"`) and sets `aria-disabled="true"`.
- Focus is always visible (2px ink outline); `prefers-reduced-motion` is honoured — the knob slide is frozen, colour transitions kept.
- 44px coarse-pointer touch target via `min-width`/`min-height` on the host under `@media (pointer: coarse)`.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-toggle-track-width` | `40px` | Track width |
| `--bs-toggle-track-height` | `22px` | Track height |
| `--bs-toggle-track-bg` | `var(--tc-border-strong)` | Track colour when off |
| `--bs-toggle-track-hover-bg` | `var(--tc-text-faint)` | Track colour on hover (off state) |
| `--bs-toggle-track-checked-bg` | `var(--tc-app-accent)` | Track base colour when on |
| `--bs-toggle-track-checked-gradient` | `linear-gradient(135deg, …)` | Ink gradient applied over the checked track |
| `--bs-toggle-knob-size` | `18px` | Knob diameter |
| `--bs-toggle-knob-bg` | `#ffffff` | Knob fill |
| `--bs-toggle-disabled-opacity` | `0.55` | Opacity of the disabled state |

**Examples**

```html
<!-- Off (default) -->
<tc-toggle label="Notifications"></tc-toggle>

<!-- On -->
<tc-toggle on label="Dark mode"></tc-toggle>

<!-- Disabled -->
<tc-toggle disabled label="Managed by admin"></tc-toggle>
<tc-toggle on disabled label="Always on"></tc-toggle>

<!-- Listening for changes -->
<tc-toggle id="t1" label="Auto-save"></tc-toggle>
<script>
  document.getElementById('t1').addEventListener('tc-change', e => {
    console.log('auto-save:', e.detail.on)
  })
</script>

<!-- Using the onChange callback -->
<tc-toggle id="t2" label="Notifications"></tc-toggle>
<script>
  document.getElementById('t2').onChange = on => console.log('notifications:', on)
</script>
```

---