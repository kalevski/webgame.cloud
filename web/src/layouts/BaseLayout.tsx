import React from 'react'
import AlertPanel from 'modules/AlertPanel'
import OfflineBanner from 'modules/OfflineBanner'

const BaseLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="layout-base">
        <OfflineBanner />
        <AlertPanel />
        {children}
    </div>
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
