import React from 'react'
import { useNavigate } from 'react-router'
import { useTc } from '@toolcase/web-components/react'

export type RouteTab = {
    id: string
    label: string
    icon?: string

    path: string
}

type RouteTabsProps = {
    tabs: RouteTab[]
    activeId: string
    size?: 'sm' | 'md'

    replace?: boolean
}

const RouteTabs: React.FC<RouteTabsProps> = ({ tabs, activeId, size = 'sm', replace = false }) => {
    const navigate = useNavigate()

    const tabBar = useTc<HTMLElement>({
        tabs: tabs.map((tab) => ({ id: tab.id, label: tab.label, icon: tab.icon })),
        onChange: (id: string) => {
            const target = tabs.find((tab) => tab.id === id)

            if (target && id !== activeId) navigate(target.path, { replace })
        },
    })

    return <tc-tab-bar ref={tabBar} active-id={activeId} size={size}></tc-tab-bar>
}

export default RouteTabs
