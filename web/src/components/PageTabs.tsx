import React from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { PageTab } from 'contexts/PageContext'

type PageTabsProps = {
    tabs: PageTab[]
}

const PageTabs: React.FC<PageTabsProps> = ({ tabs }) => {
    const navigate = useNavigate()
    const { pathname, search } = useLocation()
    const here = `${pathname}${search}`

    const active = tabs.find((tab) => tab.href === here)
        ?? tabs.find((tab) => here.startsWith(tab.href.split('?')[0]))
        ?? tabs[0]

    return (
        <tc-page-tabs
            active-id={active?.id ?? ''}
            tabs={tabs.map((tab) => ({ id: tab.id, label: tab.label, href: tab.href, count: tab.badge }))}
            ontc-change={(event: CustomEvent<{ id: string; href?: string }>) => {
                const target = tabs.find((tab) => tab.id === event.detail?.id)
                if (!target) return
                event.preventDefault()
                navigate(target.href, { replace: true })
            }}
        ></tc-page-tabs>
    )
}

export default PageTabs
