import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { BILLING_EVENT_STATUSES, BillingEventStatus } from 'types'
import { formatDateTime } from 'helpers/dates'

const STATUS_VARIANTS: Record<BillingEventStatus, string> = {
    received: 'secondary',
    applied: 'success',
    ignored: 'warning',
    failed: 'danger',
}

const PAGE_SIZE = 20

const BillingEventsAdmin: React.FC = () => {
    const { t } = useStrings()
    const e = t.billingEvents

    const events = useStore((state) => state.billingEvents)
    const total = useStore((state) => state.billingEventsTotal)
    const loading = useStore((state) => state.billingEventsLoading)
    const filters = useStore((state) => state.billingEventFilters)
    const hasFilters = Boolean(filters.q || filters.status)
    const fetchBillingEvents = useStore((state) => state.fetchBillingEvents)
    const replayBillingEvent = useStore((state) => state.replayBillingEvent)

    const canWrite = useCan('billing.subscription.write')

    useEffect(() => {
        void fetchBillingEvents({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchBillingEvents])

    const rows = useMemo(
        () =>
            events
                .map((event) => {
                    const status = `<tc-badge variant="${STATUS_VARIANTS[event.status]}">${escapeHtml(e.statusLabels[event.status] ?? event.status)}</tc-badge>`
                    const account = event.userName || event.userEmail || '—'
                    const replay = canWrite && event.status !== 'applied'
                        ? `<button type="button" class="btn btn-sm btn-outline-secondary" data-event="${escapeHtml(event.id)}">${escapeHtml(e.replay)}</button>`
                        : ''
                    return [
                        '<tr>',
                        `<td>${escapeHtml(formatDateTime(event.createdAt))}</td>`,
                        `<td>${escapeHtml(event.provider)}</td>`,
                        `<td>${escapeHtml(event.eventType)}</td>`,
                        `<td>${escapeHtml(account)}</td>`,
                        `<td>${status}</td>`,
                        `<td><small>${escapeHtml(event.error)}</small></td>`,
                        `<td style="text-align:right"><span class="table-actions">${replay}</span></td>`,
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [events, e, canWrite]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'received', label: e.columnReceived, minWidth: '11rem' },
            { key: 'provider', label: e.columnProvider, hideBelow: 'md' },
            { key: 'type', label: e.columnType, minWidth: '11rem' },
            { key: 'account', label: e.columnAccount, hideBelow: 'sm' },
            { key: 'status', label: e.columnStatus },
            { key: 'error', label: e.columnError, hideBelow: 'lg' },
            { key: 'actions', label: '', align: 'right', minWidth: '7rem' },
        ],
        filters: [
            { key: 'q', label: e.filterSearch, type: 'text', placeholder: e.filterSearchPlaceholder },
            {
                key: 'status',
                label: e.filterStatus,
                type: 'select',
                placeholder: e.filterAll,
                options: BILLING_EVENT_STATUSES.map((status) => ({ value: status, label: e.statusLabels[status] })),
            },
        ],
        filterValues: filters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchBillingEvents({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchBillingEvents({ offset })
        },
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-event]')
        const id = button?.dataset.event
        if (id) void replayBillingEvent(id)
    }

    return (
        <div className="module module-billing-events" role="presentation" onClick={onClick}>
            <tc-section-card title={e.title} icon="Webhook">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{e.intro}</tc-text>
                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={filters.offset ?? 0}
                        total={total}
                        loading={loading || undefined}
                        sticky-last-column
                    ></tc-advanced-table>
                    {!loading && events.length === 0 && (
                        <tc-empty-state icon="webhook">{hasFilters ? e.emptyFiltered : e.empty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default BillingEventsAdmin
