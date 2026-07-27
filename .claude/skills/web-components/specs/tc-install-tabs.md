---
component: tc-install-tabs
---

### tc-install-tabs

Tabbed install command block for npm, yarn, pnpm, and bun. Shows the correct install command per manager, with a copy button that briefly confirms with a check icon. Keyboard navigable via roving tabindex (ArrowLeft/Right, Home/End, Enter/Space). No shadow DOM — composable with light-DOM.

**Tag:** `tc-install-tabs`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `package` | string | `''` | Package name to install (required). |
| `dev` | boolean | absent | Adds the dev-dependency flag to every command (`-D` / `--save-dev`). |
| `global` | boolean | absent | Adds the global-install flag to every command (`-g` / `global add`). |
| `default-manager` | string | first manager | Which manager tab is active on first render (`npm`, `yarn`, `pnpm`, or `bun`). |

**JS Properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `managers` | `InstallManager[]` | `['npm','yarn','pnpm','bun']` | Limits and orders the visible manager tabs. Set via JS; not reflected as an attribute. |
| `onCopy` | function | `null` | Optional callback fired after a successful clipboard write — receives `{ manager, command }`. |
| `onChange` | function | `null` | Optional callback fired when the active tab changes — receives `{ manager }`. |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-copy` | `{ manager: InstallManager, command: string }` | Fired after the copy button successfully writes to the clipboard. |
| `tc-change` | `{ manager: InstallManager }` | Fired when the active manager tab changes. |

**CSS Custom Properties**

| Property | Default | Description |
|----------|---------|-------------|
| `--bs-install-tabs-tab-row-border` | `1px solid var(--tc-border)` | Bottom hairline under the tab row. |
| `--bs-install-tabs-tab-color` | `var(--tc-text-muted)` | Inactive tab text color. |
| `--bs-install-tabs-tab-color-active` | `var(--tc-text)` | Active tab text color. |
| `--bs-install-tabs-tab-active-underline` | `2px solid var(--tc-app-accent)` | 2px ink underline on the active tab. |
| `--bs-install-tabs-panel-bg` | `var(--tc-ink)` | Code panel background. |
| `--bs-install-tabs-code-color` | `var(--tc-text-inverse)` | Command text color. |
| `--bs-install-tabs-code-font-size` | `0.875rem` | Command font size. |
| `--bs-install-tabs-copy-color` | `var(--tc-text-muted)` | Copy button icon color. |
| `--bs-install-tabs-copy-hover-bg` | `rgba(255,255,255,0.08)` | Copy button hover fill. |
| `--bs-install-tabs-copy-copied-color` | `#99cc88` | Copy button color during confirmed state. |

```html
<!-- Basic install -->
<tc-install-tabs package="@toolcase/web-components"></tc-install-tabs>

<!-- Dev dependency -->
<tc-install-tabs package="vitest" dev></tc-install-tabs>

<!-- Global install -->
<tc-install-tabs package="typescript" global></tc-install-tabs>
```

```html
<!-- Limit managers via JS property -->
<tc-install-tabs id="limited" package="@toolcase/base" default-manager="pnpm"></tc-install-tabs>
<script>
  document.getElementById('limited').managers = ['npm', 'pnpm']

  document.getElementById('limited').addEventListener('tc-copy', e => {
    console.log('Copied:', e.detail.command)
  })
  document.getElementById('limited').addEventListener('tc-change', e => {
    console.log('Active manager:', e.detail.manager)
  })
</script>

---