---
component: tc-mouse-sensitivity
---

### tc-mouse-sensitivity

A mouse-sensitivity setting row: a label/description text block paired with one or two native range sliders (main + optional ADS, each spanning 0.1–5 with 0.05 steps) and mono decimal readouts. Built on the shared `tc-setting-row` scaffold (a label/control row that the setting rows reuse), styled to the toolcase slate/ink look.

**Tag:** `tc-mouse-sensitivity`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `row-label` | string | `Mouse sensitivity` | Row label (set automatically when absent) |
| `description` | string | — | Optional secondary line beneath the label |
| `value` | number | `1` | Main sensitivity (0.1–5, 0.05 step) |
| `ads` | number | — | ADS sensitivity (0.1–5, 0.05 step). When absent, the ADS slider is hidden. |
| `disabled` | boolean | `false` | Disables both range inputs |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `number` | Get or set the main sensitivity. Getter defaults to `1`. Setting patches the input + readout in place — no full re-render. |
| `ads` | `number \| null` | Get or set the ADS sensitivity. Setting to `null` removes the ADS row; setting to a number shows it. Structural change triggers a re-render; numeric-only change patches in place. |
| `rowLabel` | `string` | Get/set the `row-label` attribute. |
| `description` | `string` | Get/set the `description` attribute. |
| `disabled` | `boolean` | Get/set the `disabled` attribute. |
| `onChange` | `((key: 'main' \| 'ads', value: number) => void) \| null` | Optional callback fired on every change. Mirrors the `tc-change` event. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ key: 'main' \| 'ads', value: number }` | Fired on every range-input change. `key` identifies which slider changed. |

**No slots.**

```html
<tc-mouse-sensitivity
  row-label="Mouse sensitivity"
  description="Adjust how quickly the camera reacts to mouse movement."
  value="1.5"
  ads="0.8"
></tc-mouse-sensitivity>
<script>
  const el = document.querySelector('tc-mouse-sensitivity')
  el.value = 2
  el.ads = 1.0
  el.addEventListener('tc-change', e => console.log(e.detail.key, e.detail.value))
</script>
```

---