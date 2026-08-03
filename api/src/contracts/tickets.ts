export const TICKET_STATUSES = [
    'open',
    'in_progress',
    'waiting_on_user',
    'resolved',
    'closed',
] as const

export type TicketStatus = typeof TICKET_STATUSES[number]

export const TICKET_OPEN_STATUSES: readonly TicketStatus[] = ['open', 'in_progress', 'waiting_on_user']

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    in_progress: 'In progress',
    waiting_on_user: 'Waiting on reporter',
    resolved: 'Resolved',
    closed: 'Closed',
}

export const isTicketOpen = (status: TicketStatus): boolean => TICKET_OPEN_STATUSES.includes(status)

export type Ticket = {
    id: string

    ownerId: string
    ownerName: string

    assigneeId: string | null
    assigneeName: string

    subject: string
    status: TicketStatus

    messageCount: number
    lastMessageAt: string
    createdAt: string
    updatedAt: string
}

export type TicketDraft = {
    subject: string
    body: string
}

export type TicketMessage = {
    id: string
    ticketId: string

    authorId: string | null
    authorName: string

    body: string

    internal: boolean
    createdAt: string
}

export type TicketThread = {
    ticket: Ticket
    messages: TicketMessage[]
}

export type TicketFilters = {
    status?: TicketStatus

    assigneeId?: string

    q?: string

    limit?: number
    offset?: number
}

export type TicketQueueResult = {
    tickets: Ticket[]
    total: number

    counts: Record<TicketStatus, number>
}
