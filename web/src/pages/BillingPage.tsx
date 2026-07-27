import React, { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import RouteTabs from 'components/RouteTabs'
import AuthGuard from 'modules/AuthGuard'
import BillingPanel from 'modules/BillingPanel'
import MyInvoices from 'modules/MyInvoices'

type BillingTab = 'subscription' | 'invoices'

const BillingPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeature('billing')
    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'subscription', label: t.billing.tabSubscription, icon: 'credit-card', path: '/billing' },
        { id: 'invoices', label: t.billing.tabInvoices, icon: 'receipt', path: '/billing/invoices' },
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'subscription') as BillingTab

    useEffect(() => {
        setPageTitle(t.pages.billingTitle)
        setPageDescription(t.pages.billingDescription)
    }, [setPageTitle, setPageDescription, t.pages.billingTitle, t.pages.billingDescription])

    if (!billingEnabled) return <Navigate to="/dashboard" replace />

    return (
        <AuthGuard secured>
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="module module-billing-page">
                            <tc-rich-page-header
                                className="module-billing-page__header"
                                title-text={t.billing.title}
                                description={t.billing.intro}
                                icon-name="CreditCard"
                                icon-color="violet"
                            ></tc-rich-page-header>

                            <RouteTabs tabs={tabs} activeId={tab} />

                            <div className="module-billing-page__content">
                                {tab === 'subscription' && <BillingPanel />}
                                {tab === 'invoices' && <MyInvoices />}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(BillingPage)
