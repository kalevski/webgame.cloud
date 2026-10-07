import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import AuthGuard from 'modules/AuthGuard'
import BillingEventsAdmin from 'modules/BillingEventsAdmin'

const BillingEventsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeatureGate('billing')

    useEffect(() => {
        setPageTitle(t.pages.billingEventsTitle)
        setPageDescription(t.pages.billingEventsDescription)
    }, [setPageTitle, setPageDescription, t.pages.billingEventsTitle, t.pages.billingEventsDescription])

    if (billingEnabled === null) return null
    if (!billingEnabled) return <Navigate to="/" replace />

    return (
        <AuthGuard secured permission="billing.subscription.read">
            <BillingEventsAdmin />
        </AuthGuard>
    )
}

export default BillingEventsPage
