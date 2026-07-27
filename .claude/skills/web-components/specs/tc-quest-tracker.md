---
component: tc-quest-tracker
---

### tc-quest-tracker

On-screen quest-objectives tracker. Renders a header title, a list of named quests, and per-quest objective rows with a checkbox indicator, label, optional badge, progress count, and a 3 px progress bar. Objectives support `completed` (struck-through, muted) and `optional` states. All content is driven by the `quests` JS property. Sharp corners; slate neutrals; JetBrains Mono for the header and progress counts.

**Tag:** `tc-quest-tracker`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `tracker-title` | string | `'Active Quests'` | Text displayed in the component header. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trackerTitle` | `string` | `'Active Quests'` | Reflected JS accessor for the `tracker-title` attribute. |
| `quests` | `QuestEntry[]` | `[]` | Array of quest entries. Setting this property re-renders the tracker. |

**QuestEntry shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique quest identifier (stamped as `data-id` on the quest element). |
| `name` | `string` | yes | Quest display name shown as the quest heading. |
| `objectives` | `QuestObjective[]` | yes | Ordered list of objectives for this quest. |

**QuestObjective shape**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | yes | Unique objective identifier (stamped as `data-id` on the objective element). |
| `label` | `string` | yes | Objective display text. |
| `progress` | `number` | no | Current progress value. Renders a progress bar and count when both `progress` and `target` are set. |
| `target` | `number` | no | Target value for the progress bar. Must be `> 0` for the bar to render. |
| `completed` | `boolean` | no | When `true`, strikes through the label and mutes the text. |
| `optional` | `boolean` | no | When `true`, appends an `(optional)` mono label after the objective text. |

**Events**

None. `tc-quest-tracker` is purely data-driven via the `quests` JS property.

**Slots**

None.

**CSS custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-quest-tracker-bg` | `var(--tc-surface)` | Panel background colour. |
| `--bs-quest-tracker-border` | `1px solid var(--tc-border)` | Outer border of the panel. |
| `--bs-quest-tracker-header-bg` | `var(--tc-surface-muted)` | Header background colour. |
| `--bs-quest-tracker-header-border` | `1px solid var(--tc-border)` | Border below the header. |
| `--bs-quest-tracker-title-color` | `var(--tc-text-muted)` | Header title text colour. |
| `--bs-quest-tracker-title-font-size` | `0.6875rem` | Header title font size. |
| `--bs-quest-tracker-quest-border` | `1px solid var(--tc-slate-100)` | Hairline separator between quests. |
| `--bs-quest-tracker-quest-name-color` | `var(--tc-text)` | Quest name colour. |
| `--bs-quest-tracker-quest-name-font-size` | `0.8125rem` | Quest name font size. |
| `--bs-quest-tracker-objective-label-color` | `var(--tc-text)` | Objective label colour at rest. |
| `--bs-quest-tracker-objective-label-font-size` | `0.8125rem` | Objective label font size. |
| `--bs-quest-tracker-objective-completed-color` | `var(--tc-text-faint)` | Objective label colour when completed. |
| `--bs-quest-tracker-objective-optional-color` | `var(--tc-text-faint)` | Optional badge text colour. |
| `--bs-quest-tracker-objective-optional-font-size` | `0.6875rem` | Optional badge font size. |
| `--bs-quest-tracker-check-size` | `0.625rem` | Width and height of the check indicator box. |
| `--bs-quest-tracker-check-color` | `var(--tc-border-strong)` | Border colour of the unchecked indicator. |
| `--bs-quest-tracker-check-done-color` | `var(--tc-app-accent)` | Fill and border colour of the completed indicator. |
| `--bs-quest-tracker-count-color` | `var(--tc-text-muted)` | Progress count text colour. |
| `--bs-quest-tracker-count-font-size` | `0.75rem` | Progress count font size. |
| `--bs-quest-tracker-bar-bg` | `var(--tc-border)` | Progress bar track colour. |
| `--bs-quest-tracker-bar-fill` | `var(--tc-app-accent)` | Progress bar fill colour. |
| `--bs-quest-tracker-bar-height` | `3px` | Progress bar height. |
| `--bs-quest-tracker-empty-color` | `var(--tc-text-faint)` | Empty state text colour. |

**Example**

```html
<tc-quest-tracker id="qt" tracker-title="Active Quests"></tc-quest-tracker>

<script>
  const qt = document.getElementById('qt')

  qt.quests = [
    {
      id: 'q1',
      name: 'The Lost Heirloom',
      objectives: [
        { id: 'o1', label: 'Speak to Lady Elara', completed: true },
        { id: 'o2', label: 'Find the heirloom', progress: 1, target: 3 },
        { id: 'o3', label: 'Defeat the guardian', optional: true },
      ],
    },
    {
      id: 'q2',
      name: 'Wolves at the Gate',
      objectives: [
        { id: 'o1', label: 'Slay wolves', progress: 4, target: 6 },
      ],
    },
  ]
</script>
```

---