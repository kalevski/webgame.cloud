import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { MODAL, useModalOpen } from 'modals'
import { ENQUIRY_STATUSES, EnquiryStatus, SalesEnquiry } from 'types'

const STATUS_VARIANTS: Record<EnquiryStatus, string> = {
    new: 'warning',
    contacted: 'primary',
    won: 'success',
    lost: 'secondary',
}

const PAGE_SIZE = 20

const details = (enquiry: SalesEnquiry): string =>
    Object.entries(enquiry.answers)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' · ')

const EnquiriesAdmin: React.FC = () => {
    const { t } = useStrings()
    const e = t.enquiries
    const enquiries = useStore((state) => state.enquiries)
    const total = useStore((state) => state.enquiriesTotal)
    const loading = useStore((state) => state.enquiriesLoading)
    const filters = useStore((state) => state.enquiryFilters)
    const hasFilters = Boolean(filters.q || filters.status || filters.planId)
    const fetchEnquiries = useStore((state) => state.fetchEnquiries)
    const plans = useStore((state) => state.adminPlans)
    const fetchAdminPlans = useStore((state) => state.fetchAdminPlans)

    const canWrite = useCan('enquiry.write')

    const openTrail = useModalOpen<void, SalesEnquiry>(MODAL.ENQUIRY_TRAIL)
    const openAction = useModalOpen<{ kind: string } | null, SalesEnquiry>(MODAL.ENQUIRY_ACTION)

    useEffect(() => {
        void fetchAdminPlans()
        void fetchEnquiries({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchAdminPlans, fetchEnquiries])

    const rows = useMemo(
        () =>
            enquiries
                .map((enquiry) => [
                    '<tr>',
                    `<td>${escapeHtml(enquiry.userName || enquiry.userEmail)}<br><small>${escapeHtml(enquiry.userEmail)}</small></td>`,
                    `<td>${escapeHtml(enquiry.planName ?? '—')}</td>`,
                    `<td><tc-badge variant="${STATUS_VARIANTS[enquiry.status]}">${escapeHtml(e.statusLabels[enquiry.status])}</tc-badge></td>`,
                    `<td><small>${escapeHtml(details(enquiry))}</small></td>`,
                    `<td>${escapeHtml(new Date(enquiry.createdAt).toLocaleString())}</td>`,
                    `<td style="text-align:right"><span class="table-actions">`,
                    `<tc-icon-button icon="History" variant="secondary" size="small" outline data-enquiry="${escapeHtml(enquiry.id)}" data-action="trail" label="${escapeHtml(e.openTrail)}" title="${escapeHtml(e.openTrail)}"></tc-icon-button>`,
                    canWrite
                        ? `<tc-icon-button icon="CirclePlus" variant="primary" size="small" outline data-enquiry="${escapeHtml(enquiry.id)}" data-action="action" label="${escapeHtml(e.openAction)}" title="${escapeHtml(e.openAction)}"></tc-icon-button>`
                        : '',
                    '</span></td>',
                    '</tr>',
                ].join(''))
                .join(''),
        [enquiries, e, canWrite]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'account', label: e.columnAccount, minWidth: '14rem' },
            { key: 'plan', label: e.columnPlan },
            { key: 'status', label: e.columnStatus },
            { key: 'details', label: e.columnDetails, minWidth: '18rem', hideBelow: 'md' },
            { key: 'created', label: e.columnCreated, hideBelow: 'sm' },
            { key: 'actions', label: '', align: 'right', minWidth: '8rem' },
        ],
        filters: [
            { key: 'q', label: e.filterSearch, type: 'text', placeholder: e.filterSearchPlaceholder },
            {
                key: 'status',
                label: e.filterStatus,
                type: 'select',
                placeholder: e.filterAll,
                options: ENQUIRY_STATUSES.map((status) => ({ value: status, label: e.statusLabels[status] })),
            },
            {
                key: 'planId',
                label: e.filterPlan,
                type: 'select',
                placeholder: e.filterAll,
                options: plans.map((plan) => ({ value: plan.id, label: plan.name })),
            },
        ],
        filterValues: filters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchEnquiries({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchEnquiries({ offset })
        },
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-enquiry]')
        if (!button) return
        const enquiry = enquiries.find((entry) => entry.id === button.dataset.enquiry)
        if (!enquiry) return
        if (button.dataset.action === 'trail') openTrail(enquiry)
        if (button.dataset.action === 'action') openAction(enquiry)
    }

    return (
        <div className="module module-enquiries" role="presentation" onClick={onClick}>
            <tc-section-card title={e.title} icon="MessagesSquare">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{e.intro}</tc-text>
                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={filters.offset ?? 0}
                        total={total}
                        loading={loading || undefined}
                        sticky-last-column
                    ></tc-advanced-table>
                    {!loading && enquiries.length === 0 && (
                        <tc-empty-state icon="inbox">{hasFilters ? e.emptyFiltered : e.empty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default EnquiriesAdmin
