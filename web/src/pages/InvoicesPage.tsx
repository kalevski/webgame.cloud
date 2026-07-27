import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import AuthGuard from 'modules/AuthGuard'
import InvoicesAdmin from 'modules/InvoicesAdmin'

const InvoicesPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeature('billing')

    useEffect(() => {
        setPageTitle(t.pages.invoicesTitle)
        setPageDescription(t.pages.invoicesDescription)
    }, [setPageTitle, setPageDescription, t.pages.invoicesTitle, t.pages.invoicesDescription])

    if (!billingEnabled) return <Navigate to="/dashboard" replace />

    return (
        <AuthGuard secured permission="invoice.read">
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <InvoicesAdmin />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(InvoicesPage)
