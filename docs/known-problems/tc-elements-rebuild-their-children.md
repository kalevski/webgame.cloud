# tc-* elements rebuild their light DOM, and React does not know

## What you see

Three different symptoms, one cause:

1. **White screen.** `NotFoundError: Failed to execute 'insertBefore' on 'Node'` in the console. Seen when
   the create-project wizard advanced from step 1 to step 2 and mounted a *new* `slot="footer"` button.
2. **Rows that never appear.** A list inside `tc-group` (the asset list) rendered nothing after an upload
   until the page was reloaded — the group's badge said `1` while its body was empty.
3. **Rows in the wrong group.** After deleting an asset, the surviving row rendered under a different
   category heading and the badges disagreed with the contents, until reload.

## Why

Several `tc-*` elements build their real structure by assigning `this.innerHTML = …` and then re-appending
the light-DOM children they captured earlier. `tc-modal` is the clearest case:

```js
captureSlots() {
    this._bodyNodes   = childNodes without slot="footer"
    this._footerNodes = childNodes with    slot="footer"
}
render()        { this.innerHTML = '<div class="modal-dialog">…<div class="modal-body"></div><div class="modal-footer"></div>…' }
_mountContent() { this._bodyNodes.forEach(n => body.appendChild(n)); this._footerNodes.forEach(n => footer.appendChild(n)) }
```

So React's children are **moved** out of the element they were rendered into. React still believes they are
direct children of `<tc-modal>`. The next insert or remove targets a parent/sibling pair that no longer
exists together, and the reconciler throws. `tc-group` behaves the same way on every attribute change
(including its own `badge`), which is why a row appended after mount is silently destroyed.

## The fix that is in place

`web/src/lib/tc.ts` wraps every unslotted child in **one stable `display: contents` div**. The element moves
that div; React keeps inserting and removing *inside* it, where its bookkeeping stays valid.

The wrapper is now rendered **unconditionally** — that is the part that was missing. It used to be:

```ts
unslotted.length > 0 ? React.createElement('div', { style: { display: 'contents' } }, unslotted) : null
```

An element that mounted with zero children (an empty asset group, a list still loading) got no wrapper, so
the first child to arrive later was appended to the host and wiped by the element's next render. It is now
always created.

## Rules that still apply

- **Slotted children must stay direct children.** Elements look for `slot="…"` in their immediate light DOM,
  so `withSlot()` renders a `display: contents` span *at the top level*. That span is stable — but the set
  of slotted children is not managed for you.
- **Never conditionally mount a `slot="…"` child.** Render it always and toggle `hidden`
  (`[hidden] { display: none !important }` ships in the package stylesheet) or swap its label and handler.
  `CreateProjectModal`'s footer is the worked example: one Back button that hides on step 0, one primary
  button whose label and `onClick` change, one Cancel.
- **Key a group by its content count when the element re-renders on a count attribute.** `FileList` uses
  `key={`${group.id}:${group.files.length}`}` so a group that changes size remounts and re-captures its
  children instead of relying on the element preserving them.

## Where it may still bite

Any module that renders a variable number of React children into a `tc-*` element whose observed attributes
change with that number. `FileList` is fixed. Audit before adding another.
