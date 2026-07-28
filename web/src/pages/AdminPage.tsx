import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import AdminWorkspace from 'modules/AdminWorkspace'

const AdminPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.adminTitle)
        setPageDescription(t.pages.adminDescription)
    }, [setPageTitle, setPageDescription, t.pages.adminTitle, t.pages.adminDescription])

    return (
        <AuthGuard secured permission="admin.overview.read">
            <section className="console-page">
                <AdminWorkspace />
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(AdminPage)
