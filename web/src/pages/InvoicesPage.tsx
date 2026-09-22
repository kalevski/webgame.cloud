import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import AuthGuard from 'modules/AuthGuard'
import InvoicesAdmin from 'modules/InvoicesAdmin'

const InvoicesPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeatureGate('billing')

    useEffect(() => {
        setPageTitle(t.pages.invoicesTitle)
        setPageDescription(t.pages.invoicesDescription)
    }, [setPageTitle, setPageDescription, t.pages.invoicesTitle, t.pages.invoicesDescription])

    if (billingEnabled === null) return null
    if (!billingEnabled) return <Navigate to="/" replace />

    return (
        <AuthGuard secured permission="invoice.read">
            <InvoicesAdmin />
        </AuthGuard>
    )
}

export default InvoicesPage
