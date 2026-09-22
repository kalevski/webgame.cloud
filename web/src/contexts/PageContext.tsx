import React, { createContext, FC, useCallback, useContext, useMemo, useRef, useState } from 'react'

export type ChromeHostName = 'overlay'

export type ChromeHosts = Record<ChromeHostName, HTMLElement | null>

export type PageTab = {
    id: string
    label: string
    href: string
    badge?: number
}

type PageContextValue = {
    pageTitle: string
    pageDescription: string
    color: string
    setPageTitle: (value: string) => void
    setPageDescription: (value: string) => void
    setColor: (value: string) => void

    pageTabs: PageTab[]
    setPageTabs: (tabs: PageTab[]) => void

    chromeHosts: ChromeHosts
    registerChromeHost: (name: ChromeHostName, element: HTMLElement | null) => void
}

const EMPTY_HOSTS: ChromeHosts = { overlay: null }

const PageContext = createContext<PageContextValue>({
    pageTitle: '',
    pageDescription: '',
    color: '#000000',
    setPageTitle: () => {},
    setPageDescription: () => {},
    setColor: () => {},
    pageTabs: [],
    setPageTabs: () => {},
    chromeHosts: EMPTY_HOSTS,
    registerChromeHost: () => {},
})

const sameTabs = (left: PageTab[], right: PageTab[]): boolean =>
    left.length === right.length &&
    left.every((tab, index) =>
        tab.id === right[index].id && tab.label === right[index].label
        && tab.href === right[index].href && tab.badge === right[index].badge)

export const PageProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pageTitle, setPageTitle] = useState('')
    const [pageDescription, setPageDescription] = useState('')
    const [color, setColor] = useState('#000000')
    const [pageTabs, setTabs] = useState<PageTab[]>([])
    const [chromeHosts, setChromeHosts] = useState<ChromeHosts>(EMPTY_HOSTS)

    const tabsRef = useRef<PageTab[]>(pageTabs)

    const setPageTabs = useCallback((tabs: PageTab[]) => {
        if (sameTabs(tabsRef.current, tabs)) return
        tabsRef.current = tabs
        setTabs(tabs)
    }, [])

    const registerChromeHost = useCallback((name: ChromeHostName, element: HTMLElement | null) => {
        setChromeHosts((current) => (current[name] === element ? current : { ...current, [name]: element }))
    }, [])

    const value = useMemo(
        () => ({
            pageTitle,
            pageDescription,
            color,
            setPageTitle,
            setPageDescription,
            setColor,
            pageTabs,
            setPageTabs,
            chromeHosts,
            registerChromeHost,
        }),
        [pageTitle, pageDescription, color, pageTabs, setPageTabs, chromeHosts, registerChromeHost]
    )

    return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}

export const usePageContext = () => useContext(PageContext)
