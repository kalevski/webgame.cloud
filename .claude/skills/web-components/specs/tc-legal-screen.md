---
component: tc-legal-screen
---

### tc-legal-screen

Multi-section legal / EULA screen with a sidebar nav, scrollable body panel, an optional accept footer, and a close button. Styled to the toolcase design system — flat `--tc-surface` card, 1px hairline borders, sharp corners (`border-radius: 0`), mono eyebrow labels, and an ink-gradient accept button. Sections are supplied via the `sections` JS property; the active section is tracked internally and changes when a sidebar nav item is clicked. Fires `tc-close` when the close button is clicked and `tc-accept` when the accept button is clicked. The host carries `role="region"` unless one is already set.

**Tag:** `tc-legal-screen`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `screen-title` | string | `Legal` | Title shown in the header beside the mono eyebrow label |
| `initial-section` | string | — | `id` of the section to activate on first render; falls back to the first section when absent or not found |
| `show-accept` | boolean | false | When present, renders a footer with an "Accept & Continue" button that fires `tc-accept` |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `sections` | `LegalSection[]` | Array of sections to show in the sidebar nav and body; setting this re-renders |
| `screenTitle` | string | Mirror of the `screen-title` attribute |
| `initialSection` | string | Mirror of the `initial-section` attribute |
| `showAccept` | boolean | Mirror of the `show-accept` attribute |
| `onClose` | `(() => void) \| null` | Optional callback fired alongside `tc-close` |
| `onAccept` | `(() => void) \| null` | Optional callback fired alongside `tc-accept` |

Each `LegalSection`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique key used for `initial-section` matching and active tracking |
| `title` | string | Section label in the nav and as the body heading |
| `body` | string | Full text content of the section |

**Events**

| Event | `detail` | Fired when |
|-------|----------|------------|
| `tc-close` | `{}` | The close button is clicked |
| `tc-accept` | `{}` | The "Accept & Continue" footer button is clicked (requires `show-accept`) |

**Slots:** none — all content is generated from attributes and the `sections` JS property.

```html
<tc-legal-screen id="legal" screen-title="Terms of Service" show-accept></tc-legal-screen>
<script>
const el = document.getElementById('legal')
el.sections = [
    { id: 'eula', title: 'End User License Agreement', body: 'You agree to the terms...' },
    { id: 'privacy', title: 'Privacy Policy', body: 'We collect anonymous telemetry...' },
]
el.addEventListener('tc-accept', () => console.log('accepted'))
el.addEventListener('tc-close', () => console.log('closed'))
</script>
```

---