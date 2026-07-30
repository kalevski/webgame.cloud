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
        setPageTitle(t.pages.realmsTitle)
        setPageDescription(t.pages.realmsDescription)
    }, [setPageTitle, setPageDescription, t.pages.realmsTitle, t.pages.realmsDescription])

    return (
        <AuthGuard secured permission="realm.read">
            <section className="console-page">
                <tc-rich-page-header
                    title-text={t.pages.realmsTitle}
                    description={t.pages.realmsDescription}
                    icon-name="Server"
                    icon-color="cyan"
                ></tc-rich-page-header>

                <RealmsAdmin />
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(RealmsAdminPage)
