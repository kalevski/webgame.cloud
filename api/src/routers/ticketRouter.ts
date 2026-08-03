import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    Ticket,
    TicketDraft,
    TicketFilters,
    TicketQueueResult,
    TicketStatus,
    TicketThread,
    User,
} from '../contracts/index.js'
import { OWNER_ROLE_ID, TICKET_STATUSES, TICKET_STATUS_LABELS, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import { rateLimit } from '../http/rateLimit.js'
import container from '../container.js'
import { TicketService } from '../services/TicketService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'
import { notify } from '../notify.js'

const tickets = () => container.resolve(TicketService)

const canModerateTickets = (request: FastifyRequest): boolean =>
    request.user!.role === OWNER_ROLE_ID || request.can('ticket.queue.read')

const canViewTicket = (request: FastifyRequest, ticket: Ticket): boolean =>
    ticket.ownerId === request.user!.id || canModerateTickets(request)

const announceReply = async (actor: User, ticket: Ticket, moderator: boolean): Promise<void> => {
    const recipient = moderator ? ticket.ownerId : ticket.assigneeId
    if (!recipient || recipient === actor.id) return
    await notify(
        recipient,
        'ticket_reply',
        `${actor.name || actor.email} replied to "${ticket.subject}"`,
        `/tickets/${ticket.id}`,
        { collapse: true }
    )
}

const announceStatus = async (actor: User, ticket: Ticket): Promise<void> => {
    if (ticket.ownerId === actor.id) return
    await notify(
        ticket.ownerId,
        'ticket_status',
        `"${ticket.subject}" is now ${TICKET_STATUS_LABELS[ticket.status]}`,
        `/tickets/${ticket.id}`
    )
}

const ticketSchema = {
    type: 'object',
    required: ['subject', 'body'],
    additionalProperties: false,
    properties: {
        subject: { type: 'string', minLength: 1, maxLength: 200 },
        body: { type: 'string', minLength: 1, maxLength: 10000 },
    },
} as const

const messageSchema = {
    type: 'object',
    required: ['body'],
    additionalProperties: false,
    properties: {
        body: { type: 'string', minLength: 1, maxLength: 10000 },
        internal: { type: 'boolean' },
    },
} as const

const patchSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...TICKET_STATUSES] },
        assigneeId: { type: ['string', 'null'], maxLength: 60 },
    },
} as const

const queueQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...TICKET_STATUSES] },
        assigneeId: { type: 'string', maxLength: 60 },
        q: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { type: 'integer', minimum: 0, maximum: 1000000 },
    },
} as const

const listTicketsEndpoint = async (request: FastifyRequest): Promise<Ticket[]> =>
    tickets().listForOwner(request.user!.id)

const listQueueEndpoint = async (
    request: FastifyRequest<{ Querystring: TicketFilters }>
): Promise<TicketQueueResult> => tickets().listQueue(request.query)

const createTicketEndpoint = async (request: FastifyRequest<{ Body: TicketDraft }>, reply: FastifyReply) => {
    try {
        const thread = await tickets().create(request.user!, request.body)
        void recordAudit(request.user!, 'create_ticket', thread.ticket.id, thread.ticket.subject, request.id)
        reply.code(201)
        return thread
    } catch (error) {
        return sendError(reply, error)
    }
}

const getTicketEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<TicketThread | { error: string }> => {
    const moderator = canModerateTickets(request)
    const thread = await tickets().thread(request.params.id, moderator)
    if (!thread || !canViewTicket(request, thread.ticket)) {
        reply.code(404)
        return { error: encodeErrorCause('ticket_not_found', request.params.id) }
    }
    return thread
}

const replyTicketEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { body: string; internal?: boolean } }>,
    reply: FastifyReply
) => {
    try {
        const ticket = await tickets().get(request.params.id)
        if (!ticket || !canViewTicket(request, ticket)) {
            reply.code(404)
            return { error: encodeErrorCause('ticket_not_found', request.params.id) }
        }
        const moderator = canModerateTickets(request)
        if (request.body.internal && !moderator) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        const message = await tickets().reply(
            request.user!,
            request.params.id,
            request.body.body,
            request.body.internal ?? false
        )
        void recordAudit(request.user!, 'reply_ticket', ticket.id, ticket.subject, request.id)
        if (!message.internal) void announceReply(request.user!, ticket, moderator)
        reply.code(201)
        return message
    } catch (error) {
        return sendError(reply, error)
    }
}

const patchTicketEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { status?: TicketStatus; assigneeId?: string | null } }>,
    reply: FastifyReply
) => {
    try {
        const ticket = await tickets().get(request.params.id)
        if (!ticket) {
            reply.code(404)
            return { error: encodeErrorCause('ticket_not_found', request.params.id) }
        }
        const updated = await tickets().update(request.params.id, {
            status: request.body.status ?? ticket.status,
            assigneeId: request.body.assigneeId !== undefined ? request.body.assigneeId : ticket.assigneeId,
        })
        void recordAudit(request.user!, 'update_ticket', updated.id, `${updated.subject}: ${updated.status}`, request.id)
        if (updated.status !== ticket.status) void announceStatus(request.user!, updated)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteTicketEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const ticket = await tickets().get(request.params.id)
        if (!ticket || !canViewTicket(request, ticket)) {
            reply.code(404)
            return { error: encodeErrorCause('ticket_not_found', request.params.id) }
        }
        if (ticket.ownerId !== request.user!.id && !request.can('ticket.queue.write')) {
            reply.code(403)
            return { error: encodeErrorCause('forbidden') }
        }
        await tickets().remove(request.params.id)
        void recordAudit(request.user!, 'delete_ticket', request.params.id, ticket.subject, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const ticketRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)
    app.addHook('preHandler', requireFeature('tickets'))

    app.get('/api/tickets', listTicketsEndpoint)

    app.get<{ Querystring: TicketFilters }>(
        '/api/tickets/queue',
        { schema: { querystring: queueQuerySchema }, preHandler: [requirePermission('ticket.queue.read')] },
        listQueueEndpoint
    )

    app.post<{ Body: TicketDraft }>(
        '/api/tickets',
        {
            schema: { body: ticketSchema },
            preHandler: [
                requirePermission('ticket.create'),
                rateLimit({ name: 'ticket_create', max: 10, windowSeconds: 3600 }),
            ],
        },
        createTicketEndpoint
    )

    app.get<{ Params: { id: string } }>('/api/tickets/:id', getTicketEndpoint)

    app.post<{ Params: { id: string }; Body: { body: string; internal?: boolean } }>(
        '/api/tickets/:id/messages',
        { schema: { body: messageSchema } },
        replyTicketEndpoint
    )

    app.patch<{ Params: { id: string }; Body: { status?: TicketStatus; assigneeId?: string | null } }>(
        '/api/tickets/:id',
        { schema: { body: patchSchema }, preHandler: [requirePermission('ticket.queue.write')] },
        patchTicketEndpoint
    )

    app.delete<{ Params: { id: string } }>('/api/tickets/:id', deleteTicketEndpoint)
}
