# useTc assigns properties — two traps

`useTc(props, events)` assigns every entry of `props` as a **property** on the custom element, and re-runs
that assignment on every commit (`el[key] = value` whenever the value's identity changed). Two consequences
bite repeatedly.

## 1. `onChange` only works if the element has an `onChange` property

Most form elements expose one (`FormInput`, `CardOptions`, `IconPicker`, `ColorPicker`, `ExtendedSelect`,
`Toggle`, …) and call it alongside the `tc-change` event. **`tc-tag-input` does not.** It only dispatches
`tc-change`, so

```ts
useTc({ defaultValue: [], onChange: (v) => setTags(v as string[]) })   // silently never fires
```

assigns a dead property. The symptom is a field the user can type into whose value never reaches React —
the create-project wizard let you add asset categories, then failed on submit with *"Add at least one
category"*, and the bundle wizard saved rules with empty tag lists.

Correct wiring:

```ts
useTc<ValueElement>(
    { defaultValue: NO_TAGS },
    { 'tc-change': (event: Event) => setTags(detailValue<string[]>(event as CustomEvent) ?? []) }
)
```

Before wiring `onChange` on a new element, check that the element actually reads it; otherwise use the
event map.

## 2. An inline array or object in `props` resets the element on every render

`useTc` compares by identity. `{ defaultValue: [] }` is a new array each render, so the property is
re-assigned each render — and `tc-tag-input`'s `defaultValue` setter rebuilds its internal tag list:

```js
set defaultValue(v) {
    this._defaultValue = [...v]
    if (!this._isControlled()) this._internalTags = [...this._defaultValue]
    this.render()
}
```

So every state update wiped the chips the user had just added. The same shape silently blanked the packing
algorithm select in the bundle wizard: its `items` array was rebuilt each render, re-rendering the select
after `defaultValue` had already been applied.

**Hoist static arrays to module scope, `useMemo` derived ones.** `NO_TAGS`, `ENGINE_OPTIONS`,
`ALGORITHM_ITEMS` in the wizards are the pattern.

## 3. Never split one element's props between `useTc` and a `useEffect`

`useTc` re-applies its props on **every commit**. A `useEffect` re-applies only when its dependency array
changes. Give one element both and the two fall out of step the moment the element is replaced: `useTc`
re-assigns everything it owns to the new node, the effect does not, and whatever the effect owned is
silently missing.

`RealmDetail`'s *Hosted projects* table hit exactly this. `columns`/`filters`/`sort` went through `useTc`;
`rows`/`total`/`limit`/`offset`/`loading` went through an effect keyed on `[table, rows, total, loading,
filters.offset]`. The panel is gated on `useCan('admin.project.read')`, which resolves **asynchronously**,
so the table element mounts on a later commit than the one that first produced its rows. On that commit the
effect's dependencies were unchanged, so it never fired for the new node — the table rendered its column
headers (via `useTc`) above an empty body, and `element.total` stayed `0` while the store held the rows and
the network tab showed a healthy `200`.

It is timing-dependent, which is what makes it nasty: reload often enough, or catch a commit where `rows`
happens to change after the mount, and it looks fine.

**Rule: everything the element needs goes through `useTc`.** Reserve the effect for work that is genuinely
imperative and not a property — restoring focus and caret to the search input after a rebuild is the only
legitimate use left in `RealmDetail` and `ProjectDirectory`.

```ts
const table = useTc<FilterableTable>({
    columns: useStableValue(projectColumns(p, COLUMN_KEYS)),   // identity-stable, see trap 2
    filterValues: useStableValue(filterState.current),
    rows, total, limit: PAGE_SIZE, offset, loading,            // primitives: compare by value
    onFilterChange, onSortChange, onPageChange,
})
```

`hooks/useStableValue.ts` is the shared `useMemo`-on-JSON helper (it was a private const inside
`components/AdvancedTable.tsx`; it is now a hook so the hand-rolled tables can use it too).
`components/AdvancedTable.tsx` was always built this way, which is why the tables using it never showed the
bug.

## 4. Do not set `value` when you mean `defaultValue`

`tc-tag-input` treats a defined `value` as *controlled* and then ignores its own internal edits — chips stop
appearing entirely. `EditAssetTagsModal` seeds the field with `element.defaultValue = tags` for exactly this
reason.
