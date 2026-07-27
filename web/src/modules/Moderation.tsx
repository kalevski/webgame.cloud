import React, { useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import RouteTabs from 'components/RouteTabs'
import { MODAL, useModalOpen } from 'modals'
import { escapeHtml } from 'helpers/html'
import { AuditEntry, Report } from 'types'
import { formatDateTime } from 'helpers/dates'

type ModerationTab = 'reports' | 'audit'

const AUDIT_PAGE_SIZE = 25

const auditRow = (entry: AuditEntry): string =>
    [
        '<tr>',
        `<td>${escapeHtml(formatDateTime(entry.createdAt))}</td>`,
        `<td>${escapeHtml(entry.actorName || '—')}</td>`,
        `<td><code>${escapeHtml(entry.action)}</code></td>`,
        `<td>${escapeHtml(entry.targetId || '—')}</td>`,
        `<td>${escapeHtml(entry.detail || '')}</td>`,
        '</tr>',
    ].join('')

const Moderation: React.FC = () => {
    const { tab: tabParam } = useParams()
    const { t } = useStrings()
    const m = t.moderation
    const reports = useStore((state) => state.reports)
    const auditLog = useStore((state) => state.auditLog)
    const auditTotal = useStore((state) => state.auditTotal)
    const auditActions = useStore((state) => state.auditActions)
    const auditLoading = useStore((state) => state.auditLoading)
    const auditFilters = useStore((state) => state.auditFilters)
    const fetchReports = useStore((state) => state.fetchReports)
    const fetchAuditLog = useStore((state) => state.fetchAuditLog)

    const [searchParams] = useSearchParams()
    const actorParam = searchParams.get('actor') ?? undefined

    useEffect(() => {
        fetchReports()
    }, [fetchReports])

    useEffect(() => {
        void fetchAuditLog({ actorId: actorParam, limit: AUDIT_PAGE_SIZE, offset: 0 })
    }, [fetchAuditLog, actorParam])

    const tabs = [
        { id: 'reports', label: m.reportsTitle, icon: 'flag', path: '/moderation/reports' },
        { id: 'audit', label: m.auditTitle, icon: 'history', path: '/moderation/audit' },
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : available[0]) as ModerationTab

    const open = reports.filter((report) => report.status === 'pending')

    const openResolveModal = useModalOpen<boolean, string>(MODAL.RESOLVE_REPORT)

    const reportRow = (report: Report): string =>
        `<li class="tc-data-list__row" data-id="${escapeHtml(report.id)}">` +
        `<tc-status-dot status="busy" pulse></tc-status-dot>` +
        `<div class="tc-data-list__text">` +
        `<span class="tc-data-list__primary">${escapeHtml(report.targetLabel)}</span>` +
        `<span class="tc-data-list__secondary">${escapeHtml(report.targetKind)} · ${escapeHtml(report.reason)} · ${escapeHtml(report.reporterName)}</span>` +
        `</div>` +
        `<button type="button" class="btn btn-sm btn-primary" data-action="resolve">${escapeHtml(m.resolve)}</button>` +
        `</li>`

    const reportsList = useTc<HTMLElement>({
        items: open,
        renderRow: reportRow,
        onAction: (detail: { action: string; id: string }) => {
            if (detail.action === 'resolve') openResolveModal(detail.id)
        },
    })

    const auditRows = useMemo(() => auditLog.map(auditRow).join(''), [auditLog])

    const auditTable = useTc<HTMLElement>({
        columns: [
            { key: 'when', label: m.auditWhen, minWidth: '12rem' },
            { key: 'actor', label: m.auditActor, minWidth: '10rem' },
            { key: 'action', label: m.auditAction, minWidth: '10rem' },
            { key: 'target', label: m.auditTarget, hideBelow: 'md' },
            { key: 'detail', label: m.auditDetail, minWidth: '16rem', hideBelow: 'sm' },
        ],
        filters: [
            { key: 'q', label: t.common.search, type: 'text', placeholder: m.auditSearchPlaceholder },
            {
                key: 'action',
                label: m.auditAction,
                type: 'select',
                placeholder: m.auditAll,
                options: auditActions.map((action) => ({ value: action, label: action })),
            },
        ],
        filterValues: auditFilters as Record<string, unknown>,
        rows: auditRows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchAuditLog({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchAuditLog({ offset })
        },
    })

    const fromPicker = useTc<HTMLElement>({
        onChange: (value: unknown) => void fetchAuditLog({ from: (value as string) || undefined, offset: 0 }),
    })

    const toPicker = useTc<HTMLElement>({
        onChange: (value: unknown) => void fetchAuditLog({ to: (value as string) || undefined, offset: 0 }),
    })

    return (
        <div className="module module-moderation">
            <tc-rich-page-header
                className="module-workspace__header"
                title-text={t.pages.moderationTitle}
                description={t.pages.moderationDescription}
                icon-name="ShieldAlert"
                icon-color="rose"
            ></tc-rich-page-header>

            <RouteTabs tabs={tabs} activeId={tab} />

            <div className="module-workspace__content">
                {tab === 'reports' && (
                    open.length > 0
                        ? <tc-data-list ref={reportsList}></tc-data-list>
                        : <tc-empty-state icon="flag">{m.reportsEmpty}</tc-empty-state>
                )}
                {tab === 'audit' && (
                    <div className="module-moderation__audit">
                        {actorParam && (
                            <tc-alert variant="info">{m.auditFilteredByActor}</tc-alert>
                        )}
                        <div className="module-moderation__audit-dates">
                            <div>
                                <tc-label>{m.auditFrom}</tc-label>
                                <tc-date-picker ref={fromPicker}></tc-date-picker>
                            </div>
                            <div>
                                <tc-label>{m.auditTo}</tc-label>
                                <tc-date-picker ref={toPicker}></tc-date-picker>
                            </div>
                        </div>
                        <tc-advanced-table
                            ref={auditTable}
                            limit={AUDIT_PAGE_SIZE}
                            offset={auditFilters.offset ?? 0}
                            total={auditTotal}
                            loading={auditLoading || undefined}
                        ></tc-advanced-table>
                        {!auditLoading && auditLog.length === 0 && (
                            <tc-empty-state icon="history">{m.auditEmpty}</tc-empty-state>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Moderation
