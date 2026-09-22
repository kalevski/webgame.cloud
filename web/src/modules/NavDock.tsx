import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useTc } from '@toolcase/web-components/react'
import useNavigation from 'hooks/useNavigation'
import useStrings from 'hooks/useStrings'

type NavDockProps = {
    activeId: string
    onMore: () => void
}

const NavDock: React.FC<NavDockProps> = ({ activeId, onMore }) => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const { dockTabs } = useNavigation()

    const seated = dockTabs.some((item) => item.id === activeId)
    const litId = seated ? activeId : 'more'
    const activeRef = useRef(litId)

    useEffect(() => {
        activeRef.current = litId
    }, [litId])

    const tabs = useMemo(
        () => [
            ...dockTabs.map((item) => ({
                id: item.id,
                label: t.nav[item.tabLabelKey ?? item.labelKey],
                icon: item.icon,
                href: item.path,
            })),
            { id: 'more', label: t.nav.more, icon: 'Menu' },
        ],
        [dockTabs, t.nav]
    )

    const restoreActive = () => {
        dock.current?.setAttribute('active-id', activeRef.current)
    }

    const onTabChange = (event: Event) => {
        const detail = (event as CustomEvent<{ id: string; href?: string }>).detail
        event.preventDefault()
        if (detail.id === 'more') {
            onMore()
            restoreActive()
            return
        }
        if (detail.href) navigate(detail.href)
    }

    const onTabReselect = (event: Event) => {
        const detail = (event as CustomEvent<{ id: string }>).detail
        if (detail.id === 'more') {
            onMore()
            restoreActive()
            return
        }
        const tab = dockTabs.find((item) => item.id === detail.id)
        const pane = document.querySelector('.app-frame__pane')
        if (pane && pane.scrollTop > 0) {
            pane.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }
        if (tab) navigate(tab.path, { replace: true })
    }

    const dock = useTc<HTMLElement>(
        { tabs },
        { 'tc-tab-dock-change': onTabChange, 'tc-tab-dock-reselect': onTabReselect }
    )

    return <tc-tab-dock ref={dock} slot="dock" active-id={litId} />
}

export default NavDock
