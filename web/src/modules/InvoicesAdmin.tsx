import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
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

const InvoicesAdmin: React.FC = () => {
    const { t } = useStrings()
    const i = t.invoices
    const invoices = useStore((state) => state.invoices)
    const total = useStore((state) => state.invoicesTotal)
    const loading = useStore((state) => state.invoicesLoading)
    const filters = useStore((state) => state.invoiceFilters)
    const hasFilters = Boolean(
        filters.q || filters.status || filters.planId || filters.provider || filters.from || filters.to
    )
    const fetchInvoices = useStore((state) => state.fetchInvoices)
    const setInvoiceStatus = useStore((state) => state.setInvoiceStatus)
    const plans = useStore((state) => state.adminPlans)
    const fetchAdminPlans = useStore((state) => state.fetchAdminPlans)

    const canWrite = useCan('invoice.write')

    useEffect(() => {
        void fetchAdminPlans()
        void fetchInvoices({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchAdminPlans, fetchInvoices])

    const rows = useMemo(
        () =>
            invoices
                .map((invoice) => {
                    const status = `<tc-badge variant="${STATUS_VARIANTS[invoice.status]}">${escapeHtml(i.statusLabels[invoice.status])}</tc-badge>`
                    return [
                        '<tr>',
                        `<td>${escapeHtml(invoice.number)}</td>`,
                        `<td>${escapeHtml(invoice.userName || invoice.userEmail)}<br><small>${escapeHtml(invoice.userEmail)}</small></td>`,
                        `<td>${escapeHtml(invoice.planName ?? '—')}</td>`,
                        `<td>${status}</td>`,
                        `<td style="text-align:right">${escapeHtml(formatMoney(invoice.amountCents, invoice.currency))}</td>`,
                        `<td>${escapeHtml(formatDate(invoice.issuedAt))}</td>`,
                        `<td>${escapeHtml(invoice.provider)}</td>`,
                        '<td style="text-align:right"><span class="table-actions">',
                        `<a class="btn btn-sm btn-outline-primary" href="/invoice/${escapeHtml(invoice.publicToken)}" target="_blank" rel="noreferrer">${escapeHtml(i.view)}</a>`,
                        canWrite
                            ? `<button type="button" class="btn btn-sm btn-outline-secondary" data-invoice="${escapeHtml(invoice.id)}" data-status="paid">${escapeHtml(i.markPaid)}</button>`
                            : '',
                        canWrite
                            ? `<button type="button" class="btn btn-sm btn-outline-danger" data-invoice="${escapeHtml(invoice.id)}" data-status="void">${escapeHtml(i.markVoid)}</button>`
                            : '',
                        '</span></td>',
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [invoices, i, canWrite]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'number', label: i.columnNumber, minWidth: '11rem' },
            { key: 'user', label: i.columnUser, minWidth: '14rem' },
            { key: 'plan', label: i.columnPlan, hideBelow: 'md' },
            { key: 'status', label: i.columnStatus },
            { key: 'amount', label: i.columnAmount, align: 'right' },
            { key: 'issued', label: i.columnIssued, hideBelow: 'sm' },
            { key: 'provider', label: i.columnProvider, hideBelow: 'lg' },
            { key: 'actions', label: '', align: 'right', minWidth: '17rem' },
        ],
        filters: [
            { key: 'q', label: i.filterSearch, type: 'text', placeholder: i.filterSearchPlaceholder },
            {
                key: 'status',
                label: i.filterStatus,
                type: 'select',
                placeholder: i.filterAll,
                options: INVOICE_STATUSES.map((status) => ({ value: status, label: i.statusLabels[status] })),
            },
            {
                key: 'planId',
                label: i.filterPlan,
                type: 'select',
                placeholder: i.filterAll,
                options: plans.map((plan) => ({ value: plan.id, label: plan.name })),
            },
        ],
        filterValues: filters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchInvoices({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchInvoices({ offset })
        },
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-invoice]')
        if (!button) return
        const id = button.dataset.invoice
        const status = button.dataset.status as InvoiceStatus | undefined
        if (id && status) void setInvoiceStatus(id, status)
    }

    const fromPicker = useTc<HTMLElement>({
        onChange: (value: unknown) => {
            void fetchInvoices({ from: (value as string) || undefined, offset: 0 })
        },
    })

    const toPicker = useTc<HTMLElement>({
        onChange: (value: unknown) => {
            void fetchInvoices({ to: (value as string) || undefined, offset: 0 })
        },
    })

    return (
        <div className="module module-invoices" role="presentation" onClick={onClick}>
            <tc-section-card title={i.title} icon="ReceiptText">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{i.intro}</tc-text>

                    <div className="module-invoices__dates">
                        <div>
                            <tc-label>{i.filterFrom}</tc-label>
                            <tc-date-picker ref={fromPicker}></tc-date-picker>
                        </div>
                        <div>
                            <tc-label>{i.filterTo}</tc-label>
                            <tc-date-picker ref={toPicker}></tc-date-picker>
                        </div>
                    </div>
                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={filters.offset ?? 0}
                        total={total}
                        loading={loading || undefined}
                        sticky-last-column
                    ></tc-advanced-table>
                    {!loading && invoices.length === 0 && (
                        <tc-empty-state icon="receipt">{hasFilters ? i.emptyFiltered : i.empty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default InvoicesAdmin
