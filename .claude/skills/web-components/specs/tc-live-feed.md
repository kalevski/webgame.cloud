---
component: tc-live-feed
---

### tc-live-feed

Vertical feed of timestamped events with optional header bar, REC indicator, and auto-scroll. Events are set via the `events` JS property (array of `FeedEvent`). Newest events appear at the bottom. The body has `role="log"` and `aria-live="polite"`. Clicking (or pressing Enter/Space on) a row dispatches `tc-row-click`. Auto-scroll pins to the newest row but respects manual scrolling — if the user has scrolled up, new rows do not yank them down. Sharp corners; slate neutrals; JetBrains Mono timestamps.

**Tag:** `tc-live-feed`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `header` | string | absent | Optional feed title shown in the header bar. |
| `recording` | boolean | absent | When present, shows a pulsing `--tc-danger` REC dot with a "REC" label in the header. |
| `max-rows` | number | `0` (unlimited) | Caps the number of displayed rows. Only the newest `max-rows` events are rendered; older entries are trimmed. |
| `auto-scroll` | boolean | absent | When present, scrolls the feed body to the newest row after each update — only when the user is already near the bottom. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `events` | `FeedEvent[]` | `[]` | Array of feed events. Setting this property re-renders the feed. Appending pattern: `el.events = [...el.events, newEvent]`. |
| `onrowclick` | `function or null` | `null` | Optional callback fired alongside `tc-row-click` when a row is activated. Receives `{ id?: string; event: FeedEvent }`. |

**FeedEvent shape**

```ts
interface FeedEvent {
  id?: string
  time?: string
  label: string
  level?: 'info' | 'success' | 'warning' | 'danger'
  icon?: string
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-row-click` | `{ id?: string; event: FeedEvent }` | Dispatched (bubbles) when a row is clicked or activated via Enter/Space. |

**Slots**

None. `tc-live-feed` is purely data-driven via the `events` JS property.

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-live-feed-bg` | `var(--tc-surface)` | Feed background colour. |
| `--bs-live-feed-border` | `1px solid var(--tc-border)` | Outer border of the feed. |
| `--bs-live-feed-header-bg` | `var(--tc-surface-muted)` | Header bar background. |
| `--bs-live-feed-header-border` | `1px solid var(--tc-border)` | Border below the header bar. |
| `--bs-live-feed-header-color` | `var(--tc-text-muted)` | Header title text colour. |
| `--bs-live-feed-header-font-size` | `0.6875rem` | Header title font size. |
| `--bs-live-feed-body-max-height` | `400px` | Max height of the scrollable body. |
| `--bs-live-feed-row-border` | `1px solid var(--tc-slate-100)` | Hairline between rows. |
| `--bs-live-feed-row-hover-bg` | `var(--tc-surface-hover)` | Row hover background. |
| `--bs-live-feed-time-color` | `var(--tc-text-muted)` | Timestamp text colour. |
| `--bs-live-feed-time-font-size` | `11.5px` | Timestamp font size. |
| `--bs-live-feed-label-font-size` | `0.8125rem` | Row label font size. |
| `--bs-live-feed-icon-size` | `1rem` | Icon width and height. |
| `--bs-live-feed-rec-dot-color` | `var(--tc-danger)` | REC indicator dot and label colour. |
| `--bs-live-feed-rec-animation-speed` | `0.9s` | REC dot pulse cycle duration. |

**Example**

```html
<tc-live-feed id="feed" header="// SYSTEM LOG" recording auto-scroll></tc-live-feed>

<script>
  const feed = document.getElementById('feed')

  feed.events = [
    { id: 'e1', time: '10:00:01', label: 'Service started', level: 'success' },
    { id: 'e2', time: '10:00:04', label: 'Connected to database', level: 'info' },
    { id: 'e3', time: '10:00:12', label: 'Disk usage above 80%', level: 'warning' },
  ]

  setInterval(function() {
    feed.events = feed.events.concat([{
      id: 'live-' + Date.now(),
      time: new Date().toTimeString().slice(0, 8),
      label: 'Heartbeat OK',
      level: 'success',
    }])
  }, 1000)

  feed.addEventListener('tc-row-click', function(e) {
    console.log('Row clicked:', e.detail.id, e.detail.event.label)
  })
</script>
```

```html
<!-- Cap to 10 most-recent rows -->
<tc-live-feed id="capped" header="// AUDIT" max-rows="10" auto-scroll></tc-live-feed>

<script>
  var el = document.getElementById('capped')
  el.events = [
    { id: '0', time: '00:00:00', label: 'Event 0', level: 'info' },
    { id: '1', time: '00:00:01', label: 'Event 1', level: 'warning' },
    { id: '2', time: '00:00:02', label: 'Event 2', level: 'danger' },
  ]
  // Only the last 10 events render; oldest trimmed automatically
</script>
```
```

---