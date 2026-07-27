---
component: tc-pause-menu
---

### tc-pause-menu

In-game pause overlay with a full-screen backdrop, an optional eyebrow + title header, a keyboard-navigable menu-item list, and a primary Resume button. Styled to the toolcase design system: slate neutrals, sharp corners, 1px hairline, overlay-tier shadow. Controlled component — fires `tc-close` / `tc-resume` / `tc-select`; the consumer sets `open` to `false` to actually dismiss. Focus trap, scroll lock, and keyboard (`Escape`, `ArrowDown`/`Up`, `Enter`/`Space`) handling included. Items are set via the JS `items` property. No shadow root; light DOM; `display: block`.

**Tag:** `tc-pause-menu`

**Preset alias:** `tc-pause-screen` is a full-screen preset of `tc-pause-menu` that drops the footer, seeds a default resume/restart/quit item set, reads `screen-title` instead of `menu-title`, and re-dispatches `tc-resume` / `tc-restart` / `tc-quit` for those item ids. Everything below applies identically.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `open` | boolean | `false` | Shows the overlay when present; removing it hides it. |
| `menu-title` | string | `"Game Paused"` | Heading shown inside the panel (the `tc-pause-screen` preset reads `screen-title`, default `"Paused"`). |
| `default-items` | boolean | `false` | When present, seeds the resume/restart/quit default item set if no `items` are supplied (always on for `tc-pause-screen`). |
| `resume-footer` | boolean | `false` | Forces the footer Resume button on (default on for `tc-pause-menu`, off for `tc-pause-screen`). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `open` | `boolean` | `false` | Reflects the `open` attribute. |
| `menuTitle` | `string` | `""` | Reflects the `menu-title` attribute. |
| `screenTitle` | `string` | `""` | Reflects the `screen-title` attribute (used by the `tc-pause-screen` preset). |
| `items` | `PauseMenuItem[]` | `[]` | Array of menu items (resolves to the default set when seeding is enabled and none are supplied). Setting this after connect surgically updates the items list without re-rendering the panel. |
| `onResume` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-resume`. |
| `onRestart` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-restart` (preset id-routing only). |
| `onQuit` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-quit` (preset id-routing only). |
| `onClose` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-close`. |
| `onSelect` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside `tc-select`. |

**PauseMenuItem shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique item identifier, returned in `tc-select` detail. |
| `label` | `string` | yes | Display text for the menu row. |
| `disabled` | `boolean` | no | Prevents selection and applies the disabled style. |
| `badge` | `string` | no | Optional mono badge rendered on the trailing edge. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-resume` | `{}` | Fired when the footer Resume button is clicked (or, under the preset's id-routing, a `resume` item is activated). Does **not** self-close. |
| `tc-restart` | `{}` | Fired when a `restart` item is activated (preset id-routing only). |
| `tc-quit` | `{}` | Fired when a `quit` item is activated (preset id-routing only). |
| `tc-close` | `{}` | Fired on `Escape` key, backdrop click, or — if the consumer wires it up — close actions. Does **not** mutate `open`. |
| `tc-select` | `{ id: string }` | Fired when a non-disabled menu item is activated (click, `Enter`, or `Space`). |

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-pause-menu-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-pause-menu-border-color` | `var(--tc-border)` | Panel and item border colour. |
| `--bs-pause-menu-shadow` | `var(--tc-shadow-lg)` | Panel box-shadow (overlay tier). |
| `--bs-pause-menu-width` | `360px` | Default panel width. |
| `--bs-pause-menu-max-width` | `calc(100vw - 2rem)` | Maximum panel width (viewport responsive). |
| `--bs-pause-menu-max-height` | `calc(100vh - 4rem)` | Maximum panel height. |
| `--bs-pause-menu-padding` | `1.25rem` | Header and footer padding. |
| `--bs-pause-menu-backdrop-bg` | `#0f172a` | Backdrop scrim colour. |
| `--bs-pause-menu-backdrop-opacity` | `0.55` | Backdrop opacity (open state). |
| `--bs-pause-menu-z-backdrop` | `var(--tc-z-modal-backdrop)` | Backdrop z-index. |
| `--bs-pause-menu-z-panel` | `var(--tc-z-modal)` | Panel z-index. |
| `--bs-pause-menu-eyebrow-color` | `var(--tc-text-muted)` | Eyebrow micro-label colour. |
| `--bs-pause-menu-title-color` | `var(--tc-text)` | Heading colour. |
| `--bs-pause-menu-item-min-height` | `2.75rem` | Item row min-height (44 px under coarse pointer). |
| `--bs-pause-menu-item-color` | `var(--tc-text)` | Item text colour. |
| `--bs-pause-menu-item-hover-bg` | `var(--tc-surface-muted)` | Item hover/focus background. |
| `--bs-pause-menu-item-disabled-color` | `var(--tc-text-faint)` | Disabled item text colour. |
| `--bs-pause-menu-badge-bg` | `var(--tc-surface-muted)` | Badge background. |
| `--bs-pause-menu-badge-color` | `var(--tc-text-muted)` | Badge text colour. |
| `--bs-pause-menu-resume-bg` | `var(--tc-app-accent)` | Resume button background. |
| `--bs-pause-menu-resume-color` | `#fff` | Resume button text colour. |
| `--bs-pause-menu-resume-hover-bg` | `var(--tc-ink, #0f172a)` | Resume button hover background. |

```html
<button onclick="document.querySelector('#pause').setAttribute('open','')">Pause</button>

<tc-pause-menu id="pause" menu-title="Realm of Ash"></tc-pause-menu>

<script>
    const menu = document.querySelector('#pause')

    menu.items = [
        { id: 'resume',   label: 'Resume' },
        { id: 'settings', label: 'Settings', badge: 'New' },
        { id: 'load',     label: 'Load Game' },
        { id: 'quit',     label: 'Quit', disabled: true },
    ]

    menu.addEventListener('tc-resume', () => menu.removeAttribute('open'))
    menu.addEventListener('tc-close',  () => menu.removeAttribute('open'))
    menu.addEventListener('tc-select', e => {
        console.log('selected:', e.detail.id)
        menu.removeAttribute('open')
    })
</script>
```

---