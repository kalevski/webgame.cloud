import React, { useEffect } from 'react'
import { Link } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan, { useResourceLimits } from 'hooks/useCan'
import { useLimitLock } from 'hooks/useLock'
import { TICKET_LIMIT_ENTITLEMENT } from 'configs/entitlements'
import LimitMeter from 'components/LimitMeter'
import LockedAction from 'components/LockedAction'
import { MODAL, useModalOpen } from 'modals'
import { CreateTicketResult } from 'modals/CreateTicketModal'
import { Ticket, isTicketOpen } from 'types'
import { formatDateTime, formatRelative } from 'helpers/dates'

const TicketRow: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
    const { t } = useStrings()
    const k = t.tickets

    return (
        <Link
            to={`/tickets/${ticket.id}`}
            className="ticket-row"
            style={{ '--tk-state': `var(--tk-${ticket.status})` } as React.CSSProperties}
        >
            <div className="ticket-row__main">
                <span className="ticket-row__subject">{ticket.subject}</span>
                <span className="ticket-row__meta">
                    <span title={formatDateTime(ticket.createdAt)}>
                        {k.openedAgo(formatRelative(ticket.createdAt))}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{k.replyCount(ticket.messageCount)}</span>
                </span>
            </div>

            <div className="ticket-row__side">
                <span className="ticket-state">{k.statusLabels[ticket.status]}</span>
                <span className="ticket-row__age" title={formatDateTime(ticket.lastMessageAt)}>
                    {k.activeAgo(formatRelative(ticket.lastMessageAt))}
                </span>
            </div>
        </Link>
    )
}

const TicketList: React.FC = () => {
    const { t } = useStrings()
    const k = t.tickets

    const tickets = useStore((state) => state.tickets)
    const ticketsLoaded = useStore((state) => state.ticketsLoaded)
    const fetchTickets = useStore((state) => state.fetchTickets)
    const createTicket = useStore((state) => state.createTicket)

    const canCreate = useCan('ticket.create')

    useEffect(() => {
        void fetchTickets()
    }, [fetchTickets])

    const limits = useResourceLimits()
    const used = tickets.filter((ticket) => isTicketOpen(ticket.status)).length
    const reached = limits.tickets !== null && used >= limits.tickets
    const lock = useLimitLock(reached, TICKET_LIMIT_ENTITLEMENT)

    const openCreate = useModalOpen<CreateTicketResult>(MODAL.CREATE_TICKET, async (result) => {
        if (result) await createTicket(result)
    })

    return (
        <div className="module module-tickets">
            <tc-section-card title={k.title} icon="LifeBuoy">
                {canCreate && (
                    <span slot="action" className="section-card-actions">
                        <LockedAction lock={lock} onClick={() => openCreate()}>
                            <tc-button variant="primary">{k.newTicket}</tc-button>
                        </LockedAction>
                    </span>
                )}

                <tc-stack direction="column" gap="0.85rem">
                    <LimitMeter
                        used={used}
                        limit={limits.tickets}
                        noun="open tickets"
                        resource="tickets"
                        onUpgrade={lock.open}
                    />

                    {ticketsLoaded && tickets.length === 0 ? (
                        <tc-empty-state heading={k.empty} icon="life-buoy">
                            <p className="module-tickets__empty-hint">{k.emptyHint}</p>
                            {canCreate && (
                                <tc-button slot="action" variant="primary" onClick={() => openCreate()}>
                                    {k.newTicket}
                                </tc-button>
                            )}
                        </tc-empty-state>
                    ) : (
                        <div className="module-tickets__list">
                            {tickets.map((ticket) => (
                                <TicketRow key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default TicketList
