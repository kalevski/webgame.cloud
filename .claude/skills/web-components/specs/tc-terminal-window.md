---
component: tc-terminal-window
---

### tc-terminal-window

Styled terminal/console window with macOS-style chrome (three traffic-light dots + a centered title), command prompts, and an optional character-by-character typing animation. Dark code surface (`--tc-ink`), JetBrains Mono throughout, sharp corners, 1px hairline frame. Set the displayed lines via the JS `lines` property.

**Tag:** `tc-terminal-window`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | `''` | Window chrome title, shown centered in the bar and exposed as the region's accessible label. |
| `prompt` | string | `$` | Prompt string prefixed to `command` lines. |
| `animate-typing` | boolean | false | When present, lines are revealed one at a time with a character-by-character typing animation and a blinking cursor on the active line. |
| `speed` | number | `40` | Typing pace in **milliseconds per character**. Ignored when `animate-typing` is absent. |

**Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lines` | `TerminalLine[]` | `[]` | The lines to render. Set via the JS property (not an attribute); re-renders and restarts any typing animation. |

**TerminalLine shape**

| Field | Type | Description |
|-------|------|-------------|
| `type` | `'command' \| 'output' \| 'comment'` | Line kind (default `'output'`). `command` lines are prefixed with `prompt`; `comment` lines are dimmed/italic; `output` lines are plain. |
| `text` | `string` | The line text. |

**Events**

None.

**Slots**

None. All content is driven by attributes and the `lines` JS property.

**Accessibility**

- The body is `role="log"` / `aria-live="polite"` so typed output is announced.
- The window title is exposed as the accessible label of the terminal region (`role="group"` + `aria-labelledby`).
- Honours `prefers-reduced-motion`: all text renders instantly with a static (non-blinking) cursor and the per-character animation is skipped.

```html
<tc-terminal-window title="~/projects/my-app"></tc-terminal-window>

<script>
const term = document.querySelector('tc-terminal-window')
term.lines = [
    { type: 'comment', text: '# Install the package' },
    { type: 'command', text: 'npm install @toolcase/web-components' },
    { type: 'output', text: 'added 12 packages in 2.4s' },
]
</script>

<!-- Animated typing with a custom prompt and speed -->
<tc-terminal-window title="bash" prompt="❯" animate-typing speed="55"></tc-terminal-window>
<script>
document.querySelector('[animate-typing]').lines = [
    { type: 'command', text: 'curl https://api.example.com/health' },
    { type: 'output', text: '{ "status": "ok" }' },
]
</script>
```

---