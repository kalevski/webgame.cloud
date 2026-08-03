# Frame scaffold

Copy-pasteable shape for the one-shell frame, the chrome contract, and the SCSS the app owes
on top of the library. Trim the app-specific bits (auth gate, notifications) as needed.

## 1. The route→chrome map

```ts
// configs/navigation.ts
export type ChromeBar = 'brand' | 'title' | 'back' | 'none'

export type RouteChrome = {
    path: string                 // matched with the router's own matcher
    bar: ChromeBar
    dock: boolean
    nav?: NavId                  // which dock tab owns this route
    tabs?: boolean               // does this route carry a page-tab rail
    backTo?: string              // fallback target for a cold deep link
    edge?: 'top' | 'bottom' | 'both'   // which hardware insets the SHELL pays
    canvas?: string              // full-bleed: the page paints its own surface
}

export const ROUTE_CHROME: RouteChrome[] = [
    { path: '/',                  bar: 'brand', dock: true,  nav: 'home' },
    { path: '/login',             bar: 'none',  dock: false, edge: 'bottom', canvas: '#fbf3e2' },
    { path: '/items',             bar: 'title', dock: true,  nav: 'items', tabs: true },
    { path: '/items/:id',         bar: 'back',  dock: false, nav: 'items' },
    { path: '/items/:id/focus',   bar: 'none',  dock: false, nav: 'items', canvas: '#f6ecd8' },
]
```

`canvas` does two things at once: it colours the pane **and** the inset strips, and it drops
the pane's page gutter so the page can reach all four edges. Pair it with `edge` when the
canvas should run under the status bar while the page pays the top inset itself.

## 2. The frame

```tsx
// layouts/MainLayout.tsx — mounted ONCE by Router.tsx, above <Routes>
const AppFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { pathname } = useLocation()
    const chrome = chromeForPath(pathname)
    const { registerChromeHost } = usePageContext()

    // Stable callback refs. An inline arrow is a NEW ref every render, and React answers
    // that by calling the old one with null and the new one with the element — two provider
    // writes per frame render, each re-rendering every context reader.
    const bandHost    = useCallback((el: HTMLDivElement | null) => registerChromeHost('band', el),    [registerChromeHost])
    const actionHost  = useCallback((el: HTMLDivElement | null) => registerChromeHost('action', el),  [registerChromeHost])
    const overlayHost = useCallback((el: HTMLDivElement | null) => registerChromeHost('overlay', el), [registerChromeHost])

    const canvasColor = chrome.canvas

    return (
        <tc-mobile-shell
            data-key={pathname}                 // per-route scroll banking key
            edge={chrome.edge}
            desktop={true}                      // unconditional — see SKILL.md
            pane-bg={canvasColor}               // attribute, NOT an inline --bs-mobile-shell-bg
            style={canvasColor ? ({ '--bs-mobile-shell-edge-bg': canvasColor } as React.CSSProperties) : undefined}
        >
            {chrome.bar !== 'none' && <AppBar variant={chrome.bar} />}

            {/* a page's fixed band — a SECOND [slot="header"] sibling, not the bar's `below` */}
            <div slot="header" className="app-frame__band" ref={bandHost} />

            {/* THE one unslotted child: the app's only scroller */}
            <div className={canvasColor ? 'app-frame__pane app-frame__pane--bleed' : 'app-frame__pane'}>
                {children}
            </div>

            <div slot="action" className="app-frame__action" ref={actionHost} />

            {/* OVERLAY BEFORE DOCK — a focus-order decision, not a paint one */}
            <div slot="overlay">
                <MoreSheet … />
                <ModalRender />          {/* the sheet registry */}
                <ToastLayer />           {/* the app's one failure channel */}
                <div className="app-frame__overlay-host" ref={overlayHost} />
            </div>

            {chrome.dock && <NavDock … />}
        </tc-mobile-shell>
    )
}
```

Navigating must close open sheets centrally — one `useEffect` on `pathname` in the frame —
or a row tapped inside the "More" sheet leaves the sheet sitting over the page it opened.

## 3. The page→chrome provider

```tsx
// contexts/PageContext.ts  (context + hook live apart from the provider so each file exports
// either only components or only non-components — mixing them breaks Fast Refresh)
export type ChromeHostName = 'band' | 'barActions' | 'action' | 'overlay'

export type PageContextValue = {
    pageTitle: string
    pageDescription: string
    setPageTitle: (v: string) => void
    setPageDescription: (v: string) => void
    pageTabs: PageTabsSpec | null
    setPageTabs: (spec: PageTabsSpec | null) => void
    chromeHosts: Record<ChromeHostName, HTMLElement | null>
    registerChromeHost: (name: ChromeHostName, el: HTMLElement | null) => void
}
```

```tsx
// contexts/PageProvider.tsx
const registerChromeHost = useCallback((name: ChromeHostName, element: HTMLElement | null) => {
    // a callback ref runs on mount AND unmount, so bail when nothing changed or it loops
    setChromeHosts((cur) => (cur[name] === element ? cur : { ...cur, [name]: element }))
}, [])

const value = useMemo(() => ({ … }), [pageTitle, pageDescription, pageTabs, chromeHosts, registerChromeHost])
```

`variant` is deliberately **not** here: which bar a route wears belongs to the route map, so a
page cannot disagree with it about whether it has a back chevron.

## 4. The portal components

All four are the same three lines. They differ only in which host they target.

```tsx
const PageActionBar: React.FC<{ children: React.ReactNode; stack?: boolean; flat?: boolean }> = ({ children, stack, flat }) => {
    const { chromeHosts } = usePageContext()
    if (!chromeHosts.action) return null
    // explicit booleans, never `x || undefined` — the setter calls toggleAttribute
    return createPortal(<tc-action-bar stack={stack === true} flat={flat === true}>{children}</tc-action-bar>, chromeHosts.action)
}

const PageFab: React.FC<{ icon: string; label: string; extended?: boolean; offset?: string; onPress: () => void }> =
    ({ icon, label, extended, offset, onPress }) => {
        const { chromeHosts } = usePageContext()
        if (!chromeHosts.overlay) return null
        return createPortal(
            <tc-fab icon={icon} label={label} variant={extended ? 'extended' : 'icon'} offset={offset} onClick={onPress} />,
            chromeHosts.overlay
        )
    }

const PageBand:    /* → chromeHosts.band    */ = ({ children }) => createPortal(children, host)
const PageOverlay: /* → chromeHosts.overlay */ = ({ children }) => createPortal(children, host)   // wrap every page sheet in this
```

`label` on the FAB is required — in the icon variant it IS the button's whole accessible
name, so it must be a real sentence, never "+".

## 5. The tab-rail hook (data, but value-diffed)

```ts
const fingerprint = (spec: PageTabsSpec | null): string => {
    if (!spec) return ''
    // deliberately NOT JSON.stringify: a caller building tabs by map over a store slice can
    // emit {label,id} one render and {id,label} the next, and a stringify diff reports that
    // as a change and re-renders the frame.
    const tabs = spec.tabs.map((t) => `${t.id} ${t.label} ${t.href} ${t.count ?? ''} ${t.disabled ? 1 : 0}`).join('')
    return `${spec.activeId}${spec.replace ? 1 : 0}${tabs}`
}

const usePageTabs = (spec: PageTabsSpec | null) => {
    const { setPageTabs } = usePageContext()
    const key = fingerprint(spec)
    useEffect(() => {
        setPageTabs(spec)
        return () => setPageTabs(null)   // unmount clears the rail — no teardown per caller
    }, [key, setPageTabs])               // `spec` intentionally absent: `key` IS its value
}
```

## 6. The SCSS the app owes

```scss
@use 'abstracts' as *;

// the pane's gutter is the ONLY geometry the app states — the shell owns height/overflow
.app-frame__pane {
    padding: $m-gap-section $m-gap-inline $m-pad-page;
}

// hosts are always mounted (so the target exists before the page renders) and hidden empty,
// or the shell paints a bare strip of surface on every screen that contributes nothing
.app-frame__band:empty,
.app-frame__action:empty { display: none }

// a full-bleed route draws its own surface to all four edges
.app-frame__pane--bleed { padding: 0 }

@include up($bp-lg) {
    // the library boxes the whole frame at 1280px by default; uncap it and cap the COLUMN
    tc-mobile-shell[desktop] { --bs-mobile-shell-max-width-desktop: none }

    // the pane's inline padding GROWS until content caps, centred — one rule for every page.
    // Padding rather than a max-width wrapper: the pane's children are each page's own root,
    // so none of them needs to know.
    .app-frame__pane {
        padding-inline: max($m-gap-inline, calc((100% - #{$desktop-content-max}) / 2));
        padding-top: $space-xl;
    }
    .app-frame__pane--bleed { padding: 0 }   // restated: the rule above wins on source order
}

// a sheet body scrolls; its blocks must not squash (flex-shrink defaults to 1)
tc-bottom-sheet > :not([slot]) > * { flex-shrink: 0 }

@media print {
    // the shell is a fixed-height overflow:hidden box — the clip stops the browser creating
    // a page past the first screenful, silently truncating anything using break-after
    tc-mobile-shell, tc-mobile-shell > * {
        overflow: visible; height: auto; max-height: none;
    }
    tc-mobile-shell { display: block; max-width: none; border-inline: 0; padding: 0 }
    tc-app-bar, tc-tab-dock, [slot='action'], [slot='overlay'] { display: none }
    .app-frame__pane { padding: 0 }   // not cosmetic: 14px top+bottom pushes a second sheet
}
```

Verify a print change by generating a real PDF and checking the `/MediaBox` — a screenshot
does not reflect `@page` size or margins, and without `preferCSSPageSize` Playwright ignores
`@page size` entirely and prints everything on Letter.
