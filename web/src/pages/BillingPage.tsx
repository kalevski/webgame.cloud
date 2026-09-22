import React, { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import usePageTabs from 'hooks/usePageTabs'
import { HOME_ROUTE } from 'configs/navigation'
import AuthGuard from 'modules/AuthGuard'
import BillingPanel from 'modules/BillingPanel'
import MyInvoices from 'modules/MyInvoices'

type BillingTab = 'subscription' | 'invoices'

const BillingPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeatureGate('billing')
    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'subscription', label: t.billing.tabSubscription, href: '/billing' },
        { id: 'invoices', label: t.billing.tabInvoices, href: '/billing/invoices' },
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'subscription') as BillingTab

    usePageTabs(tabs)

    useEffect(() => {
        setPageTitle(t.pages.billingTitle)
        setPageDescription(t.pages.billingDescription)
    }, [setPageTitle, setPageDescription, t.pages.billingTitle, t.pages.billingDescription])

    if (billingEnabled === null) return null
    if (!billingEnabled) return <Navigate to={HOME_ROUTE} replace />

    return (
        <AuthGuard secured>
            <div className="module module-billing-page">
                {tab === 'subscription' && <BillingPanel />}
                {tab === 'invoices' && <MyInvoices />}
            </div>
        </AuthGuard>
    )
}

export default BillingPage
