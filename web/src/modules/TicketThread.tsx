import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import Loading from 'components/Loading'
import { useTcEvents, detailValue } from '@toolcase/web-components/react'
import { TICKET_STATUSES, TicketMessage, TicketStatus, isTicketOpen } from 'types'
import { formatDateTime, formatRelative } from 'helpers/dates'

type ValueElement = HTMLElement & { value?: string }

const Message: React.FC<{ message: TicketMessage; reporter: boolean }> = ({ message, reporter }) => {
    const { t } = useStrings()
    const k = t.tickets

    return (
        <article
            className="ticket-message"
            data-role={reporter ? 'reporter' : 'moderator'}
            data-internal={message.internal ? 'true' : undefined}
        >
            <header className="ticket-message__head">
                <span className="ticket-message__author">{message.authorName}</span>
                <span aria-hidden="true">·</span>
                <span className="ticket-message__role">
                    {message.internal ? k.internalBadge : reporter ? k.roleReporter : k.roleModerator}
                </span>
                <span aria-hidden="true">·</span>
                <span title={formatDateTime(message.createdAt)}>{formatRelative(message.createdAt)}</span>
            </header>
            <p className="ticket-message__body">{message.body}</p>
        </article>
    )
}

const TicketThread: React.FC<{ id: string }> = ({ id }) => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const k = t.tickets

    const thread = useStore((state) => state.ticketThread)
    const loading = useStore((state) => state.ticketThreadLoading)
    const fetchTicketThread = useStore((state) => state.fetchTicketThread)
    const replyToTicket = useStore((state) => state.replyToTicket)
    const updateTicket = useStore((state) => state.updateTicket)
    const deleteTicket = useStore((state) => state.deleteTicket)
    const me = useStore((state) => state.me)

    const canModerate = useCan('ticket.queue.read')
    const canManage = useCan('ticket.queue.write')

    const [body, setBody] = useState('')
    const [internal, setInternal] = useState(false)
    const [sending, setSending] = useState(false)
    const bodyEl = useRef<ValueElement | null>(null)
    const internalEl = useRef<(HTMLElement & { checked?: boolean }) | null>(null)

    useEffect(() => {
        void fetchTicketThread(id)
    }, [fetchTicketThread, id])

    useEffect(() => {
        if (internalEl.current) internalEl.current.checked = internal
    }, [internal])

    const statusSelect = useTcEvents<ValueElement>({
        'tc-change': (event: Event) => {
            const next = detailValue<string>(event as CustomEvent) ?? ''
            if (next && next !== thread?.ticket.status) {
                void updateTicket(id, { status: next as TicketStatus })
            }
        },
    })

    if (loading && !thread) return <Loading />
    if (!thread) return <tc-empty-state icon="life-buoy">{t.errors.ticket_not_found}</tc-empty-state>

    const { ticket, messages } = thread
    const replyable = isTicketOpen(ticket.status)

    const handleSend = async () => {
        if (sending || !body.trim()) return
        setSending(true)
        try {
            const sent = await replyToTicket(id, body, internal)
            if (sent) {
                setBody('')
                setInternal(false)
                if (bodyEl.current) bodyEl.current.value = ''
            }
        } finally {
            setSending(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm(k.deletePrompt(ticket.subject))) return
        const removed = await deleteTicket(id)
        if (removed) navigate('/tickets')
    }

    return (
        <div
            className="module module-ticket-thread"
            style={{ '--tk-state': `var(--tk-${ticket.status})` } as React.CSSProperties}
        >
            <tc-section-card title={ticket.subject} icon="LifeBuoy">
                <span slot="action" className="section-card-actions">
                    {(canManage || ticket.ownerId === me?.id) && (
                        <tc-button variant="danger" size="sm" outline onClick={handleDelete}>
                            {k.delete}
                        </tc-button>
                    )}
                </span>

                <tc-stack direction="column" gap="0.85rem">
                    <div className="module-ticket-thread__summary">
                        <span className="ticket-state">{k.statusLabels[ticket.status]}</span>
                        <span className="module-ticket-thread__opened" title={formatDateTime(ticket.createdAt)}>
                            {k.openedBy(ticket.ownerName, formatRelative(ticket.createdAt))}
                        </span>
                    </div>

                    {canManage && (
                        <div className="module-ticket-thread__manage">
                            <tc-select
                                ref={statusSelect}
                                label={k.statusLabel}
                                value={ticket.status}
                            >
                                {TICKET_STATUSES.map((status) => (
                                    <tc-option key={status} value={status}>{k.statusLabels[status]}</tc-option>
                                ))}
                            </tc-select>
                            <div className="module-ticket-thread__assignee">
                                <tc-label>{k.assignLabel}</tc-label>
                                <span className="module-ticket-thread__assignee-name">
                                    {ticket.assigneeName || k.unassigned}
                                </span>
                                {ticket.assigneeId !== me?.id && (
                                    <tc-button
                                        variant="secondary"
                                        size="sm"
                                        outline
                                        onClick={() => void updateTicket(id, { assigneeId: me?.id ?? null })}
                                    >
                                        {k.claim}
                                    </tc-button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="module-ticket-thread__messages">
                        {messages.map((message) => (
                            <Message
                                key={message.id}
                                message={message}
                                reporter={message.authorId === ticket.ownerId}
                            />
                        ))}
                    </div>

                    {replyable ? (
                        <tc-stack direction="column" gap="0.6rem" className="module-ticket-thread__reply">
                            <tc-textarea
                                ref={bodyEl}
                                label={k.replyLabel}
                                placeholder={k.replyPlaceholder}
                                rows="4"
                                onInput={(event: React.FormEvent<ValueElement>) => {
                                    setBody(String((event.target as ValueElement).value ?? ''))
                                }}
                            ></tc-textarea>

                            {canModerate && (
                                <tc-switch
                                    ref={internalEl}
                                    checked={internal || undefined}
                                    label={k.replyInternal}
                                    onClick={() => setInternal((current) => !current)}
                                ></tc-switch>
                            )}

                            <div>
                                <tc-button
                                    variant="primary"
                                    disabled={!body.trim() || sending || undefined}
                                    onClick={handleSend}
                                >
                                    {k.replySend}
                                </tc-button>
                            </div>
                        </tc-stack>
                    ) : (
                        <tc-helper-text icon="Info">{k.replyClosed}</tc-helper-text>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default TicketThread
