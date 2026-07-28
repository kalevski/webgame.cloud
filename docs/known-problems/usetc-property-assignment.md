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

## 3. Do not set `value` when you mean `defaultValue`

`tc-tag-input` treats a defined `value` as *controlled* and then ignores its own internal edits — chips stop
appearing entirely. `EditAssetTagsModal` seeds the field with `element.defaultValue = tags` for exactly this
reason.
