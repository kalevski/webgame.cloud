---
component: tc-dialogue-box
---

### tc-dialogue-box

**Tag:** `tc-dialogue-box`

NPC dialogue box with an optional speaker name and a typewriter body line, plus an optional list of choice buttons. Built to the design system — a flat slate surface, sharp corners, a 1px hairline border, and an overlay-tier shadow. The text types in character-by-character at `typing-speed` characters per second; clicking (or tapping) the box once while typing fast-forwards to the full line. Once the line is revealed, a box with no choices acts as an advance affordance (click → `tc-advance`, with a bobbing caret hint), while a box with choices presents the options (click → `tc-choice`). Under `prefers-reduced-motion` the line is revealed instantly and the caret stops bobbing.

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `speaker` | string | — | Speaker name shown in a header row above the body, separated by a hairline. Omitted entirely when absent. |
| `text` | string | `''` | The dialogue line. Typed out character-by-character; changing it restarts the typewriter. |
| `typing-speed` | number | `24` | Characters revealed per second. Non-positive or non-finite values fall back to `24`. The per-character interval is clamped to a minimum of 8ms. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `speaker` | `string` | `''` | Reflects the `speaker` attribute. |
| `text` | `string` | `''` | Reflects the `text` attribute. |
| `typingSpeed` | `number` | `24` | Reflects the `typing-speed` attribute. |
| `choices` | `DialogueChoice[]` | `[]` | Choice buttons shown after the line finishes typing. Each entry: `{ id: string; label: string; disabled?: boolean }`. Setting this property re-renders. When non-empty, the box presents choices instead of advancing. |
| `onChoice` | `((id: string) => void) \| null` | `null` | Optional callback fired alongside the `tc-choice` event. |
| `onAdvance` | `(() => void) \| null` | `null` | Optional callback fired alongside the `tc-advance` event. |

**Events**

| Event | `detail` | When |
|-------|----------|------|
| `tc-choice` | `{ id: string }` | A non-disabled choice button is clicked or activated via keyboard. `id` is the chosen entry's `id`. |
| `tc-advance` | `{}` | The box is clicked after the line has finished typing **and** there are no choices. Not fired while typing (the first click fast-forwards instead). |

Both events `bubble` and are `composed`. Disabled choices fire nothing.

**Slots**

None. Content is driven entirely by attributes and the `choices` property.

**Accessibility**

The host carries `role="group"` (unless one is already set). Choices are real `<button type="button">` elements — disabled choices use the native `disabled` attribute plus `aria-disabled="true"` and are removed from the tab order. Each choice has a leading chevron marker (inline SVG, `aria-hidden`); the advance caret is also `aria-hidden`. Focus is shown with the standard 2px ink outline. Choice hit areas are at least 44px tall under coarse pointers. The typewriter is decorative motion: under `prefers-reduced-motion` the full line appears at once and the advance caret does not bob.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-dialogue-box-bg` | `var(--tc-surface)` | Panel background. |
| `--bs-dialogue-box-border` | `1px solid var(--tc-border)` | Outer hairline frame. |
| `--bs-dialogue-box-shadow` | `var(--tc-shadow-lg)` | Overlay-tier drop shadow. |
| `--bs-dialogue-box-padding-y` | `1rem` | Vertical panel padding. |
| `--bs-dialogue-box-padding-x` | `1.25rem` | Horizontal panel padding. |
| `--bs-dialogue-box-gap` | `0.75rem` | Gap between the speaker header, body, and choices. |
| `--bs-dialogue-box-speaker-color` | `var(--tc-text)` | Speaker-name colour. |
| `--bs-dialogue-box-speaker-font-size` | `0.8125rem` | Speaker-name font size. |
| `--bs-dialogue-box-speaker-font-weight` | `600` | Speaker-name font weight. |
| `--bs-dialogue-box-speaker-letter-spacing` | `0.02em` | Speaker-name letter spacing. |
| `--bs-dialogue-box-speaker-border` | `1px solid var(--tc-border)` | Hairline under the speaker header. |
| `--bs-dialogue-box-speaker-pad` | `0.5rem` | Padding below the speaker name. |
| `--bs-dialogue-box-text-color` | `var(--tc-text)` | Body-text colour. |
| `--bs-dialogue-box-text-font-size` | `0.925rem` | Body-text font size. |
| `--bs-dialogue-box-text-line-height` | `1.6` | Body-text line height. |
| `--bs-dialogue-box-text-min-height` | `3.2em` | Reserved body height so the panel doesn't reflow while typing. |
| `--bs-dialogue-box-indicator-color` | `var(--tc-text-faint)` | Advance-caret colour. |
| `--bs-dialogue-box-indicator-size` | `1rem` | Advance-caret size. |
| `--bs-dialogue-box-choices-gap` | `0.375rem` | Gap between choice buttons. |
| `--bs-dialogue-box-choice-bg` | `var(--tc-surface)` | Choice background. |
| `--bs-dialogue-box-choice-color` | `var(--tc-text)` | Choice text colour. |
| `--bs-dialogue-box-choice-border` | `1px solid var(--tc-border)` | Choice hairline border. |
| `--bs-dialogue-box-choice-padding-y` | `0.5rem` | Choice vertical padding. |
| `--bs-dialogue-box-choice-padding-x` | `0.75rem` | Choice horizontal padding. |
| `--bs-dialogue-box-choice-font-size` | `0.875rem` | Choice font size. |
| `--bs-dialogue-box-choice-hover-bg` | `var(--tc-surface-muted)` | Choice hover well. |
| `--bs-dialogue-box-choice-marker-color` | `var(--tc-text-faint)` | Leading chevron colour at rest. |
| `--bs-dialogue-box-choice-marker-hover-color` | `var(--tc-app-accent)` | Leading chevron colour on hover. |
| `--bs-dialogue-box-choice-disabled-opacity` | `0.5` | Disabled-choice opacity. |
| `--bs-dialogue-box-transition` | `var(--tc-transition-fast)` | Hover/reveal transition timing. |

```html
<!-- Speaker + typewriter; click to advance once revealed -->
<tc-dialogue-box
    speaker="Captain Mara"
    text="The storm took out the eastern bridge. We'll have to find another way across."
></tc-dialogue-box>

<!-- Choices via the JS property + tc-choice event -->
<tc-dialogue-box id="clerk" speaker="Guild Clerk" text="There's a bounty posted. Interested?"></tc-dialogue-box>
<script>
    const box = document.getElementById('clerk')
    box.choices = [
        { id: 'accept', label: 'Accept the quest' },
        { id: 'decline', label: 'Decline politely' },
        { id: 'locked', label: 'Ask for more gold', disabled: true },
    ]
    box.addEventListener('tc-choice', e => console.log('chose', e.detail.id))
</script>

<!-- No speaker, faster typing -->
<tc-dialogue-box typing-speed="60" text="A narrator hurries the scene along."></tc-dialogue-box>
```

---