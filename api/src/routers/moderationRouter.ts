import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { AuditFilters, AuditEntry, Report, ReportStatus, ReportTargetKind } from '../contracts/index.js'
import { REPORT_TARGET_KINDS } from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { rateLimit } from '../http/rateLimit.js'
import container from '../container.js'
import { ModerationService } from '../services/ModerationService.js'
import { sendError } from './sendError.js'

const moderation = () => container.resolve(ModerationService)

const reportSchema = {
    type: 'object',
    required: ['targetKind', 'targetId'],
    additionalProperties: false,
    properties: {
        targetKind: { type: 'string', enum: [...REPORT_TARGET_KINDS] },
        targetId: { type: 'string', minLength: 1, maxLength: 100 },
        reason: { type: 'string', maxLength: 1000 },
    },
} as const

const listQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: ['pending', 'resolved'] },
        offset: { type: 'integer', minimum: 0, maximum: 1000000 },
    },
} as const

const auditFilterSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        actorId: { type: 'string', maxLength: 60 },
        action: { type: 'string', maxLength: 60 },
        q: { type: 'string', maxLength: 200 },
        from: { type: 'string', maxLength: 40 },
        to: { type: 'string', maxLength: 40 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
        cursor: { type: 'string', maxLength: 200 },
    },
} as const

const auditQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        offset: { type: 'integer', minimum: 0, maximum: 1000000 },
    },
} as const

const resolveSchema = {
    type: 'object',
    additionalProperties: false,
    properties: { resolution: { type: 'string', maxLength: 1000 } },
} as const

const createReportEndpoint = async (
    request: FastifyRequest<{ Body: { targetKind: ReportTargetKind; targetId: string; reason?: string } }>,
    reply: FastifyReply
) => {
    try {
        const created = await moderation().report(
            request.user!,
            request.body.targetKind,
            request.body.targetId,
            request.body.reason ?? ''
        )
        reply.code(201)
        return created
    } catch (error) {
        return sendError(reply, error)
    }
}

const listReportsEndpoint = async (
    request: FastifyRequest<{ Querystring: { status?: ReportStatus; offset?: number } }>
): Promise<Report[]> =>
    moderation().listReports(request.query.status, request.query.offset ?? 0)

const resolveReportEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { resolution?: string } }>,
    reply: FastifyReply
) => {
    try {
        return await moderation().resolveReport(
            request.user!, request.params.id, request.body.resolution ?? ''
        )
    } catch (error) {
        return sendError(reply, error)
    }
}

const listAuditLogEndpoint = async (
    request: FastifyRequest<{ Querystring: AuditFilters }>
): Promise<{ entries: AuditEntry[]; total: number; actions: string[] }> =>
    moderation().listAuditEntries(request.query)

export const moderationRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.post<{ Body: { targetKind: ReportTargetKind; targetId: string; reason?: string } }>(
        '/api/reports',
        {
            schema: { body: reportSchema },
            preHandler: [rateLimit({ name: 'report_create', max: 10, windowSeconds: 3600 })],
        },
        createReportEndpoint
    )

    app.get<{ Querystring: { status?: ReportStatus; offset?: number } }>(
        '/api/moderation/reports',
        { schema: { querystring: listQuerySchema }, preHandler: [requirePermission('moderation.queue.read')] },
        listReportsEndpoint
    )

    app.post<{ Params: { id: string }; Body: { resolution?: string } }>(
        '/api/moderation/reports/:id/resolve',
        { schema: { body: resolveSchema }, preHandler: [requirePermission('moderation.report.resolve')] },
        resolveReportEndpoint
    )

    app.get<{ Querystring: AuditFilters }>(
        '/api/moderation/audit-log',
        { schema: { querystring: auditFilterSchema }, preHandler: [requirePermission('audit.read')] },
        listAuditLogEndpoint
    )

}
