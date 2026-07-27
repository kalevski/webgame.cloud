---
component: tc-party-panel
---

### tc-party-panel

Party member panel with portraits, health, and status. Styled to the toolcase design system: slate neutrals, hairline borders, sharp corners, JetBrains Mono for machine-facing text, ink accent for host badge. Members are set via the `members` JS property. Empty slots render as Invite buttons that fire `tc-invite`; the Leave Party button fires `tc-leave`. All cosmetics flow through `--bs-party-panel-*` custom properties.

**Tag:** `tc-party-panel`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `capacity` | number | `4` | Maximum number of member slots to render. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `capacity` | `number` | `4` | Reflects the `capacity` attribute. |
| `members` | `PartyMember[]` | `[]` | Array of party member objects. Setting this re-renders the slot grid. Accepts at most `capacity` items; extras are silently ignored. |
| `onLeave` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-leave`. |
| `onInvite` | `(() => void) \| null` | `null` | Optional callback fired alongside `tc-invite`. |

**`PartyMember` shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique member identifier. Stamped as `data-id` on the slot element. |
| `name` | `string` | yes | Display name rendered in the slot. |
| `ready` | `boolean` | no | When `true` the slot gains `.tc-party-panel-slot--ready` and shows "Ready"; otherwise shows "Waiting". |
| `host` | `boolean` | no | When `true` a "Host" badge is shown in the slot. |
| `role` | `string` | no | Optional role chip rendered in JetBrains Mono (e.g. `"Tank"`, `"Healer"`, `"DPS"`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-leave` | `{}` | Fired when the Leave Party button is clicked. Bubbles and is composed. |
| `tc-invite` | `{}` | Fired when an empty (Invite) slot button is clicked. Bubbles and is composed. |

**Slots**

`tc-party-panel` has no named slots. All content is driven by attributes and JS properties.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-party-panel-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-party-panel-border` | `var(--tc-border)` | Outer 1px hairline border. |
| `--bs-party-panel-header-bg` | `var(--tc-surface-muted)` | Header section background. |
| `--bs-party-panel-header-border` | `var(--tc-border)` | Header bottom border. |
| `--bs-party-panel-eyebrow-color` | `var(--tc-text-muted)` | "Party" eyebrow label colour. |
| `--bs-party-panel-count-color` | `var(--tc-text-faint)` | Member count colour (e.g. "2/4"). |
| `--bs-party-panel-slot-bg` | `var(--tc-surface)` | Default slot background. |
| `--bs-party-panel-slot-border` | `var(--tc-border)` | Slot row hairline borders. |
| `--bs-party-panel-slot-empty-bg` | `var(--tc-surface)` | Empty (Invite) slot background. |
| `--bs-party-panel-slot-empty-color` | `var(--tc-text-faint)` | Invite glyph and label colour. |
| `--bs-party-panel-slot-empty-hover-bg` | `var(--tc-surface-hover, var(--tc-surface-muted))` | Invite slot hover background. |
| `--bs-party-panel-slot-filled-bg` | `var(--tc-surface)` | Background for filled (occupied) slots. |
| `--bs-party-panel-slot-ready-bg` | `var(--tc-surface-muted)` | Background tint for ready slots. |
| `--bs-party-panel-member-name-color` | `var(--tc-text)` | Member name text colour. |
| `--bs-party-panel-role-bg` | `var(--tc-surface-muted)` | Role chip background. |
| `--bs-party-panel-role-color` | `var(--tc-text-muted)` | Role chip text colour. |
| `--bs-party-panel-host-badge-color` | `var(--tc-app-accent)` | Host badge text colour. |
| `--bs-party-panel-ready-color` | `var(--tc-success)` | "Ready" badge colour. |
| `--bs-party-panel-waiting-color` | `var(--tc-text-faint)` | "Waiting" badge colour. |
| `--bs-party-panel-actions-bg` | `var(--tc-surface-muted)` | Actions bar background. |
| `--bs-party-panel-btn-bg` | `var(--tc-surface)` | Default button background. |
| `--bs-party-panel-btn-color` | `var(--tc-text)` | Default button text colour. |
| `--bs-party-panel-btn-border` | `var(--tc-border)` | Default button border colour. |
| `--bs-party-panel-btn-hover-bg` | `var(--tc-surface-hover, var(--tc-surface-muted))` | Button hover background. |
| `--bs-party-panel-btn-min-height` | `2.25rem` | Button minimum height (44 px under coarse pointer). |
| `--bs-party-panel-btn-disabled-opacity` | `0.45` | Opacity for disabled buttons. |

**Example**

```html
<tc-party-panel id="my-party" capacity="4"></tc-party-panel>

<script>
    const panel = document.getElementById('my-party')

    panel.members = [
        { id: '1', name: 'Aldric', host: true, ready: true,  role: 'Tank'   },
        { id: '2', name: 'Brina',              ready: true,  role: 'Healer' },
        { id: '3', name: 'Caelum',             ready: false, role: 'DPS'    },
    ]

    panel.addEventListener('tc-leave',  () => console.log('left party'))
    panel.addEventListener('tc-invite', () => console.log('invite slot clicked'))
</script>
```

---