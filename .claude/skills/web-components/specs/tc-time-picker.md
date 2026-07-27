---
component: tc-time-picker
---

### tc-time-picker

Time picker with a scrollable column interface (hours, minutes, optional seconds, plus an AM/PM column in 12-hour mode). Selecting cells composes a canonical 24-hour time string.

**Tag:** `tc-time-picker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | — | Selected time as a canonical 24-hour string, `HH:mm` or `HH:mm:ss`. Reflected back to the attribute on selection. |
| `format` | `'12h' \| '24h'` | `24h` | Display format. `12h` shows hours 1–12 plus an AM/PM column; the stored `value` stays 24-hour. |
| `minute-step` | number | `1` | Increment (1–30) for the minutes column. |
| `show-seconds` | boolean | false | Adds a seconds column and includes seconds in `value` (`HH:mm:ss`). |
| `label` | string | — | Optional field label rendered above the trigger. |
| `placeholder` | string | `Select time` | Text shown in the trigger when no value is set. |
| `error` | string | — | Validation message. When present, the trigger gets `.is-invalid` and an `.invalid-feedback` message is shown. |
| `disabled` | boolean | false | Disables the control (`opacity: 0.5; pointer-events: none`). |
| `clearable` | boolean | false | Shows a clear (✕) button when a value is set, replacing the clock icon. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string \| null` | Get/set the current time string. Setting reflects to the attribute and patches the display in place. |
| `format` | `'12h' \| '24h'` | Reflected. |
| `minuteStep` | number | Reflected (clamped 1–30). |
| `showSeconds` | boolean | Reflected boolean. |
| `clearable` | boolean | Reflected boolean. |
| `onChange` | `((value: string) => void) \| null` | Optional callback fired alongside the `tc-change` event on every selection or clear (empty string on clear). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ value: string }` | Fired (bubbles, composed) whenever the selection changes (option click/Enter) or the value is cleared. `detail.value` is the canonical 24-hour string, or `''` when cleared. |

**Slots**

None. All content is generated from attributes and JS properties.

**Keyboard navigation**

- `Arrow Up / Down` — move focus within the focused column.
- `Arrow Left / Right` — move focus between columns.
- `Enter` / `Space` — commit the focused cell.
- `Escape` — close the panel and return focus to the trigger.
- `Tab` — close the panel without refocusing the trigger.

**Accessibility**

- Trigger is a real `<button>` with `aria-haspopup="dialog"` and `aria-expanded`.
- Panel has `role="dialog"`; each column has `role="listbox"`, and each option has `role="option"` with `aria-selected`.
- When `error` is set, the message is linked to the trigger via `aria-describedby`.
- Focus is always visible; `prefers-reduced-motion` is honoured. 44px touch targets on coarse pointers.

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-time-picker-trigger-bg` | `var(--tc-surface)` | Trigger background |
| `--bs-time-picker-trigger-border` | `var(--tc-border-strong)` | Trigger border color |
| `--bs-time-picker-trigger-color` | `var(--tc-text)` | Trigger text color |
| `--bs-time-picker-panel-bg` | `var(--tc-surface)` | Panel overlay background |
| `--bs-time-picker-panel-border` | `var(--tc-border)` | Panel border color |
| `--bs-time-picker-panel-shadow` | `var(--tc-shadow-lg)` | Panel drop-shadow |
| `--bs-time-picker-panel-z` | `var(--tc-z-dropdown)` | Panel z-index |
| `--bs-time-picker-column-height` | `220px` | Scrollable column height |
| `--bs-time-picker-option-color` | `var(--tc-text)` | Option text color |
| `--bs-time-picker-option-hover-bg` | `var(--tc-surface-muted)` | Option hover well |
| `--bs-time-picker-option-active-bg` | `var(--tc-app-accent)` | Selected option fill |

**Examples**

```html
<!-- 24-hour, 15-minute steps -->
<tc-time-picker label="Start time" value="09:30" minute-step="15"></tc-time-picker>

<!-- 12-hour with AM/PM column -->
<tc-time-picker label="Meeting time" format="12h" value="14:15"></tc-time-picker>

<!-- Seconds + clearable -->
<tc-time-picker label="Timestamp" show-seconds clearable value="08:05:30"></tc-time-picker>

<!-- Listening for changes -->
<tc-time-picker id="tp" label="Reminder" clearable></tc-time-picker>
<script>
  document.getElementById('tp').addEventListener('tc-change', e => console.log(e.detail.value))
</script>
```

---