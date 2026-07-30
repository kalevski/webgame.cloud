# Filter inputs lose focus and scramble characters while typing

**Symptom.** Type into the search/filter box of a `tc-advanced-table` and the field loses focus after a
character. Typing quickly is worse than losing focus: characters land out of order. Typing `audit` into
`/admin/retention` produced `ua` and then an empty result set.

**Status.** Fixed in `web/src/modules/RetentionAdmin.tsx` (client-side filtering) and
`web/src/modules/ProjectDirectory.tsx` (server-side filtering — see *The server-side variant* below). The
same pattern is still present in `UsersAdmin`, `Moderation`, `EmailOutbox`, `WebhooksAdmin`,
`InvoicesAdmin`, `MyInvoices` and `EnquiriesAdmin` — see *Where else* below.

## Why it happens

Three facts combine:

1. **`tc-advanced-table` re-renders itself on every property assignment.** Its `rows`, `columns`,
   `filters` and `filterValues` setters all call `_rerenderWithSlots()`, which throws away the toolbar and
   `<tbody>` and rebuilds them from `innerHTML`. The rebuilt filter input is a *different DOM node*.
2. **`useTc` re-applies props on every React render.** It runs `applyProps()` in a `useEffect` with no
   dependency array and assigns any prop whose value fails an identity check
   (`appliedRef.current[key] !== next`). Inline object/array literals — `columns: [...]`,
   `filters: [...]`, `filterValues: {...}` — are new identities on every render, so each render triggers
   *several* full re-renders of the element.
3. **The component restores focus and caret, but only from the state it captured *before* the render.**
   `_rerenderWithSlots()` reads `[data-filter-key]:focus` and `selectionStart` first, re-renders, then
   re-focuses and calls `setSelectionRange(caret, caret)`.

That third point is what turns "loses focus" into "scrambles characters". The usual React shape is:

```tsx
const [query, setQuery] = useState('')
useTc({ filterValues: { q: query }, rows, onFilterChange: (k, v) => setQuery(String(v)) })
```

The input's value now round-trips through React state, but the rebuild is driven by a value that is one
render behind:

1. Press `a` → the DOM input holds `a` → component emits `tc-filter-change` → `setQuery('a')` is scheduled.
2. Press `u` before React commits → the input holds `au`.
3. React commits render for `query === 'a'`. `useTc` assigns a fresh `filterValues` object, the element
   re-renders and rebuilds the input **from `filterValues.q`, which is `'a'`** — the `u` is discarded —
   and drops the caret to the offset captured before the render.
4. The `u` keystroke's own state update then lands and re-renders again, inserting it at the stale caret.

Net effect: characters are dropped, reordered, or land at the wrong offset, and the rows are filtered by a
query the user never typed.

## The fix

**Do not round-trip a filter value through React state.** The component already owns the input, already
re-renders itself, and already preserves focus and caret *when the re-render happens synchronously inside
the event, while the input is still focused*. Drive it through its own setters and keep React out of the
typing path entirely:

```tsx
const query = useRef('')

const table = useTc<FilterableTable>({
    columns: [...],
    filters: [{ key: 'q', label: t.common.search, type: 'text' }],
    // no `filterValues` prop — the element owns the live value
    rows: buildRows(filterTables(tables, query.current), canWrite, daysLabel),
    onFilterChange: (key, value) => {
        if (key !== 'q') return
        query.current = String(value ?? '')

        const element = table.current
        if (!element) return

        const matched = filterTables(tables, query.current)
        element.filterValues = { q: query.current }
        element.total = matched.length
        element.limit = Math.max(1, matched.length)
        element.rows = buildRows(matched, canWrite, daysLabel)
    },
})
```

Why this works: there is no `setState` on the keystroke path, so React never re-renders while typing. The
assignments run synchronously in the event handler, so each `_rerenderWithSlots()` captures the input while
it is genuinely focused with the current caret, and restores both. The value is never rebuilt from a stale
React snapshot because the only source of truth is the element itself.

`filterValues` is still assigned — the component needs it so that a later re-render (triggered by a data
refresh, say) rebuilds the toolbar with the right value — but it is assigned *from* the event, not from
React state.

Two supporting rules:

- **Never pass inline object/array literals to `useTc`** for `columns` / `filters` / `filterValues`.
  Every one is a new identity per render and therefore an extra full re-render of the element. Hoist them
  to module scope, memoise them, or accept them only where renders are rare.
- **The same hazard applies to any `<input>` you interpolate into a `rows` HTML string.** Editing must not
  trigger a React render, or the `<tbody>` is rebuilt under the user's cursor. In `RetentionAdmin` the
  per-table "keep for (days)" inputs record into a `ref` with no `setState`, and are read back on save.

## What not to do

- **Debouncing the `setQuery` call** only widens the race. The re-render still lands mid-typing for anyone
  who types continuously; it just fails less often, which makes it harder to reproduce.
- **Restoring focus yourself in a `useEffect`** as a substitute for the fix fights the component's own
  restore and still cannot recover characters that were discarded by a rebuild from a stale value. (It is
  still needed *in addition* to the fix for rebuilds triggered asynchronously by a fetch — see *The
  server-side variant*.)
- **Making the input a controlled React component** is not possible here: the element owns and re-renders
  its own toolbar markup.

## The server-side variant

Dropping `filterValues` from the `useTc` props is necessary but **not sufficient** when the query drives a
request. `ProjectDirectory.tsx` needed two more steps, verified by typing across a debounce boundary:

1. **Debounce the fetch** (`SEARCH_DEBOUNCE_MS`, 300 ms) so a burst of keystrokes is one request. Only the
   text filter is debounced; the selects fire immediately.
2. **Keep `rows`/`total`/`limit`/`offset`/`loading` out of both the `useTc` props and the JSX**, and assign
   them in one `useEffect` instead. When the response lands, React re-renders and *any* property assignment
   rebuilds the toolbar — including the input the user is still typing into. That rebuild happens
   asynchronously, outside the event, so the component's own focus/caret restore does not cover it. The
   effect therefore re-focuses the input and puts the caret back at the end when the last filter change came
   from the text field (a `typing` ref).

Without step 2 the first burst of characters survives and everything typed after the fetch resolves is
silently dropped — the field looks like it stopped accepting input.

## Where else this is still present

These modules still pass `filterValues` derived from React state (or from a store slice, which has the same
effect) into a `tc-advanced-table`:

| Module | Notes |
| --- | --- |
| `UsersAdmin.tsx` | `filterValues` in `useState`, client-side filtering — closest to the fixed case. |
| `Moderation.tsx` | `filterValues: auditFilters` from the store; the audit-log query is server-side. |
| `EmailOutbox.tsx` | `filterValues: filters` from the store. |
| `WebhooksAdmin.tsx` | `filterValues: deliveryFilters` from the store. |
| `InvoicesAdmin.tsx`, `MyInvoices.tsx`, `EnquiriesAdmin.tsx` | same store-driven shape. |

The server-side ones are less obviously broken because the re-render is deferred until the fetch resolves,
so a fast typist usually gets the keystroke in first — but the race is identical and shows up as a dropped
character or a stale result set under a slow API.

**Proposed fix for the rest:** apply the pattern above per module. For the server-side tables the query
still has to reach the slice (it drives the request), so keep the `ref` as the typing source of truth and
call the slice from the same handler — but drop `filterValues` from the `useTc` props and assign it on the
element instead, so the input is never rebuilt from the store's lagging copy. Worth doing as one sweep
rather than per module, since the shape is identical in all seven.
