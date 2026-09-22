import React from 'react'
import AlertPanel from 'modules/AlertPanel'
import OfflineBanner from 'modules/OfflineBanner'
import ImpersonationBanner from 'modules/ImpersonationBanner'

const BaseLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <main id="main-content" className="layout-base">
        <ImpersonationBanner />
        <OfflineBanner />
        <AlertPanel />
        {children}
    </main>
)

export const wrapInBaseLayout = (Component: React.FC) => {
    function WrappedWithBaseLayout(props: Record<string, unknown>) {
        return (
            <BaseLayout>
                <Component {...props} />
            </BaseLayout>
        )
    }
    WrappedWithBaseLayout.displayName = `BaseLayout(${Component.displayName || Component.name || 'Component'})`
    return WrappedWithBaseLayout
}
