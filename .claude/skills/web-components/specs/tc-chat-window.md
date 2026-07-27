---
component: tc-chat-window
---

### tc-chat-window

Scrolling chat log with channel tabs and a compose row (text input + Send button). Messages and channels are set via JS properties; the newest message sits at the bottom and the log scrolls to it after every update. Channel tabs follow the underline-nav motif; clicking a tab switches the active channel and fires `tc-channel-change`. Sending (Enter or the Send button) fires `tc-send` with the active channel and trimmed text, then clears the input. Sender handles render in JetBrains Mono; per-message and per-channel colour is injected via inline custom properties. The message body has `role="log"` + `aria-live="polite"`. Sharp corners; slate neutrals; slate-ink Send button.

**Tag:** `tc-chat-window`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `active-channel` | string | absent | Id of the currently selected channel. Falls back to the first channel when absent. Reflected by the `activeChannel` property and updated when a tab is clicked. |
| `placeholder` | string | `Say something...` | Placeholder text for the compose input. |
| `width` | number | absent | Fixed width in pixels. When absent the window fills its container (`100%`). |
| `height` | number | `360` | Fixed height in pixels for the whole window (tabs + log + compose). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `messages` | `ChatMessage[]` | `[]` | Array of chat messages. Setting it re-renders the log and scrolls to the newest row. Append pattern: `el.messages = [...el.messages, msg]`. |
| `channels` | `ChatChannel[]` | `[]` | Array of channels rendered as tabs. When empty, no tab bar is shown. |
| `activeChannel` | string | `''` | Mirrors the `active-channel` attribute. |
| `placeholder` | string | `Say something...` | Mirrors the `placeholder` attribute. |
| `width` | `number \| null` | `null` | Mirrors the `width` attribute. |
| `height` | `number \| null` | `null` | Mirrors the `height` attribute. |
| `onSend` | `function or null` | `null` | Optional callback fired alongside `tc-send`. Receives `{ channel: string; text: string }`. |
| `onChannelChange` | `function or null` | `null` | Optional callback fired alongside `tc-channel-change`. Receives `{ id: string }`. |

**ChatMessage shape**

```ts
interface ChatMessage {
  id: string
  channel?: string
  sender: string
  body: string
  color?: string   // CSS colour applied to the sender handle
  system?: boolean // renders centred, italic, muted, without a sender
}
```

**ChatChannel shape**

```ts
interface ChatChannel {
  id: string
  label: string
  color?: string   // CSS colour applied to the active tab text + underline
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-send` | `{ channel: string; text: string }` | Dispatched (bubbles, composed) when the user submits non-empty text via Enter or the Send button. `channel` is the active channel id. |
| `tc-channel-change` | `{ id: string }` | Dispatched (bubbles, composed) when the user activates a channel tab. The component also updates its own `active-channel` attribute. |

**Slots**

None. `tc-chat-window` is purely data-driven via the `messages` and `channels` JS properties.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-chat-window-width` | `100%` | Window width (overridden by the `width` attribute). |
| `--bs-chat-window-height` | `360px` | Window height (overridden by the `height` attribute). |
| `--bs-chat-window-bg` | `var(--tc-surface)` | Window background colour. |
| `--bs-chat-window-border` | `1px solid var(--tc-border)` | Outer hairline frame. |
| `--bs-chat-window-tabs-bg` | `var(--tc-surface-muted)` | Channel tab-bar background. |
| `--bs-chat-window-tabs-border` | `1px solid var(--tc-border)` | Border below the tab bar. |
| `--bs-chat-window-tab-rest-color` | `var(--tc-text-muted)` | Tab label colour at rest. |
| `--bs-chat-window-tab-active-color` | `var(--tc-app-accent)` | Active/hover tab text + underline colour when the channel has no `color`. |
| `--bs-chat-window-tab-color` | _(unset)_ | Per-channel override for the active/hover tab colour; injected inline from a channel's `color`. |
| `--bs-chat-window-tab-font-size` | `0.6875rem` | Tab label font size. |
| `--bs-chat-window-message-color` | `var(--tc-text)` | Sender-handle colour (per-message `color` overrides it). |
| `--bs-chat-window-message-font-size` | `0.8125rem` | Message font size. |
| `--bs-chat-window-message-hover-bg` | `var(--tc-surface-hover)` | Message row hover background. |
| `--bs-chat-window-system-color` | `var(--tc-text-faint)` | System-message text colour. |
| `--bs-chat-window-compose-border` | `1px solid var(--tc-border)` | Border above the compose row. |
| `--bs-chat-window-input-bg` | `var(--tc-surface)` | Compose input background. |
| `--bs-chat-window-input-border` | `1px solid var(--tc-border-strong)` | Compose input border. |
| `--bs-chat-window-input-color` | `var(--tc-text)` | Compose input text colour. |
| `--bs-chat-window-input-font-size` | `0.8125rem` | Compose input font size. |
| `--bs-chat-window-input-focus-border` | `rgba(30, 41, 59, 0.5)` | Input border colour on focus. |
| `--bs-chat-window-input-focus-ring` | `0 0 0 0.2rem rgba(30, 41, 59, 0.12)` | Input focus ring. |
| `--bs-chat-window-send-bg` | slate-ink gradient | Send button background. |
| `--bs-chat-window-send-color` | `#fff` | Send button text colour. |
| `--bs-chat-window-send-font-size` | `0.8125rem` | Send button font size. |

**Example**

```html
<tc-chat-window id="chat" active-channel="general" placeholder="Message #general" height="320"></tc-chat-window>

<script>
  const chat = document.getElementById('chat')

  chat.channels = [
    { id: 'general', label: 'General' },
    { id: 'trade', label: 'Trade', color: 'var(--tc-success)' },
    { id: 'help', label: 'Help', color: 'var(--tc-info)' },
  ]

  chat.messages = [
    { id: 'm0', sender: 'system', body: 'Connected to general.', system: true },
    { id: 'm1', sender: 'aria', body: 'morning all', color: 'var(--tc-info)' },
  ]

  // Echo what the user sends back into the log
  chat.addEventListener('tc-send', function(e) {
    chat.messages = chat.messages.concat([
      { id: 'you-' + Date.now(), channel: e.detail.channel, sender: 'you', body: e.detail.text },
    ])
  })

  chat.addEventListener('tc-channel-change', function(e) {
    console.log('Switched to channel:', e.detail.id)
  })
</script>
```

---