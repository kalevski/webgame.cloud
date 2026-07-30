import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { MODAL, useModalOpen } from 'modals'
import { EMAIL_STATUSES, EmailStatus } from 'types'
import { formatDateTime } from 'helpers/dates'

const STATUS_VARIANTS: Record<EmailStatus, string> = {
    queued: 'warning',
    sending: 'info',
    sent: 'success',
    failed: 'danger',
    canceled: 'secondary',
}

const PAGE_SIZE = 25

const EmailOutbox: React.FC = () => {
    const { t } = useStrings()
    const e = t.email
    const messages = useStore((state) => state.emailMessages)
    const total = useStore((state) => state.emailTotal)
    const stats = useStore((state) => state.emailStats)
    const loading = useStore((state) => state.emailLoading)
    const filters = useStore((state) => state.emailFilters)
    const templates = useStore((state) => state.emailTemplates)
    const fetchEmailMessages = useStore((state) => state.fetchEmailMessages)
    const fetchEmailTemplates = useStore((state) => state.fetchEmailTemplates)
    const setEmailMessageStatus = useStore((state) => state.setEmailMessageStatus)

    const canSend = useCan('email.send')

    const openCompose = useModalOpen<{ queued: number } | null, void>(MODAL.EMAIL_COMPOSE)

    useEffect(() => {
        void fetchEmailTemplates()
        void fetchEmailMessages({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchEmailTemplates, fetchEmailMessages])

    const rows = useMemo(
        () =>
            messages
                .map((message) => {
                    const canRetry = canSend && (message.status === 'failed' || message.status === 'canceled')
                    const canCancel = canSend && message.status === 'queued'
                    return [
                        '<tr>',
                        `<td>${escapeHtml(message.toName || message.toEmail)}<br><small>${escapeHtml(message.toEmail)}</small></td>`,
                        `<td>${escapeHtml(message.subject)}</td>`,
                        `<td><tc-badge variant="${STATUS_VARIANTS[message.status]}">${escapeHtml(e.statusLabels[message.status])}</tc-badge></td>`,
                        `<td>${escapeHtml(message.templateKey ?? '—')}</td>`,
                        `<td>${escapeHtml(formatDateTime(message.scheduledAt))}</td>`,
                        `<td style="text-align:right">${message.attempts}</td>`,
                        '<td style="text-align:right"><span class="table-actions">',
                        canRetry
                            ? `<tc-icon-button icon="RotateCw" variant="secondary" size="small" outline data-message="${escapeHtml(message.id)}" data-status="queued" label="${escapeHtml(e.retry)}" title="${escapeHtml(e.retry)}"></tc-icon-button>`
                            : '',
                        canCancel
                            ? `<tc-icon-button icon="Ban" variant="danger" size="small" outline data-message="${escapeHtml(message.id)}" data-status="canceled" label="${escapeHtml(e.cancel)}" title="${escapeHtml(e.cancel)}"></tc-icon-button>`
                            : '',
                        '</span></td>',
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [messages, e, canSend]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'to', label: e.columnTo, minWidth: '14rem' },
            { key: 'subject', label: e.columnSubject, minWidth: '16rem' },
            { key: 'status', label: e.columnStatus },
            { key: 'template', label: e.columnTemplate, hideBelow: 'md' },
            { key: 'scheduled', label: e.columnScheduled, hideBelow: 'sm' },
            { key: 'attempts', label: e.columnAttempts, align: 'right', hideBelow: 'lg' },
            { key: 'actions', label: '', align: 'right', minWidth: '7rem' },
        ],
        filters: [
            { key: 'q', label: e.filterSearch, type: 'text', placeholder: e.filterSearchPlaceholder },
            {
                key: 'status',
                label: e.filterStatus,
                type: 'select',
                placeholder: e.filterAll,
                options: EMAIL_STATUSES.map((status) => ({ value: status, label: e.statusLabels[status] })),
            },
            {
                key: 'templateKey',
                label: e.filterTemplate,
                type: 'select',
                placeholder: e.filterAll,
                options: templates.map((template) => ({ value: template.key, label: template.name })),
            },
        ],
        filterValues: filters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchEmailMessages({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchEmailMessages({ offset })
        },
    })

    const statTiles = useTc<HTMLElement>({
        items: EMAIL_STATUSES.map((status) => ({
            key: status,
            label: e.statusLabels[status],
            value: String(stats[status]),
        })),
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-message]')
        if (!button) return
        const id = button.dataset.message
        const status = button.dataset.status as EmailStatus | undefined
        if (id && status) void setEmailMessageStatus(id, status)
    }

    return (
        <div className="module module-email-outbox" role="presentation" onClick={onClick}>
            <tc-section-card title={e.outboxTitle} icon="Inbox">
                <span slot="action" className="section-card-actions">
                    {canSend && (
                        <tc-button variant="primary" onClick={() => openCompose()}>
                            {e.compose}
                        </tc-button>
                    )}
                </span>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{e.outboxIntro}</tc-text>

                    <tc-metric-grid ref={statTiles} columns="5"></tc-metric-grid>

                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={filters.offset ?? 0}
                        total={total}
                        loading={loading || undefined}
                        sticky-last-column
                    ></tc-advanced-table>

                    {!loading && messages.length === 0 && (
                        <tc-empty-state icon="inbox">{e.outboxEmpty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default EmailOutbox
