import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import Loading from 'components/Loading'
import { formatMoney } from 'helpers/money'
import BillingService from 'services/BillingService'
import { PublicInvoice } from 'types'

const InvoiceRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="page-invoice__row">
        <span className="page-invoice__label">{label}</span>
        <span className="page-invoice__value">{value}</span>
    </div>
)

const PublicInvoicePage: React.FC = () => {
    const { token } = useParams()
    const { t } = useStrings()
    const p = t.publicInvoice
    const { setPageTitle, setPageDescription } = usePageContext()

    const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        setPageTitle(t.pages.publicInvoiceTitle)
        setPageDescription(t.pages.publicInvoiceDescription)
    }, [setPageTitle, setPageDescription, t.pages.publicInvoiceTitle, t.pages.publicInvoiceDescription])

    useEffect(() => {
        if (!token) return
        BillingService.getInstance()
            .fetchPublicInvoice(token)
            .then(setInvoice)
            .catch(() => setFailed(true))
    }, [token])

    if (failed) {
        return (
            <div className="page-invoice">
                <tc-empty-state icon="receipt" heading={p.notFound}></tc-empty-state>
            </div>
        )
    }

    if (!invoice) return <Loading />

    const amount = formatMoney(invoice.amountCents, invoice.currency)

    return (
        <div className="page-invoice">
            <article className="page-invoice__sheet">
                <header className="page-invoice__head">
                    <div>
                        <h1 className="page-invoice__title">{p.title}</h1>
                        <p className="page-invoice__number">{invoice.number}</p>
                    </div>
                    <div className="page-invoice__workspace">{invoice.workspace}</div>
                </header>

                <section className="page-invoice__party">
                    <span className="page-invoice__label">{p.billedTo}</span>
                    <strong>{invoice.accountName || invoice.accountEmail}</strong>
                    <span>{invoice.accountEmail}</span>
                </section>

                <section className="page-invoice__rows">
                    <InvoiceRow label={p.plan} value={invoice.planName ?? '—'} />
                    <InvoiceRow label={p.status} value={invoice.status} />
                    <InvoiceRow label={p.issued} value={new Date(invoice.issuedAt).toLocaleDateString()} />
                    {invoice.dueAt && (
                        <InvoiceRow label={p.due} value={new Date(invoice.dueAt).toLocaleDateString()} />
                    )}
                    {invoice.paidAt && (
                        <InvoiceRow label={p.paid} value={new Date(invoice.paidAt).toLocaleDateString()} />
                    )}
                </section>

                <section className="page-invoice__total">
                    <span className="page-invoice__label">{p.amount}</span>
                    <span className="page-invoice__amount">{amount}</span>
                </section>

                <footer className="page-invoice__foot">{p.thanks}</footer>
            </article>

            <div className="page-invoice__actions">
                <tc-button variant="primary" onClick={() => window.print()}>
                    {p.print}
                </tc-button>
            </div>
        </div>
    )
}

export default PublicInvoicePage
