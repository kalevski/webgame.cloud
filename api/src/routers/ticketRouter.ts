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
import { TICKET_STATUSES, TICKET_STATUS_LABELS, encodeErrorCause } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import { rateLimit } from '../http/rateLimit.js'
import container from '../container.js'
import { TicketService } from '../services/TicketService.js'
import { recordRequestAudit } from '../audit.js'
import { notify } from '../notify.js'
import { ForbiddenError, NotFoundError } from '../domain/errors.js'

const tickets = () => container.resolve(TicketService)

const canModerateTickets = (request: FastifyRequest): boolean =>
    request.can('ticket.queue.read')

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
    const thread = await tickets().create(request.user!, request.body)
    void recordRequestAudit(request, 'create_ticket', thread.ticket.id, thread.ticket.subject)
    reply.code(201)
    return thread
}

const getTicketEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<TicketThread> => {
    const moderator = canModerateTickets(request)
    const thread = await tickets().thread(request.params.id, moderator)
    if (!thread || !canViewTicket(request, thread.ticket)) {
        throw new NotFoundError('ticket_not_found', undefined, [request.params.id])
    }
    return thread
}

const replyTicketEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { body: string; internal?: boolean } }>,
    reply: FastifyReply
) => {
    const ticket = await tickets().get(request.params.id)
    if (!ticket || !canViewTicket(request, ticket)) {
        throw new NotFoundError('ticket_not_found', undefined, [request.params.id])
    }
    const moderator = canModerateTickets(request)
    if (request.body.internal && !moderator) {
        throw new ForbiddenError('forbidden')
    }
    const message = await tickets().reply(
        request.user!,
        request.params.id,
        request.body.body,
        request.body.internal ?? false
    )
    void recordRequestAudit(request, 'reply_ticket', ticket.id, ticket.subject)
    if (!message.internal) void announceReply(request.user!, ticket, moderator)
    reply.code(201)
    return message
}

const patchTicketEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { status?: TicketStatus; assigneeId?: string | null } }>,
    reply: FastifyReply
) => {
    const ticket = await tickets().get(request.params.id)
    if (!ticket) {
        throw new NotFoundError('ticket_not_found', undefined, [request.params.id])
    }
    const updated = await tickets().update(request.params.id, {
        status: request.body.status ?? ticket.status,
        assigneeId: request.body.assigneeId !== undefined ? request.body.assigneeId : ticket.assigneeId,
    })
    void recordRequestAudit(request, 'update_ticket', updated.id, `${updated.subject}: ${updated.status}`)
    if (updated.status !== ticket.status) void announceStatus(request.user!, updated)
    return updated
}

const deleteTicketEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const ticket = await tickets().get(request.params.id)
    if (!ticket || !canViewTicket(request, ticket)) {
        throw new NotFoundError('ticket_not_found', undefined, [request.params.id])
    }
    if (ticket.ownerId !== request.user!.id && !request.can('ticket.queue.write')) {
        throw new ForbiddenError('forbidden')
    }
    await tickets().remove(request.params.id)
    void recordRequestAudit(request, 'delete_ticket', request.params.id, ticket.subject)
    reply.code(204)
    return null
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
