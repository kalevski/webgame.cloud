---
component: tc-module-access
---

### tc-module-access

A single role's live permission editor: name, quota limits, and the permission catalog grouped by domain prefix into toggle-chip cards. Presentational — never fetches or persists; feed it `role` / `permissions` / `limitable-resources` as JS properties and it fires `tc-change` with the full draft on every edit. No role picker, no bindings, no filter box, no footer buttons — the host owns which role is being edited, any surrounding navigation, and persistence entirely.

**Tag:** `tc-module-access`

**Attributes**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `owner-role-id` | string | `'owner'` | Id treated as the reserved, read-only "owner" role (full permission catalog, no editable form) |

**JS Properties**

| Property | Type | Description |
|----------|------|-------------|
| `roleData` | `ModuleAccessRole \| null` | `{ id, name, builtin?, permissions: string[], limits?: Record<string, number> }`. The role being edited. `null` renders an empty state. (Not named `role` — that collides with the native `HTMLElement.role` ARIA property.) |
| `permissions` | `string[]` | Full permission-key catalog, e.g. `"project.create"`. Grouped into cards by the text before the first `.` (the "domain"). |
| `limitableResources` | `ModuleAccessLimitableResource[]` | `{ key, label }[]` — one numeric quota input per entry. |
| `permissionGroupLabels` | `Record<string, string>` | Optional override for a domain's display label (defaults to the capitalised prefix, e.g. `admin` → `Admin`). |

**Events**

| Event | Detail | Description |
|-------|--------|-------------|
| `tc-change` | `{ role: ModuleAccessRoleDraft }` | Fired on every edit — name input, a limit input, a permission chip toggle, or a group's all/none bulk toggle. `ModuleAccessRoleDraft` is `{ id: string, name: string, permissions: string[], limits: Record<string, number> }`, read live off the form. The host owns when/whether to persist it. |

**Slots:** none — content is driven entirely by the properties above.

```html
<tc-module-access id="access" owner-role-id="owner"></tc-module-access>
<script>
    const el = document.querySelector('#access')
    el.permissions = ['admin.settings.read', 'admin.settings.write', 'project.create', 'project.read']
    el.limitableResources = [{ key: 'projects', label: 'Projects' }]
    el.roleData = { id: 'member', name: 'Member', permissions: ['project.read'], limits: { projects: 5 } }

    el.addEventListener('tc-change', (e) => {
        // e.detail.role is the current live draft — persist it however/whenever you like
        console.log(e.detail.role)
    })
</script>
```

---