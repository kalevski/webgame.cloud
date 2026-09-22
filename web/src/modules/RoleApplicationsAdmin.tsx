import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import AdvancedTable from 'components/AdvancedTable'
import { escapeHtml } from 'helpers/html'
import { formatDateTime } from 'helpers/dates'
import { MODAL, useModalOpen } from 'modals'
import { ROLE_APPLICATION_STATUSES, RoleApplication } from 'types'

const PAGE_SIZE = 25

const STATUS_VARIANT: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'secondary',
}

const RoleApplicationsAdmin: React.FC = () => {
    const { t } = useStrings()
    const r = t.roleApplications

    const applications = useStore((state) => state.roleApplications)
    const total = useStore((state) => state.roleApplicationsTotal)
    const loading = useStore((state) => state.roleApplicationsLoading)
    const filters = useStore((state) => state.roleApplicationFilters)
    const fetchRoleApplications = useStore((state) => state.fetchRoleApplications)

    const canDecide = useCan('role.application.write')

    const openReview = useModalOpen<boolean | null, RoleApplication>(MODAL.REVIEW_ROLE_APPLICATION)

    useEffect(() => {
        void fetchRoleApplications({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchRoleApplications])

    const rows = useMemo(
        () =>
            applications
                .map((application) =>
                    [
                        '<tr>',
                        `<td>${escapeHtml(formatDateTime(application.createdAt))}</td>`,
                        `<td>${escapeHtml(application.userName || application.userEmail)}</td>`,
                        `<td>${escapeHtml(application.roleName)}</td>`,
                        `<td><tc-badge variant="${STATUS_VARIANT[application.status] ?? 'secondary'}">` +
                            `${escapeHtml(r.statusLabels[application.status] ?? application.status)}</tc-badge></td>`,
                        `<td>${escapeHtml(application.message || '—')}</td>`,
                        `<td style="text-align:right"><span class="table-actions">${
                            canDecide && application.status === 'pending'
                                ? `<button type="button" class="btn btn-sm btn-primary" data-action="review" data-id="${escapeHtml(application.id)}">${escapeHtml(r.review)}</button>`
                                : ''
                        }</span></td>`,
                        '</tr>',
                    ].join('')
                )
                .join(''),
        [applications, canDecide, r]
    )

    return (
        <div className="module module-role-applications-admin">
            <tc-section-card title={r.queueTitle} icon="BadgeCheck">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{r.queueIntro}</tc-text>

                    <AdvancedTable
                        columns={[
                            { key: 'when', label: r.columnWhen, minWidth: '11rem' },
                            { key: 'account', label: r.columnAccount, minWidth: '12rem' },
                            { key: 'role', label: r.columnRole, minWidth: '9rem' },
                            { key: 'status', label: r.columnStatus, minWidth: '8rem' },
                            { key: 'message', label: r.columnMessage, minWidth: '16rem', hideBelow: 'md' },
                            { key: 'actions', label: '', minWidth: '6rem' },
                        ]}
                        filters={[
                            { key: 'q', label: t.common.search, type: 'text', placeholder: r.searchPlaceholder },
                            {
                                key: 'status',
                                label: r.filterStatus,
                                type: 'select',
                                placeholder: r.filterAll,
                                options: ROLE_APPLICATION_STATUSES.map((status) => ({
                                    value: status,
                                    label: r.statusLabels[status] ?? status,
                                })),
                            },
                        ]}
                        filterValues={{
                            q: filters.q ?? '',
                            status: filters.status ?? '',
                        }}
                        rows={rows}
                        total={total}
                        offset={filters.offset ?? 0}
                        limit={PAGE_SIZE}
                        loading={loading}
                        onFilterChange={(key, value) =>
                            void fetchRoleApplications({ [key]: value || undefined, offset: 0 })
                        }
                        onPageChange={(offset) => void fetchRoleApplications({ offset })}
                        onRowAction={(action, id) => {
                            const application = applications.find((entry) => entry.id === id)
                            if (application && action === 'review') openReview(application)
                        }}
                    />

                    {!loading && applications.length === 0 && (
                        <tc-empty-state
                            icon="BadgeCheck"
                            heading={r.queueEmptyHeading}
                            description={r.queueEmptyDescription}
                        ></tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default RoleApplicationsAdmin
