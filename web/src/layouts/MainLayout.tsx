import React from 'react'
import AppBrand from 'modules/AppBrand'
import SidebarMenu from 'modules/SidebarMenu'
import PageHeader from 'modules/PageHeader'
import AlertPanel from 'modules/AlertPanel'
import OfflineBanner from 'modules/OfflineBanner'
import UserPanel from 'modules/UserPanel'
import NotificationsBell from 'modules/NotificationsBell'
import CommandPalette from 'modules/CommandPalette'

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
    <tc-dashboard-layout className="layout-main">
        <div slot="brand"><AppBrand /></div>
        <div slot="sidebar-menu"><SidebarMenu /></div>
        <div slot="sidebar-panel" className="layout-main__panel">
            <UserPanel />
        </div>
        <div slot="navbar-left"><PageHeader /></div>
        <div slot="navbar-right" className="layout-main__navbar-right">
            <CommandPalette />
            <NotificationsBell />
        </div>

        <div className="layout-main__content">
            <OfflineBanner />
            <AlertPanel />
            {children}
        </div>
    </tc-dashboard-layout>
    )
}

export const wrapInMainLayout = (Component: React.FC) => {
    function WrappedWithMainLayout(props: Record<string, unknown>) {
        return (
            <MainLayout>
                <Component {...props} />
            </MainLayout>
        )
    }
    WrappedWithMainLayout.displayName = `MainLayout(${Component.displayName || Component.name || 'Component'})`
    return WrappedWithMainLayout
}
