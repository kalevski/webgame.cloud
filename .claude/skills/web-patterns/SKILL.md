---
name: web-patterns
description: Layering and file-shape conventions for web/ in this repo — pages, modules, zustand slices, singleton services, apiFetch envelope, modal registry, strings, entitlements/paywall, tc-* custom elements, alias imports. Use this whenever adding or changing anything under web/src — a screen, component, store field, API call from the client, modal, copy change, or paywall gate — even if the user only says "add a page", "show X in the UI", or "add a button".
---

# Web patterns

Strict one-way layering — don't skip a layer:

```
pages/  →  modules/  →  state/*.slice.ts  →  services/*Service.ts  →  helpers/api.ts (apiFetch)
```

- **Page** (`pages/FooPage.tsx`): route shell only. Sets title/description via `usePageContext`, wraps `<AuthGuard secured>`, `export default wrapInMainLayout(FooPage)`. No data logic.
- **Module** (`modules/FooList.tsx`): feature UI. Store selectors, actions, modals, locks, `tc-*` elements. Nested sub-components declared inline in the same file above the default export.
- **Component** (`components/`): generic, store-agnostic, prop-driven (`LockChip`, `Loading`).
- **Slice** (`state/foo.slice.ts`): state + async actions; calls service, updates state, raises alerts.
- **Service** (`services/FooService.ts`): singleton wrapping `apiFetch`, one method per endpoint.

Style everywhere: no semicolons, single quotes, 4-space indent, trailing commas, **no comments**. Components are `const X: React.FC<Props> = ...` + `export default X`, props type inline above. String-union types over enums.

## Imports: aliases only

Cross-directory imports always use the tsconfig alias (`components/*`, `configs/*`, `contexts/*`, `helpers/*`, `hooks/*`, `layouts/*`, `modals`, `modules/*`, `pages/*`, `services/*`, `state`, `styles/*`, `types`); relative imports only within a directory. `state`, `types`, `modals` are single-file barrels (with `modals/*` wildcards also available — `useLock` imports `modals/keys` directly). Never import `@webgame-cloud/api/contracts` directly in slices/services — re-export through `web/src/types/<domain>.ts` + `types/index.ts` and import from `types`. The re-exports carry runtime VALUES too, not just types: `PERMISSIONS`, `LIMITABLE_RESOURCES`, `RESOURCE_LABELS`, `ROLE_SLOTS`, `OWNER_ROLE_ID`, `toRoleId`, `notificationBadge` all flow through `types`. Aliases are declared TWICE: `web/tsconfig.json` `paths` and `web/vite.config.ts` — a new alias must land in both. Routing imports come from `react-router` (v8), not `react-router-dom`.

## Store (zustand)

One store from per-domain slices. Slice file exports a `type FooSlice` (state fields + actions together) and `createFooSlice: StateCreator<AppStore, [], [], FooSlice>`. Register in `state/index.ts`: add to the `AppStore` intersection AND the spread inside `devtools`.

```ts
export type ProjectsSlice = {
    projects: Project[]
    projectsLoaded: boolean
    fetchProjects: () => Promise<void>
    createProject: (draft: ProjectDraft) => Promise<Project | null>
    deleteProject: (id: string) => Promise<boolean>
}
```

Actions return a success signal (`Promise<T | null>` / `Promise<boolean>`). Standard action body: call service → refresh state → `void get().refreshSession()` when the change affects entitlements/limits → success `addAlert`; failures go through a local `fail` helper:

```ts
const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })
```

**Selectors: one field per `useStore` call**, never `useStore(s => s)` or object destructuring:

```tsx
const projects = useStore((state) => state.projects)
const fetchProjects = useStore((state) => state.fetchProjects)
```

## Services + apiFetch

Singleton class: `private constructor`, `private static instance`, `static getInstance()`, default export. Methods `apiFetch<T>(path, init)` with `JSON.stringify` bodies and `encodeURIComponent` on path params.

`apiFetch` is the ONLY thing that talks to the API. It unwraps the REST envelope (`{ status: 'OK', data }` → `.data`; 204 → `undefined`) and on rejection parses the machine cause (`"limit_reached,projects,3"`) via `parseErrorCause`, resolving copy from `STRINGS.errors[code]` (string used verbatim, function called with params, unknown → `fallback`). The thrown `Error.message` is already user-ready copy — slices just `addAlert` it. 403s additionally trigger the registered forbidden handler (session refresh). Consequence: services and slices never construct user-facing error text.

## Strings

ALL copy lives in `configs/strings.ts` — `STRINGS = { ... } as const`, sectioned by feature (`projects`, `modal`, `nav`, `upgrade`, `validation`, ...). Parametric copy is a function: `taskCount: (n: number) => \`${n} task${n === 1 ? '' : 's'}\``. Access via `useStrings()` → `const { t } = useStrings()`, alias sections locally (`const p = t.projects`). Error copy is a separate `ERROR_MESSAGES` const above `STRINGS` (referenced as `errors: ERROR_MESSAGES`) with `satisfies Record<ApiErrorCode | 'fallback', ...>` — adding a server error code without copy fails typecheck. New feature → new `STRINGS` section; never inline English in components.

## Modals

Four files involved: `modals/registry.tsx` is the engine (`ModalContext`, `ModalWindow`, and ALL the hooks — `useModalOpen`, `useModalClose`, `useModalInput`, `useModalIsOpen`); a new modal touches the other three — key in `modals/keys.ts` (`MODAL.CREATE_PROJECT: 'create-project'`), component file `modals/CreateProjectModal.tsx` (exports its result type), and a `<ModalWindow modalKey={...} title={t.modal...}>` entry in `modals/index.tsx` (the render list + partial barrel). Import paths matter: modules use the barrel (`import { MODAL, useModalOpen } from 'modals'`), but modal components import from `'./registry'`/`'./keys'` — and `useModalIsOpen` is ONLY in the registry, the barrel doesn't re-export it. Open from a module with a typed callback:

```tsx
const openConfirmDelete = useModalOpen<Project, Project>(MODAL.CONFIRM_DELETE_PROJECT, async (confirmed) => {
    if (confirmed) await deleteProject(confirmed.id)
})
```

Inside the modal: `useModalIsOpen(key)`, `useModalInput<T>(key)`, `useModalClose()` — `closeModal(payload)` on confirm, `closeModal(null)` on cancel. One modal open at a time. Form validity gates use `helpers/validation.ts` (`isRequiredText`, `isIntInRange`, `isOneOf`) with copy from `t.validation`.

## Auth, gating, paywall

- Bootstrap: `modules/Init.tsx` calls `fetchAuth` on mount (which registers the 403 forbidden handler and probes the session) and re-runs `refreshSession` on window focus. Data hooks assume the session loaded first.
- Identity: `useAuth()` → `isOwner`/`isMember`/`isPaid` from server-provided SLOTS (roles are runtime rows — the client never knows role names).
- Actions: `useCan(permission)`; quotas: `useResourceLimits()` (lives in `hooks/useCan.ts`). Every admin/platform screen gates READ and WRITE with separate keys (`invoice.read` vs `invoice.write`, `email.outbox.read` vs `email.send`/`email.template.write`/…): the page guard and nav entry use the read key, header actions and row actions the write key. A read-only viewer must not see a dead button — drop the action from the `tc-action-header` `actions` array, and swap an actionable `tc-action-row-list` for a plain `tc-data-list` (it always renders a trailing button, even with no `label`).
- Paywall: `configs/entitlements.ts` maps a permission to `{ feature }` (`ENTITLEMENTS['project.export'] = { feature: 'export' }`); quota locks use a standalone entitlement constant instead (`PROJECT_LIMIT_ENTITLEMENT`). `useLock(permission)` / `useLimitLock(reached, entitlement)` return a `Lock` whose `open()` tracks `PAYWALL_CLICK` and opens `MODAL.UPGRADE`. Wrap the trigger in `<LockedAction lock={lock} onClick={...}>` (tracks `PAYWALL_VIEW` once). Quota UI: `<LimitMeter>` + `<UpgradeNudge>`. Upgrade copy comes from `t.upgrade.features[feature]`.
- Per-page auth is `<AuthGuard secured [permission=...]>` in the page, not in the router.
- Analytics: `configs/analytics.ts` (`EVENT` catalog) + `helpers/analytics.ts` (`trackEvent`, `trackOnce`, `trackPageView`). Already wired centrally — `apiFetch` emits `API_ERROR`, `Router` emits page views, `main.tsx` runs `initAnalytics`. A new feature only adds explicit events for its own key interactions.

## tc-* custom elements

`@toolcase/web-components`, registered once in `main.tsx`. Quirks to preserve:

- `className` works (React 19); **boolean props must be `value || undefined`** so the attribute is absent when off: `disabled={!valid || undefined}`.
- Kebab-case attributes (`title-text`, `icon-name`, `columns-md`); numeric props pass either way — `rows="3"` and `columns={2}` both appear in the codebase.
- Object props and custom events go through `useTc<HTMLElement>(props, events)` from `@toolcase/web-components/react` — assign the returned ref. Event-only binding: `useTcEvents`. Payload extraction: `detailValue` helper, or manually `(event as CustomEvent<T>).detail`.
- Form elements are read/reset imperatively through refs (`HTMLElement & { value?: string }`).
- **Never let a value the user is typing reach the effect that writes that input's `.value`.** An effect
  that seeds a field must depend on the field's IDENTITY (`isOpen`, the edited entity, `row.rowId`), never
  on its live value — otherwise every keystroke writes the state back into the DOM, the caret jumps to the
  end and the field reads as "losing focus". When `exhaustive-deps` forces the value into the deps array,
  keep the deps and guard the body instead:
  ```tsx
  const syncedRowId = useRef('')
  useEffect(() => {
      if (syncedRowId.current === row.rowId) return
      syncedRowId.current = row.rowId
      const frame = requestAnimationFrame(() => { labelInput.current.value = row.label })
      return () => cancelAnimationFrame(frame)
  }, [row.rowId, row.label, row.type, labelInput, typeSelect])
  ```
  Two related shapes to avoid for the same reason: `key={index}` on a list of inputs (a re-order remounts
  them mid-edit) and declaring a `React.FC` inside another component's body (it remounts on every render).
  `useTc` refs and `useModalInput` results ARE stable, so listing them in deps is harmless.

## Tables (`tc-advanced-table`)

Body rows are a **trusted HTML string** fed through the `rows` property — never React children (the element owns its `<tbody>` and would move them out from under the reconciler). Interpolate every value through `escapeHtml` from `helpers/html`.

Row actions (buttons, `tc-icon-button`s, links) go in a right-aligned last cell **wrapped in `<span class="table-actions">`** — the shared rule in `styles/components/_table-actions.scss` that gives them their gap. Without the wrapper the controls sit flush against each other:

```ts
`<td style="text-align:right"><span class="table-actions">` +
`<tc-icon-button icon="History" variant="secondary" size="small" outline data-id="${escapeHtml(row.id)}" data-action="trail" label="${escapeHtml(t.x.trail)}" title="${escapeHtml(t.x.trail)}"></tc-icon-button>` +
`<tc-icon-button icon="CirclePlus" variant="primary" size="small" outline data-id="${escapeHtml(row.id)}" data-action="edit" label="${escapeHtml(t.x.edit)}" title="${escapeHtml(t.x.edit)}"></tc-icon-button>` +
`</span></td>`
```

Clicks are handled by ONE delegated handler on the module root (`onClick` on the wrapping `div`), resolving `event.target.closest('[data-id]')` and branching on `dataset.action` — the row string cannot carry React handlers. `tc-icon-button` is the icon-only control (it has no spec file but is a real element; see `UsersAdmin.tsx`). Filters/pagination are server-side: `onFilterChange`/`onPageChange` call the slice with `{ ...filter, offset: 0 }` and the slice owns `filters`, `total` and `loading`.

**Never round-trip a filter value back into `filterValues` from React state.** Every property assignment (`rows`, `columns`, `filters`, `filterValues`) makes the element rebuild its toolbar and `<tbody>` from scratch, and `useTc` re-applies props on every render — so a `setState` per keystroke rebuilds the input from a value one render stale, dropping and reordering characters, not just losing focus. Keep the query in a `ref`, assign `filterValues`/`rows` on the element inside the `onFilterChange` handler (synchronously, while the input is focused — that is the path the component's focus/caret restore is built for), and never `setState` on the typing path. The same rule covers any `<input>` interpolated into a `rows` string. Worked fix: `modules/RetentionAdmin.tsx`; full write-up: `docs/known-problems/filter-input-loses-focus.md`.

## Checklist — new feature screen `Foo`

1. Contract types in `api/src/contracts/foo.ts` + barrel + error codes (see api-patterns skill for the server side).
2. `web/src/types/foo.ts` re-export + `types/index.ts`.
3. `services/FooService.ts` (singleton, apiFetch per endpoint).
4. `state/foo.slice.ts` + register in `state/index.ts` (intersection + spread).
5. `configs/strings.ts` — new `foo` section (+ error copy).
6. Modals: `modals/keys.ts` + component + `modals/index.tsx` entry.
7. If gated/paid: `configs/entitlements.ts` + `t.upgrade.features` copy.
8. `modules/FooList.tsx`.
9. `pages/FooPage.tsx` (`AuthGuard`, `wrapInMainLayout`).
10. Route in `Router.tsx` (`lazy()` if heavy) + nav entry (`strings.nav` + `modules/SidebarMenu.tsx`).
11. `styles/modules/_foo.scss`, registered in the barrel `styles/modules/_index.scss` (`@use 'foo'`) — NOT in `app.scss`, which only pulls the four barrels. Partials open with `@use 'abstracts' as *` for tokens/mixins (`$space-*`, `@include down($bp-md)`).

Verify in the browser at `localhost:6001` — there is no test suite; `npm run typecheck` then exercise the screen manually. `npx react-doctor web` (Node 24) audits the workspace and must stay at 0 diagnostics: hoist pure helpers and `Intl` formatters to module scope (`helpers/money.ts` already caches currency formatters), never compute or side-effect inside a `setState` updater, single-pass `flatMap` instead of `.filter().map()`, and mark a delegation wrapper `<div role="presentation" onClick={...}>` so the a11y rules see it is not itself interactive.
