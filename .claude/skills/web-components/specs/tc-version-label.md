---
component: tc-version-label
---

### tc-version-label

Corner build / version stamp — a compact JetBrains Mono inline label that shows version, build hash, and branch name separated by `·` dots.

**Tag:** `tc-version-label`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `version` | string | — | Semver or release tag. Rendered as `v{version}`. |
| `build` | string | — | Build hash or commit identifier. |
| `branch` | string | — | Git branch name. Rendered with the ink accent (`--bs-version-label-branch-color`). |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `version` | `string` | Reflects the `version` attribute. |
| `build` | `string` | Reflects the `build` attribute. |
| `branch` | `string` | Reflects the `branch` attribute. |

**Events:** none — `tc-version-label` is purely presentational.

**Slots:** none — all content is driven by attributes.

**Custom properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-version-label-color` | `var(--tc-text-muted)` | Default text color. |
| `--bs-version-label-font-size` | `0.6875rem` | Label font size. |
| `--bs-version-label-font-weight` | `500` | Label font weight. |
| `--bs-version-label-letter-spacing` | `0.04em` | Label letter spacing. |
| `--bs-version-label-bg` | `transparent` | Background color. |
| `--bs-version-label-border-color` | `var(--tc-border)` | 1px hairline border color. |
| `--bs-version-label-padding-y` | `0.1875rem` | Vertical padding. |
| `--bs-version-label-padding-x` | `0.5rem` | Horizontal padding. |
| `--bs-version-label-sep-color` | `var(--tc-border-strong)` | Separator `·` dot color. |
| `--bs-version-label-version-color` | `var(--tc-text)` | Version segment text color. |
| `--bs-version-label-build-color` | `var(--tc-text-muted)` | Build segment text color. |
| `--bs-version-label-branch-color` | `var(--tc-app-accent)` | Branch segment text color (ink accent). |
| `--bs-version-label-gap` | `0.25rem` | Gap between segments. |

```html
<!-- Version only -->
<tc-version-label version="1.2.3"></tc-version-label>

<!-- Version + build -->
<tc-version-label version="1.2.3" build="a4f9c12"></tc-version-label>

<!-- All three segments -->
<tc-version-label version="2.0.0" build="deadbeef" branch="main"></tc-version-label>

<!-- HUD corner stamp — override colors to suit a dark surface -->
<tc-version-label
  version="0.9.1"
  build="7b3a8c2"
  branch="release"
  style="--bs-version-label-border-color: rgba(255,255,255,0.12); --bs-version-label-color: rgba(255,255,255,0.5);"
></tc-version-label>
```

---