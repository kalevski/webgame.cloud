---
component: tc-journal
---

### tc-journal

Quest / lore journal pairing an entry list (left rail) with a detail view (right pane). Each entry carries a `state` (active / completed / failed / inactive), an optional description and body, a list of objectives with checkbox indicators, and a list of rewards. Selecting a row updates the detail pane and fires `tc-select`. Styled to the slate/ink design system with sharp corners, JetBrains Mono machine-facing text, 1px hairline borders, a state-colored pip per row, a CSS-drawn objective checkbox, and `--bs-journal-*` custom properties as the theming contract.

**Tag:** `tc-journal`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `selected-id` | `string` | `''` | ID of the currently selected entry; its row gets an ink accent left-border and its content fills the detail pane |

#### JS Properties

| Property | Type | Description |
|---|---|---|
| `entries` | `JournalEntry[]` | Array of journal entry objects to render. Setting re-renders the component. |
| `selectedId` | `string` | Reflects the `selected-id` attribute |
| `onSelect` | `((id: string) => void) \| null` | Callback fired when an entry is selected by click or keyboard |

**`JournalEntry` shape:**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique entry identifier |
| `title` | `string` | Entry title shown in the list and detail heading |
| `description` | `string?` | Short summary shown at the top of the detail body |
| `body` | `string?` | Longer lore / flavour text shown below the description |
| `objectives` | `JournalObjective[]?` | Objective rows shown under an "Objectives" label |
| `state` | `'active' \| 'completed' \| 'failed' \| 'inactive'` | Drives the row pip color and the detail state micro-label (defaults to `active`) |
| `rewards` | `JournalReward[]?` | Reward rows shown under a "Rewards" label |

**`JournalObjective` shape:**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique objective identifier |
| `label` | `string` | Objective text |
| `completed` | `boolean?` | When `true` fills the checkbox and strikes through the label |
| `optional` | `boolean?` | When `true` appends an `(optional)` micro-label |

**`JournalReward` shape:**

| Field | Type | Description |
|---|---|---|
| `label` | `string` | Reward name |
| `value` | `string \| number` | Reward amount; numbers are formatted with thousands separators |
| `icon` | `string?` | Optional short glyph/text shown before the label |

#### Events

| Event | `detail` | Description |
|---|---|---|
| `tc-select` | `{ id: string }` | Fired when an entry row is clicked or activated with Enter/Space |

#### Slots

None. All content is driven by the `entries` JS property.

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-journal-bg` | `var(--tc-surface)` | Component background |
| `--bs-journal-border` | `1px solid var(--tc-border)` | Outer frame border |
| `--bs-journal-min-height` | `18rem` | Minimum component height |
| `--bs-journal-list-width` | `14rem` | Width of the left entry-list rail |
| `--bs-journal-list-bg` | `var(--tc-surface)` | List rail background |
| `--bs-journal-list-border-color` | `var(--tc-border)` | Divider between list and detail |
| `--bs-journal-row-border-color` | `var(--tc-border)` | Row divider |
| `--bs-journal-row-hover-bg` | `var(--tc-surface-hover, …)` | Row hover background |
| `--bs-journal-row-selected-bg` | `var(--tc-surface-muted)` | Selected row background |
| `--bs-journal-row-selected-accent` | `var(--tc-app-accent)` | Selected row left-border accent |
| `--bs-journal-row-title-color` | `var(--tc-text)` | Row title color |
| `--bs-journal-row-title-font-size` | `0.8125rem` | Row title font size |
| `--bs-journal-pip-active` | `var(--tc-app-accent)` | Pip color for `active` entries |
| `--bs-journal-pip-completed` | `var(--tc-success, #22c55e)` | Pip color for `completed` entries |
| `--bs-journal-pip-failed` | `var(--tc-danger, #ef4444)` | Pip color for `failed` entries |
| `--bs-journal-pip-inactive` | `var(--tc-text-faint)` | Pip color for `inactive` entries |
| `--bs-journal-detail-bg` | `var(--tc-surface)` | Detail pane background |
| `--bs-journal-title-color` | `var(--tc-text)` | Detail title color |
| `--bs-journal-title-font-size` | `1.125rem` | Detail title font size |
| `--bs-journal-description-color` | `var(--tc-text)` | Detail description color |
| `--bs-journal-body-color` | `var(--tc-text-muted)` | Detail body color |
| `--bs-journal-eyebrow-color` | `var(--tc-text-muted)` | Objectives / Rewards label color |
| `--bs-journal-empty-color` | `var(--tc-text-faint)` | Empty-state message color |
| `--bs-journal-state-active` | `var(--tc-app-accent)` | State micro-label color for `active` |
| `--bs-journal-state-completed` | `var(--tc-success, #22c55e)` | State micro-label color for `completed` |
| `--bs-journal-state-failed` | `var(--tc-danger, #ef4444)` | State micro-label color for `failed` |
| `--bs-journal-state-inactive` | `var(--tc-text-faint)` | State micro-label color for `inactive` |
| `--bs-journal-check-size` | `1rem` | Objective checkbox size |
| `--bs-journal-check-color` | `var(--tc-border-strong)` | Unchecked objective box border |
| `--bs-journal-check-done-color` | `var(--tc-app-accent)` | Completed objective box fill |
| `--bs-journal-objective-color` | `var(--tc-text)` | Objective label color |
| `--bs-journal-objective-completed-color` | `var(--tc-text-faint)` | Completed objective label color |
| `--bs-journal-objective-optional-color` | `var(--tc-text-faint)` | `(optional)` micro-label color |
| `--bs-journal-reward-bg` | `var(--tc-surface-muted)` | Reward row background |
| `--bs-journal-reward-label-color` | `var(--tc-text-muted)` | Reward label color |
| `--bs-journal-reward-value-color` | `var(--tc-text)` | Reward value color |

#### Example

```html
<tc-journal id="journal" selected-id="q1"></tc-journal>

<script>
  const el = document.getElementById('journal')

  el.entries = [
    {
      id: 'q1',
      title: 'The Ashen Crown',
      state: 'active',
      description: 'Recover the shattered crown of the old kings.',
      body: 'The catacombs run deep beneath the ruined keep…',
      objectives: [
        { id: 'o1', label: 'Enter the catacombs', completed: true },
        { id: 'o2', label: 'Recover the three shards' },
        { id: 'o3', label: 'Light the braziers', optional: true },
      ],
      rewards: [
        { label: 'Gold', value: 1500, icon: '◆' },
        { label: 'Reputation', value: '+250 Vale' },
      ],
    },
    { id: 'q2', title: 'Whispers in the Mist', state: 'completed' },
  ]

  el.addEventListener('tc-select', e => console.log('selected', e.detail.id))
</script>
```

---