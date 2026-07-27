---
component: tc-panel
---

### tc-panel

A themed surface panel — a lightweight container with an optional 1px hairline border and optional header. Compose `tc-panel-header` as a first child to add a heading row.

**Tag:** `tc-panel`

#### Attributes

| Attribute | Type | Default | Description |
|---|---|---|---|
| `bordered` | `boolean` | `false` | Adds a 1px hairline border around the panel. |

#### JS Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `bordered` | `boolean` | `false` | Reflects the `bordered` attribute. |

#### Events

None. `tc-panel` is a presentational container with no interactive events.

#### Slots

`tc-panel` distributes its children automatically:

| Slot | Description |
|---|---|
| `tc-panel-header` children | Placed above the body in a dedicated header slot. |
| Everything else | Rendered inside `.tc-panel-body` with `1rem` padding. |

#### CSS Custom Properties

| Property | Default | Description |
|---|---|---|
| `--bs-panel-bg` | `var(--tc-surface)` | Panel background color. |
| `--bs-panel-border-color` | `var(--tc-border)` | Border color when `bordered` is set. |
| `--bs-panel-body-padding` | `1rem` | Padding around the body content area. |

#### Usage

```html
<!-- Plain panel (no border) -->
<tc-panel>
    <p>Body content here.</p>
</tc-panel>

<!-- Bordered panel -->
<tc-panel bordered>
    <p>Content with a 1px hairline border.</p>
</tc-panel>

<!-- Panel with header -->
<tc-panel bordered>
    <tc-panel-header heading="Settings" icon="Settings"></tc-panel-header>
    <p>Body content below the header.</p>
</tc-panel>

<!-- Header with action slot -->
<tc-panel bordered>
    <tc-panel-header heading="Recent Activity" icon="Activity">
        <button slot="action" class="btn btn-sm btn-outline-secondary">View all</button>
    </tc-panel-header>
    <ul>
        <li>Deploy completed</li>
        <li>PR merged</li>
    </ul>
</tc-panel>
```

---