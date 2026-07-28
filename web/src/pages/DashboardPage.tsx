import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useAuth from 'hooks/useAuth'
import AuthGuard from 'modules/AuthGuard'
import Dashboard from 'modules/Dashboard'
import { consumePostLoginRedirect } from 'helpers/postLoginRedirect'

const DashboardPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { isAuthenticated, authLoaded } = useAuth()

    useEffect(() => {
        setPageTitle(t.pages.dashboardTitle)
        setPageDescription(t.pages.dashboardDescription)
    }, [setPageTitle, setPageDescription, t.pages.dashboardTitle, t.pages.dashboardDescription])

    if (!authLoaded) return null
    const target = isAuthenticated ? consumePostLoginRedirect() : null
    if (target) return <Navigate to={target} replace />

    return (
        <AuthGuard secured>
            <section className="console-page">
                <Dashboard />
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(DashboardPage)
