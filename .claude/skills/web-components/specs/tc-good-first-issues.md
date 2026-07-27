---
component: tc-good-first-issues
---

### tc-good-first-issues

Bordered list-group of GitHub good-first-issue items. Each row links to the issue URL, shows the repo slug, a row of label chips (with optional color dot), and a meta line with comment count and relative update time. Purely presentational — no open/close logic. Set items via the `issues` JS property.

**Tag:** `tc-good-first-issues`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | string | — | Plain-text header above the list. When omitted and no `slot="title"` children are present, the header is hidden entirely. |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `title` | `string` | Reflects the `title` attribute. |
| `issues` | `GoodFirstIssue[]` | Array of issue objects to render. Setting this property triggers a re-render. |
| `onIssueClick` | `((issue: GoodFirstIssue) => void) \| null` | Optional callback fired alongside the `tc-issue-click` event when a link is activated. |

**GoodFirstIssue shape**

```ts
interface GoodFirstIssue {
    title: string
    url: string
    repo?: string
    labels?: { name: string; color?: string }[]
    comments?: number
    updatedAt?: string  // ISO 8601 date string
}
```

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-issue-click` | `{ issue: GoodFirstIssue }` | Fired (bubbles, composed) when a row title link is activated. The link still navigates normally — this event is a side-effect hook. |

**Slots**

| Slot | Description |
|------|-------------|
| `title` | Rich header content. Used when the `title` attribute is absent. Rendered inside `.tc-good-first-issues-title`. |
| `empty` | Content shown when `issues` is empty. Falls back to a default message when omitted. Rendered inside `.tc-good-first-issues-empty`. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-good-first-issues-border` | `var(--tc-border)` | Outer frame border color. |
| `--bs-good-first-issues-bg` | `var(--tc-surface)` | Component background. |
| `--bs-good-first-issues-separator` | `var(--tc-slate-100)` | Hairline color between rows and header. |
| `--bs-good-first-issues-row-bg` | `var(--tc-surface)` | Row background at rest. |
| `--bs-good-first-issues-row-hover-bg` | `var(--tc-surface-hover)` | Row background on hover. |
| `--bs-good-first-issues-header-color` | `var(--tc-text)` | Header title text color. |
| `--bs-good-first-issues-link-color` | `var(--tc-text)` | Issue title link color at rest. |
| `--bs-good-first-issues-link-hover-color` | `var(--tc-accent)` | Issue title link color on hover (cyan accent). |
| `--bs-good-first-issues-repo-color` | `var(--tc-text-muted)` | Repo slug color. |
| `--bs-good-first-issues-meta-color` | `var(--tc-text-faint)` | Comment count + update time color. |
| `--bs-good-first-issues-chip-bg` | `var(--tc-surface-muted)` | Label chip background. |
| `--bs-good-first-issues-chip-border` | `var(--tc-border)` | Label chip border. |
| `--bs-good-first-issues-chip-color` | `var(--tc-text-muted)` | Label chip text color. |
| `--bs-good-first-issues-icon-size` | `0.8125rem` | Meta icon size (MessageSquare, Clock). |

**Examples**

```html
<!-- Basic usage -->
<tc-good-first-issues title="Open issues"></tc-good-first-issues>
<script>
document.querySelector('tc-good-first-issues').issues = [
    {
        title: 'Fix typo in README',
        url: 'https://github.com/org/repo/issues/1',
        repo: 'org/repo',
        labels: [{ name: 'good first issue', color: '#7057ff' }],
        comments: 2,
        updatedAt: '2026-06-10T12:00:00Z',
    },
]
</script>

<!-- Slotted title -->
<tc-good-first-issues>
    <span slot="title">🌱 <strong>Good first issues</strong></span>
</tc-good-first-issues>

<!-- Custom empty state -->
<tc-good-first-issues title="Contributions">
    <div slot="empty">All issues are taken — check back later.</div>
</tc-good-first-issues>

<!-- Listen for clicks -->
<tc-good-first-issues id="gfi" title="Issues"></tc-good-first-issues>
<script>
const el = document.getElementById('gfi')
el.issues = [{ title: 'My issue', url: 'https://...', repo: 'org/repo' }]
el.addEventListener('tc-issue-click', e => console.log('clicked:', e.detail.issue))
</script>
```

---