import type { TicketStatus } from '../contracts/index.js'

export type TicketRow = {
    id: string
    owner_id: string
    owner_name: string
    assignee_id: string | null
    assignee_name: string | null
    subject: string
    status: TicketStatus
    message_count: string
    last_message_at: Date
    created_at: Date
    updated_at: Date
}

export type TicketMessageRow = {
    id: string
    ticket_id: string
    author_id: string | null
    author_name: string | null
    body: string
    internal: boolean
    created_at: Date
}
