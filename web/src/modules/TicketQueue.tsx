import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { TICKET_STATUSES } from 'types'
import { formatDateTime, formatRelative } from 'helpers/dates'

const PAGE_SIZE = 25

const TicketQueue: React.FC = () => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const k = t.tickets

    const queue = useStore((state) => state.ticketQueue)
    const total = useStore((state) => state.ticketQueueTotal)
    const counts = useStore((state) => state.ticketQueueCounts)
    const loading = useStore((state) => state.ticketQueueLoading)
    const filters = useStore((state) => state.ticketFilters)
    const fetchTicketQueue = useStore((state) => state.fetchTicketQueue)

    useEffect(() => {
        void fetchTicketQueue({ limit: PAGE_SIZE, offset: 0 })
    }, [fetchTicketQueue])

    const rows = useMemo(
        () =>
            queue
                .map((ticket) =>
                    [
                        '<tr>',
                        `<td><a href="/tickets/${escapeHtml(ticket.id)}" data-ticket="${escapeHtml(ticket.id)}">${escapeHtml(ticket.subject)}</a></td>`,
                        `<td>${escapeHtml(ticket.ownerName)}</td>`,
                        `<td><span class="ticket-state" style="--tk-state:var(--tk-${escapeHtml(ticket.status)})">${escapeHtml(k.statusLabels[ticket.status])}</span></td>`,
                        `<td>${escapeHtml(ticket.assigneeName || k.unassigned)}</td>`,
                        `<td style="text-align:right">${ticket.messageCount}</td>`,
                        `<td title="${escapeHtml(formatDateTime(ticket.lastMessageAt))}">${escapeHtml(formatRelative(ticket.lastMessageAt))}</td>`,
                        '</tr>',
                    ].join('')
                )
                .join(''),
        [queue, k]
    )

    const table = useTc<HTMLElement>({
        columns: [
            { key: 'subject', label: k.colSubject, minWidth: '18rem' },
            { key: 'reporter', label: k.colReporter, hideBelow: 'md' },
            { key: 'status', label: k.colStatus },
            { key: 'assignee', label: k.colAssignee, hideBelow: 'md' },
            { key: 'messages', label: k.colMessages, align: 'right', hideBelow: 'lg' },
            { key: 'updated', label: k.colUpdated, hideBelow: 'sm' },
        ],
        filters: [
            { key: 'q', label: k.filterSearch, type: 'text', placeholder: k.filterSearchPlaceholder },
            {
                key: 'status',
                label: k.filterStatus,
                type: 'select',
                placeholder: k.filterAll,
                options: TICKET_STATUSES.map((status) => ({ value: status, label: k.statusLabels[status] })),
            },
        ],
        filterValues: filters as Record<string, unknown>,
        rows,
        onFilterChange: (key: string, value: unknown) => {
            void fetchTicketQueue({ [key]: (value as string) || undefined, offset: 0 })
        },
        onPageChange: (offset: number) => {
            void fetchTicketQueue({ offset })
        },
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const link = (event.target as HTMLElement).closest<HTMLElement>('[data-ticket]')
        if (!link?.dataset.ticket) return
        event.preventDefault()
        navigate(`/tickets/${link.dataset.ticket}`)
    }

    return (
        <div className="module module-ticket-queue" role="presentation" onClick={onClick}>
            <tc-section-card title={k.tabQueue} icon="LifeBuoy">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{k.queueIntro}</tc-text>

                    {counts && (
                        <div className="module-ticket-queue__summary">
                            {TICKET_STATUSES.map((status) => (
                                <span
                                    key={status}
                                    className="module-ticket-queue__count"
                                    data-empty={counts[status] === 0 ? 'true' : undefined}
                                    style={{ '--tk-state': `var(--tk-${status})` } as React.CSSProperties}
                                >
                                    <b>{counts[status]}</b>
                                    {k.statusLabels[status]}
                                </span>
                            ))}
                        </div>
                    )}

                    <tc-advanced-table
                        ref={table}
                        limit={PAGE_SIZE}
                        offset={filters.offset ?? 0}
                        total={total}
                        loading={loading || undefined}
                    ></tc-advanced-table>

                    {!loading && queue.length === 0 && (
                        <tc-empty-state heading={k.queueEmpty} icon="life-buoy">{k.queueEmptyHint}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default TicketQueue
