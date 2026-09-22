import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useStore } from 'state'
import { FEATURE_FLAG_DEFAULTS, FeatureFlag, Permission } from 'types'
import { HOME_ROUTE, chromeForPath, dockSeats, moreGroups, navIdForPath, type NavItem, type NavSection } from 'configs/navigation'

type Navigation = {
    dockTabs: NavItem[]
    moreSections: Array<{ section: NavSection; items: NavItem[] }>
    activeTabId: string
    backOrRoot: () => void
}

const useNavigation = (): Navigation => {
    const { pathname } = useLocation()
    const navigate = useNavigate()
    const permissions = useStore((state) => state.permissions)
    const authConfig = useStore((state) => state.authConfig)

    const filter = useMemo(() => {
        const granted = new Set(permissions)
        return {
            can: (permission: Permission) => granted.has(permission),
            hasFeature: (flag: FeatureFlag) => authConfig?.features?.[flag] ?? FEATURE_FLAG_DEFAULTS[flag],
        }
    }, [permissions, authConfig])

    const dockTabs = useMemo(() => dockSeats(filter), [filter])
    const moreSections = useMemo(() => moreGroups(filter), [filter])

    const backOrRoot = useCallback(() => {
        const chrome = chromeForPath(pathname)
        const index = (window.history.state as { idx?: number } | null)?.idx
        const deepLink = index === 0 || window.history.length <= 1
        if (deepLink) {
            navigate(chrome.backTo ?? HOME_ROUTE, { replace: true })
            return
        }
        window.history.back()
    }, [pathname, navigate])

    return { dockTabs, moreSections, activeTabId: navIdForPath(pathname), backOrRoot }
}

export default useNavigation
