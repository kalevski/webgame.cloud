---
component: tc-audio-mixer
---

### tc-audio-mixer

A framework-free audio mixer / timeline editor. Renders a toolbar (add-track, play, time readout), a column of track headers (name, mute/solo toggle buttons, a volume range), a horizontally-scrolling timeline (time ruler, clip blocks positioned/sized by `startMs`/`lengthMs`, a playhead from `current-ms`), and an effect-chain inspector for the selected clip. Fully **controlled** — it owns no document state; it dispatches edit events and invokes the matching `actions` callbacks, and the host updates `doc`/`selection`/`current-ms` in response. Clips are draggable to move and edge-draggable to resize; the ruler and clips are keyboard-operable. Sharp corners, dense slate surfaces; status colours (danger/warning/cyan) signal mute/solo/playhead/selection only.

**Tag:** `tc-audio-mixer`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `current-ms` | number | `0` | Playhead position in milliseconds. Patched in place (no full re-render) so scrubbing never disrupts a drag or focus. |
| `disabled` | boolean | `false` | Freezes all interaction (opacity + `pointer-events: none`). |
| `loading` | boolean | `false` | Replaces the body with an animated skeleton and sets `aria-busy`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `doc` | `AudioMixerDocument` | `{ durationMs: number; tracks: { id; name; muted?; solo?; volume?; clips: { id; startMs; lengthMs; label?; effects?: { id; type; params? }[] }[] }[] }`. Setting it re-renders the timeline. Defaults to an empty document. |
| `selection` | `AudioMixerSelectionState` | `{ trackId?: string \| null; clipId?: string \| null }`. The selected track/clip is highlighted and the selected clip's effect chain is shown in the inspector. |
| `actions` | `AudioMixerActions` | Optional callback bag — `addTrack`, `removeTrack`, `toggleMute`, `toggleSolo`, `setVolume`, `moveClip`, `resizeClip`, `selectClip`, `addEffect`, `removeEffect`. Each is invoked alongside the matching event. Defaults to `{}`. |
| `onSeek` | `((ms: number) => void) \| null` | Optional callback mirroring the `tc-seek` event. |

**Events** (every event also calls the matching `actions` callback when present)

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-seek` | `{ ms }` | The ruler/playhead was scrubbed (click or keyboard). |
| `tc-select` | `{ trackId, clipId }` | A track header or clip was selected (`clipId` is `null` for track selection). |
| `tc-clip-move` | `{ clipId, startMs }` | A clip was dragged/keyboard-moved (clamped to `[0, durationMs]`). |
| `tc-clip-resize` | `{ clipId, lengthMs }` | A clip edge was dragged/keyboard-resized. |
| `tc-track-mute` | `{ trackId, muted }` | The mute toggle changed. |
| `tc-track-solo` | `{ trackId, solo }` | The solo toggle changed. |
| `tc-volume-change` | `{ trackId, volume }` | The volume range changed (`0`–`1`). |
| `tc-effect-add` | `{ trackId, clipId, effect }` | An effect was added from the inspector (`effect` is `{ id, type, params }`). |
| `tc-effect-remove` | `{ trackId, clipId, effect }` | An effect was removed from the inspector. |

**No slots** — all content is driven by the `doc`/`selection` properties.

```html
<tc-audio-mixer id="mix" current-ms="9000"></tc-audio-mixer>
<script>
  const el = document.querySelector('#mix')
  el.doc = {
    durationMs: 32000,
    tracks: [
      { id: 'drums', name: 'Drums', volume: 0.9, clips: [{ id: 'd1', startMs: 0, lengthMs: 8000, label: 'Loop A' }] },
      { id: 'bass', name: 'Bass', volume: 0.7, muted: true, clips: [{ id: 'b1', startMs: 2000, lengthMs: 18000, label: 'Sub' }] },
    ],
  }
  el.selection = { trackId: 'drums', clipId: 'd1' }
  el.addEventListener('tc-clip-move', e => console.log('move', e.detail.clipId, e.detail.startMs))
  el.addEventListener('tc-seek', e => el.setAttribute('current-ms', e.detail.ms))
</script>
```

---