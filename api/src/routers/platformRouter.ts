import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import { requireAuth, requirePermission } from '../auth.js'
import { recordRequestAudit } from '../audit.js'
import { JobService } from '../services/JobService.js'
import { RetentionService } from '../services/RetentionService.js'
import { WebhookService } from '../services/WebhookService.js'
import { AuditRepository } from '../repositories/moderation/AuditRepository.js'
import { jobKinds } from '../domain/jobs.js'
import type {
    Job,
    JobFilters,
    JobRunRequest,
    JobRunResult,
    JobSchedule,
    JobStats,
    JobStatus,
    PurgeRun,
    PurgeSettings,
    RetentionPolicy,
    RetentionReport,
    WebhookDelivery,
    WebhookDeliveryFilters,
    WebhookEndpoint,
    WebhookEndpointDraft,
} from '../contracts/index.js'
import {
    JOB_STATUSES,
    PURGE_BATCH_BOUNDS,
    PURGE_INTERVAL_BOUNDS,
    PURGE_TABLES_PER_TICK_BOUNDS,
    RETENTION_MAX_DAYS,
    WEBHOOK_DELIVERY_STATUSES,
} from '../contracts/index.js'

const jobs = () => container.resolve(JobService)
const webhooks = () => container.resolve(WebhookService)
const retention = () => container.resolve(RetentionService)

const jobQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...JOB_STATUSES] },
        kind: { type: 'string', maxLength: 80 },
        q: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { type: 'integer', minimum: 0, maximum: 100000 },
        cursor: { type: 'string', maxLength: 200 },
    },
} as const

const jobStatusSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['status'],
    properties: { status: { type: 'string', enum: [...JOB_STATUSES] } },
} as const

const jobRunSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        kinds: { type: 'array', maxItems: 50, items: { type: 'string', maxLength: 80 } },
    },
} as const

const endpointSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['url', 'events'],
    properties: {
        url: { type: 'string', minLength: 1, maxLength: 500 },
        description: { type: 'string', maxLength: 300 },
        events: { type: 'array', maxItems: 200, items: { type: 'string', maxLength: 80 } },
        active: { type: 'boolean' },
        secret: { type: 'string', maxLength: 200 },
    },
} as const

const deliveryQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        endpointId: { type: 'string', maxLength: 80 },
        status: { type: 'string', enum: [...WEBHOOK_DELIVERY_STATUSES] },
        action: { type: 'string', maxLength: 80 },
        q: { type: 'string', maxLength: 200 },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { type: 'integer', minimum: 0, maximum: 100000 },
        cursor: { type: 'string', maxLength: 200 },
    },
} as const

const retentionSchema = {
    type: 'object',
    additionalProperties: { type: 'integer', minimum: 0, maximum: RETENTION_MAX_DAYS },
} as const

const purgeSettingsSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        intervalSeconds: {
            type: 'integer',
            minimum: PURGE_INTERVAL_BOUNDS.min,
            maximum: PURGE_INTERVAL_BOUNDS.max,
        },
        batchSize: {
            type: 'integer',
            minimum: PURGE_BATCH_BOUNDS.min,
            maximum: PURGE_BATCH_BOUNDS.max,
        },
        tablesPerTick: {
            type: 'integer',
            minimum: PURGE_TABLES_PER_TICK_BOUNDS.min,
            maximum: PURGE_TABLES_PER_TICK_BOUNDS.max,
        },
    },
} as const

const listJobsEndpoint = async (
    request: FastifyRequest<{ Querystring: JobFilters }>
): Promise<{ jobs: Job[]; total: number; stats: JobStats }> =>
    jobs().list(request.query)

const jobKindsEndpoint = async (): Promise<string[]> => jobKinds()

const listSchedulesEndpoint = async (): Promise<JobSchedule[]> => jobs().listSchedules()

const runSchedulesEndpoint = async (
    request: FastifyRequest<{ Body: Partial<JobRunRequest> }>,
    reply: FastifyReply
): Promise<JobRunResult> => {
    const triggered = await jobs().runNow(request.body?.kinds ?? [])
    void recordRequestAudit(request, 'run_jobs', '', triggered.join(', '))
    reply.code(202)
    return { triggered }
}

const patchJobEndpoint = async (
    request: FastifyRequest<{ Params: { jobId: string }; Body: { status: JobStatus } }>,
    reply: FastifyReply
): Promise<Job> => {
    const updated = await jobs().setStatus(request.params.jobId, request.body.status)
    void recordRequestAudit(request, 'update_job', updated.id, request.body.status)
    return updated
}

const listEndpointsEndpoint = async (): Promise<WebhookEndpoint[]> => webhooks().listEndpoints()

const createEndpointEndpoint = async (
    request: FastifyRequest<{ Body: WebhookEndpointDraft }>,
    reply: FastifyReply
): Promise<WebhookEndpoint> => {
    const created = await webhooks().createEndpoint(request.body)
    void recordRequestAudit(request, 'create_webhook', created.id, created.url)
    reply.code(201)
    return created
}

const updateEndpointEndpoint = async (
    request: FastifyRequest<{ Params: { endpointId: string }; Body: Partial<WebhookEndpointDraft> }>,
    reply: FastifyReply
): Promise<WebhookEndpoint> => {
    const updated = await webhooks().updateEndpoint(request.params.endpointId, request.body)
    void recordRequestAudit(request, 'update_webhook', updated.id, updated.url)
    return updated
}

const deleteEndpointEndpoint = async (
    request: FastifyRequest<{ Params: { endpointId: string } }>,
    reply: FastifyReply
): Promise<null> => {
    await webhooks().deleteEndpoint(request.params.endpointId)
    void recordRequestAudit(request, 'delete_webhook', request.params.endpointId, '')
    reply.code(204)
    return null
}

const webhookEventsEndpoint = async (): Promise<string[]> =>
    container.resolve(AuditRepository).listActions()

const listDeliveriesEndpoint = async (
    request: FastifyRequest<{ Querystring: WebhookDeliveryFilters }>
): Promise<{ deliveries: WebhookDelivery[]; total: number }> =>
    webhooks().listDeliveries(request.query)

const getRetentionEndpoint = async (): Promise<RetentionReport> => retention().report()

const saveRetentionEndpoint = async (
    request: FastifyRequest<{ Body: RetentionPolicy }>
): Promise<RetentionReport> => {
    await retention().savePolicy(request.body)
    void recordRequestAudit(request, 'update_retention', '', JSON.stringify(request.body))
    return retention().report()
}

const savePurgeSettingsEndpoint = async (
    request: FastifyRequest<{ Body: Partial<PurgeSettings> }>
): Promise<PurgeSettings> => {
    const saved = await retention().saveSettings(request.body)
    void recordRequestAudit(request, 'update_purge_settings', '', JSON.stringify(saved))
    return saved
}

const runPurgeEndpoint = async (request: FastifyRequest): Promise<PurgeRun> => {
    const run = await retention().purgeOnce()
    void recordRequestAudit(request, 'run_purge', '', `${run.deleted} rows`)
    return run
}

export const platformRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Querystring: JobFilters }>(
        '/api/jobs',
        { schema: { querystring: jobQuerySchema }, preHandler: [requirePermission('job.read')] },
        listJobsEndpoint
    )

    app.get('/api/jobs/kinds', { preHandler: [requirePermission('job.read')] }, jobKindsEndpoint)

    app.get('/api/jobs/schedules', { preHandler: [requirePermission('job.read')] }, listSchedulesEndpoint)

    app.post<{ Body: Partial<JobRunRequest> }>(
        '/api/jobs/schedules/run',
        { schema: { body: jobRunSchema }, preHandler: [requirePermission('job.write')] },
        runSchedulesEndpoint
    )

    app.patch<{ Params: { jobId: string }; Body: { status: JobStatus } }>(
        '/api/jobs/:jobId',
        { schema: { body: jobStatusSchema }, preHandler: [requirePermission('job.write')] },
        patchJobEndpoint
    )

    app.get('/api/webhooks', { preHandler: [requirePermission('webhook.read')] }, listEndpointsEndpoint)

    app.post<{ Body: WebhookEndpointDraft }>(
        '/api/webhooks',
        { schema: { body: endpointSchema }, preHandler: [requirePermission('webhook.write')] },
        createEndpointEndpoint
    )

    app.patch<{ Params: { endpointId: string }; Body: Partial<WebhookEndpointDraft> }>(
        '/api/webhooks/:endpointId',
        { schema: { body: { ...endpointSchema, required: [] } }, preHandler: [requirePermission('webhook.write')] },
        updateEndpointEndpoint
    )

    app.delete<{ Params: { endpointId: string } }>(
        '/api/webhooks/:endpointId',
        { preHandler: [requirePermission('webhook.write')] },
        deleteEndpointEndpoint
    )

    app.get('/api/webhooks/events', { preHandler: [requirePermission('webhook.read')] }, webhookEventsEndpoint)

    app.get<{ Querystring: WebhookDeliveryFilters }>(
        '/api/webhooks/deliveries',
        { schema: { querystring: deliveryQuerySchema }, preHandler: [requirePermission('webhook.read')] },
        listDeliveriesEndpoint
    )

    app.get('/api/retention', { preHandler: [requirePermission('admin.settings.read')] }, getRetentionEndpoint)

    app.put<{ Body: RetentionPolicy }>(
        '/api/retention',
        { schema: { body: retentionSchema }, preHandler: [requirePermission('admin.settings.write')] },
        saveRetentionEndpoint
    )

    app.put<{ Body: Partial<PurgeSettings> }>(
        '/api/retention/settings',
        { schema: { body: purgeSettingsSchema }, preHandler: [requirePermission('admin.settings.write')] },
        savePurgeSettingsEndpoint
    )

    app.post(
        '/api/retention/run',
        { preHandler: [requirePermission('admin.settings.write')] },
        runPurgeEndpoint
    )
}
