---
component: tc-brief-card
---

### tc-brief-card

A card displaying a task/brief with a difficulty indicator, optional icon, body copy, and a two-column meta footer. Dispatches `tc-click` when activated.

**Tag:** `tc-brief-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `brief-id` | string | — | Identifier for the brief. Included in the `tc-click` event detail as `id`. Avoids clobbering the native `id` attribute. |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | `'easy'` | Controls the difficulty indicator badge: easy=success, medium=warning, hard=danger. |
| `title` | string | — | Card title text. Takes precedence over `slot="title"` children. Used as the button's `aria-label` when interactive. |
| `body` | string | — | Body copy text. Takes precedence over `slot="body"` children. |
| `meta-left` | string | — | Left-side meta text in the footer row. Monospace, muted. |
| `meta-right` | string | — | Right-side meta text in the footer row. Monospace, muted, right-aligned. |
| `icon` | string | — | Lucide icon name in PascalCase (e.g. `"FileText"`, `"Shield"`). Renders as inline SVG in the header. |
| `clickable` | boolean | `false` | Enables interactive affordance (hover lift, pointer cursor) when listening via `addEventListener('tc-click', …)` without setting `onClick`. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `briefId` | `string \| null` | Reflects the `brief-id` attribute. |
| `difficulty` | `BriefCardDifficulty` | Reflects the `difficulty` attribute. |
| `title` | `string \| null` | Reflects the `title` attribute. |
| `body` | `string \| null` | Reflects the `body` attribute. |
| `metaLeft` | `string \| null` | Reflects the `meta-left` attribute. |
| `metaRight` | `string \| null` | Reflects the `meta-right` attribute. |
| `icon` | `string \| null` | Reflects the `icon` attribute. |
| `clickable` | `boolean` | Reflects the `clickable` attribute. |
| `onClick` | `(() => void) \| null` | Optional callback fired on activation. Setting a non-null value enables the interactive visual affordance. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-click` | `{ id: string \| null }` | Fired when the card is clicked or activated via keyboard (Enter/Space). `id` is the value of `brief-id`. |

**Slots**

| Slot | Description |
|------|-------------|
| `icon` | Rich icon content for the header. Used when the `icon` attribute is absent. |
| `title` | Rich title content. Used when the `title` attribute is absent. |
| `body` | Rich body content. Used when the `body` attribute is absent. |
| `meta-left` | Rich left-side meta content. Used when the `meta-left` attribute is absent. |
| `meta-right` | Rich right-side meta content. Used when the `meta-right` attribute is absent. |

**CSS custom properties (theming)**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-brief-card-bg` | `var(--tc-surface)` | Card background |
| `--bs-brief-card-border-color` | `var(--tc-border)` | 1px hairline border colour |
| `--bs-brief-card-shadow` | `var(--tc-shadow-sm)` | Resting shadow |
| `--bs-brief-card-shadow-hover` | `var(--tc-shadow-hover)` | Hover lift shadow |
| `--bs-brief-card-title-color` | `var(--tc-text)` | Title text colour |
| `--bs-brief-card-body-color` | `var(--tc-text-muted)` | Body and meta text colour |
| `--bs-brief-card-id-color` | `var(--tc-text-faint)` | ID micro-label colour |

```html
<!-- Static difficulty variants -->
<tc-brief-card
    brief-id="TASK-001"
    difficulty="easy"
    title="Write docs"
    body="Document the new API surface."
    meta-left="2 pts"
    meta-right="Docs"
></tc-brief-card>

<tc-brief-card
    brief-id="TASK-042"
    difficulty="medium"
    icon="Shield"
    title="Add rate limiting"
    body="Protect public endpoints with a sliding-window rate limiter."
    meta-left="5 pts"
    meta-right="Security"
></tc-brief-card>

<tc-brief-card
    brief-id="TASK-099"
    difficulty="hard"
    title="Database sharding"
    body="Design the migration strategy for sharding the users table."
    meta-left="21 pts"
    meta-right="Infra"
></tc-brief-card>

<!-- Clickable card via event listener + clickable attribute -->
<tc-brief-card
    id="my-card"
    brief-id="TASK-012"
    difficulty="medium"
    icon="Zap"
    clickable
    title="Enable SSR"
    body="Add SSR support to improve first-contentful-paint."
    meta-left="8 pts"
    meta-right="Performance"
></tc-brief-card>
<script>
    document.getElementById('my-card').addEventListener('tc-click', e => {
        console.log('clicked brief id:', e.detail.id)
    })
</script>

<!-- Clickable card via onClick property -->
<tc-brief-card id="js-card" brief-id="TASK-013" difficulty="hard" title="Optimise queries"></tc-brief-card>
<script>
    document.getElementById('js-card').onClick = () => console.log('card clicked')
</script>

<!-- Slotted content -->
<tc-brief-card brief-id="TASK-055" difficulty="hard" meta-left="21 pts" meta-right="Infra">
    <span slot="icon"><!-- your SVG --></span>
    <strong slot="title">Custom rich title</strong>
    <em slot="body">Body with <a href="#">markup</a>.</em>
</tc-brief-card>
```

---