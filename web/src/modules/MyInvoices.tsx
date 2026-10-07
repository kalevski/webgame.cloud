import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { formatMoney } from 'helpers/money'
import { Invoice, INVOICE_STATUSES, InvoiceStatus } from 'types'
import { formatDate } from 'helpers/dates'

const STATUS_VARIANTS: Record<InvoiceStatus, string> = {
    draft: 'secondary',
    open: 'warning',
    paid: 'success',
    void: 'secondary',
    uncollectible: 'danger',
}

const PAGE_SIZE = 20

const openInvoice = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-token]')
    const token = button?.dataset.token
    if (token) window.open(`/invoice/${token}`, '_blank', 'noopener')
}

const MyInvoices: React.FC = () => {
    const { t } = useStrings()
    const b = t.billing
    const i = t.invoices
    const invoices = useStore((state) => state.myInvoices)
    const total = useStore((state) => state.myInvoicesTotal)
    const loading = useStore((state) => state.myInvoicesLoading)
    const filters = useStore((state) => state.myInvoiceFilters)
    const fetchMyInvoices = useStore((state) => state.fetchMyInvoices)

    useEffect(() => {
        void fetchMyInvoices({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchMyInvoices])

    const hasProviderInvoice = invoices.some((invoice) => invoice.provider !== 'manual')

    const rows = useMemo(
        () =>
            invoices
                .map((invoice) => [
                    '<tr>',
                    `<td>${escapeHtml(invoice.number)}</td>`,
                    `<td>${escapeHtml(invoice.planName ?? '—')}</td>`,
                    `<td><tc-badge variant="${STATUS_VARIANTS[invoice.status]}">${escapeHtml(i.statusLabels[invoice.status])}</tc-badge></td>`,
                    `<td style="text-align:right">${escapeHtml(formatMoney(invoice.amountCents, invoice.currency))}</td>`,
                    `<td>${escapeHtml(formatDate(invoice.issuedAt))}</td>`,
                    `<td style="text-align:right"><span class="table-actions"><tc-icon-button icon="Eye" variant="secondary" size="small" outline data-token="${escapeHtml(invoice.publicToken)}" label="${escapeHtml(b.invoicePreview)}" title="${escapeHtml(b.invoicePreview)}"></tc-icon-button></span></td>`,
                    '</tr>',
                ].join(''))
                .join(''),
        [invoices, i, b]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'number', label: i.columnNumber, minWidth: '11rem' },
            { key: 'plan', label: i.columnPlan, hideBelow: 'md' },
            { key: 'status', label: i.columnStatus },
            { key: 'amount', label: i.columnAmount, align: 'right' },
            { key: 'issued', label: i.columnIssued, hideBelow: 'sm' },
            { key: 'actions', label: '', align: 'right', minWidth: '5rem' },
        ],
        filters: [
            {
                key: 'status',
                label: i.filterStatus,
                type: 'select',
                placeholder: i.filterAll,
                options: INVOICE_STATUSES.map((status) => ({ value: status, label: i.statusLabels[status] })),
            },
        ],
        filterValues: filters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchMyInvoices({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchMyInvoices({ offset })
        },
    })

    return (
        <div className="module-my-invoices" role="presentation" onClick={openInvoice}>
            <tc-section-card title={b.invoicesTitle} icon="ReceiptText">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{b.invoicesIntro}</tc-text>
                    {hasProviderInvoice && <tc-text variant="muted">{b.issuedByProvider}</tc-text>}
                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={filters.offset ?? 0}
                        total={total}
                        loading={loading || undefined}
                        sticky-last-column
                    ></tc-advanced-table>
                    {!loading && invoices.length === 0 && (
                        <tc-empty-state icon="receipt">{b.invoicesEmpty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default MyInvoices
