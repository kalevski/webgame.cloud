import { inject, injectable } from 'tsyringe'
import type {
    Ticket,
    TicketDraft,
    TicketFilters,
    TicketMessage,
    TicketQueueResult,
    TicketStatus,
    TicketThread,
    User,
} from '../contracts/index.js'
import { TICKET_STATUSES, isTicketOpen } from '../contracts/index.js'
import { TicketRepository } from '../repositories/tickets/TicketRepository.js'
import { TicketMessageRepository } from '../repositories/tickets/TicketMessageRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'
import type { TicketMessageRow, TicketRow } from '../schema/tickets.js'

const toTicket = (row: TicketRow): Ticket => ({
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name ?? '',
    subject: row.subject,
    status: row.status,
    messageCount: Number(row.message_count),
    lastMessageAt: row.last_message_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

const toMessage = (row: TicketMessageRow): TicketMessage => ({
    id: row.id,
    ticketId: row.ticket_id,
    authorId: row.author_id,
    authorName: row.author_name ?? '',
    body: row.body,
    internal: row.internal,
    createdAt: row.created_at.toISOString(),
})

const emptyCounts = (): Record<TicketStatus, number> =>
    Object.fromEntries(TICKET_STATUSES.map((status) => [status, 0])) as Record<TicketStatus, number>

@injectable()
export class TicketService {
    constructor(
        @inject(TicketRepository) private tickets: TicketRepository,
        @inject(TicketMessageRepository) private messages: TicketMessageRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    async listForOwner(ownerId: string): Promise<Ticket[]> {
        const rows = await this.tickets.listForOwner(ownerId)
        return rows.map(toTicket)
    }

    async listQueue(filters: TicketFilters): Promise<TicketQueueResult> {
        const [rows, total, byStatus] = await Promise.all([
            this.tickets.listQueue(filters),
            this.tickets.countQueue(filters),
            this.tickets.countByStatus(),
        ])
        const counts = emptyCounts()
        for (const entry of byStatus) counts[entry.status] = entry.c
        return { tickets: rows.map(toTicket), total, counts }
    }

    async get(id: string): Promise<Ticket | null> {
        const row = await this.tickets.findById(id)
        return row ? toTicket(row) : null
    }

    async thread(id: string, includeInternal: boolean): Promise<TicketThread | null> {
        const ticket = await this.get(id)
        if (!ticket) return null
        const rows = await this.messages.listForTicket(id)
        const messages = rows.map(toMessage).filter((message) => includeInternal || !message.internal)
        return { ticket, messages }
    }

    async create(user: User, draft: TicketDraft): Promise<TicketThread> {
        if (!draft.subject.trim()) {
            throw new ValidationError('ticket_subject_required', 'a ticket needs a subject')
        }
        if (!draft.body.trim()) {
            throw new ValidationError('ticket_message_required', 'a ticket needs a description')
        }
        await this.access.assertWithinLimit(user, 'tickets')

        const row = await this.tickets.create(user.id, draft.subject)
        await this.messages.create(row.id, user.id, draft.body, false)

        const thread = await this.thread(row.id, true)
        return thread!
    }

    async reply(user: User, id: string, body: string, internal: boolean): Promise<TicketMessage> {
        if (!body.trim()) {
            throw new ValidationError('ticket_message_required', 'a reply needs a body')
        }
        const ticket = await this.get(id)
        if (!ticket) throw new NotFoundError('ticket_not_found', `ticket ${id} not found`, [id])
        if (!isTicketOpen(ticket.status)) {
            throw new ValidationError('ticket_closed', 'this ticket is no longer open')
        }

        const row = await this.messages.create(id, user.id, body, internal)
        await this.tickets.touch(id)
        return toMessage(row)
    }

    async update(id: string, patch: { status: TicketStatus; assigneeId: string | null }): Promise<Ticket> {
        const row = await this.tickets.updateFields(id, patch)
        if (!row) throw new NotFoundError('ticket_not_found', `ticket ${id} not found`, [id])
        return toTicket(row)
    }

    async remove(id: string): Promise<void> {
        const removed = await this.tickets.remove(id)
        if (!removed) throw new NotFoundError('ticket_not_found', `ticket ${id} not found`, [id])
    }
}
