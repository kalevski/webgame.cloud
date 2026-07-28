import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import RealmsAdmin from 'modules/RealmsAdmin'

const RealmsAdminPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.realms.title)
        setPageDescription(t.realms.empty)
    }, [setPageTitle, setPageDescription, t.realms.title, t.realms.empty])

    return (
        <AuthGuard secured permission="realm.read">
            <section className="console-page">
                <RealmsAdmin />
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(RealmsAdminPage)
