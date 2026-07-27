---
component: tc-welcome-guide
---

### tc-welcome-guide

**Tag:** `tc-welcome-guide`

Onboarding guide with progress tracking and sequential step completion. The active step is auto-derived as the first non-completed step. Locked and completed steps are inert. Clicking or pressing `Enter`/`Space` on the active step dispatches `tc-step-click`.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | — | Required heading text rendered above messages. |
| `background-pattern-src` | `string` | — | URL of a decorative background image (`aria-hidden`). |
| `background-pattern-alt` | `string` | `""` | Alt text for the background image (set to empty for purely decorative). |
| `loading` | boolean | `false` | Renders skeleton placeholders for title, messages, progress, and steps. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `string[]` | Intro/body lines rendered as `<p>` elements below the title. Setting re-renders. |
| `steps` | `WelcomeGuideStep[]` | Ordered step list. Each is `{ key: string; label: string; completed: boolean }`. Setting re-renders. |
| `onstepclick` | `((e, key) => void) \| null` | Optional callback fired alongside the `tc-step-click` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-step-click` | `{ key: string }` | Dispatched when the active step is clicked or activated via keyboard. Bubbles. |

**Slots**

None. All content is driven by attributes and JS properties.

**Accessibility**

- The steps list uses `<ul role="list">` semantics; each step is a `<li>`.
- The active step has `role="button"` with a visible focus ring (`outline: 2px solid --tc-app-accent`).
- Inert (completed/locked) steps carry `aria-disabled="true"` and `tabindex="-1"`.
- The decorative background image is `aria-hidden="true"`.
- The progress bar carries `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
- Step state is conveyed through label text and icon, not colour alone.
- `prefers-reduced-motion`: tick draw animation and progress bar transition are disabled.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-welcome-guide-bg` | `var(--tc-surface)` | Card background. |
| `--bs-welcome-guide-border` | `1px solid var(--tc-border)` | Card border. |
| `--bs-welcome-guide-shadow` | `var(--tc-shadow-sm)` | Card shadow. |
| `--bs-welcome-guide-padding` | `1.5rem` | Card inner padding. |
| `--bs-welcome-guide-title-font-size` | `1.125rem` | Title font size. |
| `--bs-welcome-guide-title-font-weight` | `600` | Title weight. |
| `--bs-welcome-guide-title-color` | `var(--tc-text)` | Title colour. |
| `--bs-welcome-guide-message-color` | `var(--tc-text-muted)` | Message paragraph colour. |
| `--bs-welcome-guide-progress-height` | `0.375rem` | Progress bar track height. |
| `--bs-welcome-guide-progress-bg` | `var(--tc-slate-200)` | Progress track background. |
| `--bs-welcome-guide-progress-fill` | `var(--tc-app-accent)` | Progress fill colour. |
| `--bs-welcome-guide-check-size` | `1.125rem` | Square check indicator side length. |
| `--bs-welcome-guide-check-completed-bg` | `var(--tc-success)` | Completed indicator background. |
| `--bs-welcome-guide-check-active-border` | `var(--tc-app-accent)` | Active indicator border colour. |
| `--bs-welcome-guide-pattern-opacity` | `0.08` | Decorative background image opacity. |
| `--bs-welcome-guide-tick-duration` | `0.3s` | Tick draw animation duration. |

```html
<!-- Basic usage — set steps via JS -->
<tc-welcome-guide id="wg1" title="Get started"></tc-welcome-guide>
<script>
document.getElementById('wg1').messages = [
    'Welcome! Complete these steps to get up and running.',
]
document.getElementById('wg1').steps = [
    { key: 'account', label: 'Create your account', completed: true },
    { key: 'profile', label: 'Set up your profile', completed: false },
    { key: 'team',    label: 'Invite your team',    completed: false },
]
</script>

<!-- Listen for step clicks -->
<tc-welcome-guide id="wg2" title="Onboarding"></tc-welcome-guide>
<script>
const el = document.getElementById('wg2')
el.steps = [
    { key: 'step-1', label: 'Step one', completed: false },
    { key: 'step-2', label: 'Step two', completed: false },
]
el.addEventListener('tc-step-click', e => {
    // Mark the clicked step complete and re-assign
    el.steps = el.steps.map(s =>
        s.key === e.detail.key ? { ...s, completed: true } : s
    )
})
</script>

<!-- With decorative background pattern -->
<tc-welcome-guide
    title="Welcome"
    background-pattern-src="/images/pattern.png"
    background-pattern-alt=""
></tc-welcome-guide>

<!-- Loading skeleton -->
<tc-welcome-guide title="Loading…" loading></tc-welcome-guide>
```

---