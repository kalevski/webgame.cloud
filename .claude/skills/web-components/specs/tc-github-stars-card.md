---
component: tc-github-stars-card
---

### tc-github-stars-card

GitHub repository card showing stars, forks, contributors, version, and a CTA link. Pre-fetched stats are supplied via the `stats` JS property; live stats are fetched from the GitHub REST API when the `fetch-live` attribute is present. Dispatches `tc-stats` once stats resolve and `tc-cta-click` when the CTA is activated.

**Tag:** `tc-github-stars-card`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `owner` | string | — | GitHub repository owner (user or org). |
| `repo` | string | — | GitHub repository name. |
| `fetch-live` | boolean | false | When present, fetches live stats from `https://api.github.com/repos/<owner>/<repo>` on connect and re-fetches when `owner`/`repo` change. Shows a skeleton while pending. |
| `cta-label` | string | `"View on GitHub"` | Label text for the CTA link. |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `stats` | `GithubStatsData` | `{}` | Pre-fetched stats object `{ stars?, forks?, contributors?, version? }`. Used as the initial/fallback value; live fetch values are merged on top when `fetch-live` is set. |
| `onStats` | `((stats: GithubStatsData) => void) \| null` | `null` | Optional callback fired when stats resolve (same timing as the `tc-stats` event). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-stats` | `{ stats: GithubStatsData }` | Fired (bubbles, composed) once live stats resolve from the GitHub API. Also calls `onStats` if set. |
| `tc-cta-click` | `{ owner: string, repo: string }` | Fired (bubbles, composed) when the CTA link is activated. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-github-stars-card-bg` | `var(--tc-surface)` | Card background color. |
| `--bs-github-stars-card-border` | `1px solid var(--tc-border)` | Card border. |
| `--bs-github-stars-card-shadow` | `var(--tc-shadow-sm)` | Resting box-shadow. |
| `--bs-github-stars-card-gh-icon-size` | `1rem` | Size of the GitHub logo icon. |
| `--bs-github-stars-card-gh-icon-color` | `var(--tc-text-muted)` | Color of the GitHub logo icon. |
| `--bs-github-stars-card-slug-color` | `var(--tc-text)` | Color of the owner/repo slug link. |
| `--bs-github-stars-card-slug-font-size` | `0.875rem` | Font size of the owner/repo slug. |
| `--bs-github-stars-card-stat-icon-size` | `0.875rem` | Size of stat glyph icons. |
| `--bs-github-stars-card-stat-icon-color` | `var(--tc-text-muted)` | Color of stat glyph icons. |
| `--bs-github-stars-card-stat-value-color` | `var(--tc-text)` | Color of the numeric stat values. |
| `--bs-github-stars-card-stat-value-font-size` | `0.9375rem` | Font size of the numeric stat values. |
| `--bs-github-stars-card-stat-label-color` | `var(--tc-text-muted)` | Color of the stat labels (stars, forks, etc.). |
| `--bs-github-stars-card-cta-bg` | `linear-gradient(135deg, var(--tc-app-accent), #2b3a51)` | CTA button background gradient. |
| `--bs-github-stars-card-cta-color` | `#fff` | CTA button text color. |
| `--bs-github-stars-card-cta-font-size` | `0.875rem` | CTA button font size. |
| `--bs-github-stars-card-error-color` | `var(--tc-danger)` | Error message text color. |

```html
<!-- Static stats via JS property -->
<tc-github-stars-card id="card" owner="toolcase" repo="toolcase" cta-label="Star on GitHub"></tc-github-stars-card>
<script>
  const card = document.getElementById('card')
  card.stats = { stars: 4800, forks: 312, contributors: 47, version: 'v3.2.1' }
</script>

<!-- Live fetch from GitHub API -->
<tc-github-stars-card
  owner="microsoft"
  repo="vscode"
  fetch-live
  cta-label="View on GitHub"
></tc-github-stars-card>

<!-- Live fetch with pre-fetched fallback and event listeners -->
<tc-github-stars-card id="hybrid" owner="kalevski" repo="toolcase" fetch-live></tc-github-stars-card>
<script>
  const el = document.getElementById('hybrid')
  el.stats = { stars: 100 }  // shown immediately while fetch resolves
  el.onStats = stats => console.log('stats resolved', stats)
  el.addEventListener('tc-stats', e => console.log('tc-stats', e.detail))
  el.addEventListener('tc-cta-click', e => console.log('tc-cta-click', e.detail))
</script>
```