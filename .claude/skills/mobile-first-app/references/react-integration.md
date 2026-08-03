# React 19 ↔ `tc-*` custom elements

Every item here was measured in a running app. They are cheap to avoid and expensive to
diagnose, because most fail at runtime with no type error and no console warning.

## 1. `className` works; booleans are the trap

Since React 19, `className` on a custom element **is** applied (React assigns it as the
`className` property, which reflects to `class`), so styling `tc-*` elements via `className`
is fine.

Booleans are not. These elements implement a boolean as:

```ts
set open(v) { this.toggleAttribute('open', v) }
```

and `toggleAttribute(name, undefined)` **toggles**. So:

```tsx
<tc-bottom-sheet open={isOpen || undefined} />   // ✗ a closing sheet RE-OPENS
<tc-action-bar stack={stack} />                  // ✗ if `stack` may be undefined
<tc-bottom-sheet open={isOpen} />                // ✓ explicit true/false
<tc-action-bar stack={stack === true} flat={flat === true} />   // ✓
```

Omitting the prop entirely is also fine. What is never fine is `undefined`.

The old advice — `x || undefined`, to stop React writing the attribute string `"false"` — is
now exactly wrong: React 19 assigns the **property** when the element defines one, so `false`
does the right thing.

Related: `dismissible="false"` written as a JSX **string** reaches the setter as the truthy
string `"false"`. Some elements coerce it (a tri-state attribute whose getter reads
`!== 'false'`); most do not. Prefer the boolean prop.

## 2. Re-parenting elements and `NotFoundError: removeChild`

`tc-button`, `tc-badge`, `tc-alert`, `tc-chip`, `tc-empty-state` and friends **move their
light-DOM children into an inner wrapper on connect**. React keeps believing those nodes are
parented to the host, so any DIRECT child that can *disappear* makes react-dom call
`host.removeChild(node)` on a node that now lives one level deeper. The `NotFoundError` lands
inside the commit and unmounts the tree to a blank screen — no error boundary catches it.

Two shapes cause it, and both look harmless:

```tsx
<tc-button>{label}{n > 0 ? ` (${n})` : ''}</tc-button>   // ✗ '' is NO CHILD → node deleted
<tc-alert>{cond && <p/>}<span>…</span></tc-alert>        // ✗ conditional direct child
```

Fixes:

```tsx
<tc-button>{n > 0 ? `${label} (${n})` : label}</tc-button>          // one interpolated string
<tc-alert><div>{cond && <p/>}<span>…</span></div></tc-alert>        // one stable wrapper
```

Rule of thumb: **pass a single child to a re-parenting element**, or use the variant that
takes its content as attributes (`tc-icon-button` over an icon-only `tc-button`).

A related a11y consequence: `aria-label` on a `tc-button` host is inert (the element observes
only its own attributes and never forwards ARIA to the inner `<button>`), so an icon-only
`tc-button` reports as unnamed. The fix is a `.visually-hidden` span **inside a single
wrapper element** — which is the same rule again.

## 3. Focus-safe instance props

The library's own React helper reassigns every instance prop on every render — including
freshly created `onChange` closures — and each assignment makes the element re-render its DOM,
destroying the focused `<input>` mid-typing.

Use a hook that (a) assigns a prop only when its value actually changed, (b) wraps function
props in a stable proxy that always calls the latest closure, and (c) re-attaches event
listeners when the element remounts:

```ts
import { useCallback, useEffect, useRef, useState } from 'react'

type InstanceProps = Record<string, unknown>
type Handlers = Record<string, (event: Event) => void>

export const useTcStable = <E extends HTMLElement>(instanceProps: InstanceProps, on: Handlers = {}) => {
    const [el, setEl] = useState<E | null>(null)
    const elRef = useRef<E | null>(null)
    const appliedRef = useRef<InstanceProps>({})
    const propsRef = useRef(instanceProps)
    const handlersRef = useRef(on)
    const stableFnsRef = useRef<Record<string, unknown>>({})

    const applyProps = useCallback(() => {
        const target = elRef.current
        if (!target) return
        for (const [key, value] of Object.entries(propsRef.current)) {
            let next = value
            if (typeof value === 'function') {
                if (!stableFnsRef.current[key]) {
                    stableFnsRef.current[key] = (...args: unknown[]) =>
                        (propsRef.current[key] as ((...a: unknown[]) => unknown) | undefined)?.(...args)
                }
                next = stableFnsRef.current[key]
            }
            if (appliedRef.current[key] !== next) {
                ;(target as unknown as InstanceProps)[key] = next
                appliedRef.current[key] = next
            }
        }
    }, [])

    const ref = useCallback((node: E | null) => {
        elRef.current = node   // synchronous, so imperative `.el.current` works this commit
        setEl(node)            // state copy drives the listener effect
    }, [])

    // listeners attach per element INSTANCE — remount re-runs this and the cleanup
    // detaches from the old element. One AbortController owns all of them.
    useEffect(() => {
        if (!el) return undefined
        appliedRef.current = {}
        const controller = new AbortController()
        for (const event of Object.keys(handlersRef.current)) {
            el.addEventListener(event, (e) => handlersRef.current[event]?.(e), { signal: controller.signal })
        }
        applyProps()
        return () => { controller.abort(); appliedRef.current = {} }
    }, [el, applyProps])

    // latest-props sync AFTER commit (never during render, which React may replay)
    useEffect(() => { propsRef.current = instanceProps; handlersRef.current = on; applyProps() })

    return { ref, el: elRef }
}
```

Usage — array/object props and custom events both go through it:

```tsx
const dock = useTcStable<HTMLElement>(
    { tabs: items },
    { 'tc-tab-dock-change': (e) => { const { id, href } = (e as CustomEvent).detail; … } }
)
return <tc-tab-dock ref={dock.ref} slot="dock" active-id={activeId} />
```

Note the split: **scalar attributes** (`active-id`, `variant`, `heading`) can stay as JSX
attributes; **arrays, objects and functions** must go through the hook, since JSX would
stringify them.

## 4. Field validation

Pass a `validate` function through the instance props; never flip an `error` **attribute**.
An observed attribute change runs `attributeChangedCallback`, which rebuilds the element's
`innerHTML` and destroys the focused `<input>` mid-typing. `validate` swaps only the message
slot and is gated by `validate-on` (default: first shown on blur, then live).

The validator receives the control's **current value** (string, or `number | ''` for
`type="number"`). Compute from that, not from React state — state is one keystroke behind
inside the synchronous `input` handler.

Client-side bounds must mirror the server's schema field by field. Display-only attributes
(`min`/`max`/`required`) do not gate anything when the form submits through a JS predicate
rather than a native `<form>` submit, and some inputs ship no `maxlength` at all. **The
predicate feeding `disabled` is the only real gate.**

## 5. Smaller ones, each measured

- **`focus()` during React's commit is reverted** by react-dom's selection restoration. Defer
  it by a microtask (`queueMicrotask` / `setTimeout(…, 0)`).
- **React never renders `autoFocus` as an attribute.** Use `data-autofocus` if you need a
  selector.
- **`slot="…"` goes on the element the component returns.** A React component contributes no
  DOM node, and the shell looks for `:scope > [slot="header"]` — so `<AppBar/>` must itself
  render `<tc-app-bar slot="header">`.
- **A `tc-extended-select` mounted while its sheet is closed** (a closed sheet is
  `display: none`, never unmounted) paints its trigger label at that moment and shows the
  placeholder even with a value applied. A sheet needing a *preselected* enum wants chips or
  buttons instead.
- **An element that writes onto its own host `style`** (accent colours, tints) coexists with a
  consumer `style` prop — react-dom only clears keys it set itself — but do not set both the
  attribute and the same custom property through `style`.
- **`onClick` on a host is fine** when the element contains exactly one control: `click` from
  its inner `<button>` bubbles to the host, so there is no bespoke event to listen for.
