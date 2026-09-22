import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    EmailComposeDraft,
    EmailComposeResult,
    EmailConfig,
    EmailConfigDraft,
    EmailFilters,
    EmailMessage,
    EmailRecipientOption,
    EmailStats,
    EmailStatus,
    EmailTemplate,
    EmailTemplateDraft,
    EmailTrigger,
    EmailTriggerDraft,
} from '../contracts/index.js'
import {
    EMAIL_AUDIENCES,
    EMAIL_PROVIDERS,
    EMAIL_RECIPIENT_MODES,
    EMAIL_STATUSES,
} from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import { rateLimit } from '../http/rateLimit.js'
import { recordRequestAudit } from '../audit.js'
import container from '../container.js'
import { EmailService } from '../services/EmailService.js'
import { EmailWorker } from '../services/EmailWorker.js'

const email = () => container.resolve(EmailService)
const worker = () => container.resolve(EmailWorker)

const configSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        provider: { type: 'string', enum: [...EMAIL_PROVIDERS] },
        fromName: { type: 'string', maxLength: 120 },
        fromEmail: { type: 'string', maxLength: 200 },
        smtpHost: { type: 'string', maxLength: 200 },
        smtpPort: { type: 'integer', minimum: 1, maximum: 65535 },
        smtpUser: { type: 'string', maxLength: 200 },
        smtpPassword: { type: 'string', maxLength: 400 },
        smtpSecure: { type: 'boolean' },
        mailchimpKey: { type: 'string', maxLength: 400 },
        batchSize: { type: 'integer', minimum: 1, maximum: 200 },
    },
} as const

const templateSchema = {
    type: 'object',
    required: ['name', 'subject', 'body'],
    additionalProperties: false,
    properties: {
        key: { type: 'string', maxLength: 60 },
        name: { type: 'string', minLength: 1, maxLength: 120 },
        description: { type: 'string', maxLength: 400 },
        subject: { type: 'string', minLength: 1, maxLength: 300 },
        body: { type: 'string', minLength: 1, maxLength: 20_000 },
        active: { type: 'boolean' },
    },
} as const

const triggerSchema = {
    type: 'object',
    required: ['action', 'templateKey'],
    additionalProperties: false,
    properties: {
        action: { type: 'string', minLength: 1, maxLength: 60 },
        templateKey: { type: 'string', minLength: 1, maxLength: 60 },
        recipient: { type: 'string', enum: [...EMAIL_RECIPIENT_MODES] },
        roleId: { type: ['string', 'null'], maxLength: 60 },
        userIds: { type: 'array', maxItems: 200, items: { type: 'string', maxLength: 60 } },
        customEmail: { type: 'string', maxLength: 400 },
        active: { type: 'boolean' },
    },
} as const

const composeSchema = {
    type: 'object',
    required: ['audience'],
    additionalProperties: false,
    properties: {
        audience: { type: 'string', enum: [...EMAIL_AUDIENCES] },
        roleId: { type: 'string', maxLength: 60 },
        emails: { type: 'array', maxItems: 200, items: { type: 'string', maxLength: 200 } },
        userIds: { type: 'array', maxItems: 200, items: { type: 'string', maxLength: 60 } },
        variables: { type: 'object', additionalProperties: { type: 'string', maxLength: 2000 } },
        templateKey: { type: 'string', maxLength: 60 },
        subject: { type: 'string', maxLength: 300 },
        body: { type: 'string', maxLength: 20_000 },
        scheduledAt: { type: ['string', 'null'], maxLength: 40 },
    },
} as const

const messageQuerySchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: [...EMAIL_STATUSES] },
        templateKey: { type: 'string', maxLength: 60 },
        q: { type: 'string', maxLength: 200 },
        from: { type: 'string', maxLength: 40 },
        to: { type: 'string', maxLength: 40 },
        limit: { type: 'integer', minimum: 1, maximum: 200 },
        offset: { type: 'integer', minimum: 0 },
        cursor: { type: 'string', maxLength: 200 },
    },
} as const

const messageStatusSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
        status: { type: 'string', enum: ['queued', 'canceled'] },
    },
} as const

const getConfigEndpoint = async (): Promise<EmailConfig> => email().getConfig()

const saveConfigEndpoint = async (
    request: FastifyRequest<{ Body: EmailConfigDraft }>
): Promise<EmailConfig> => {
    const saved = await email().saveConfig(request.body)
    void recordRequestAudit(request, 'update_email_config', '', `provider=${saved.provider} from=${saved.fromEmail}`)
    return saved
}

const testEmailEndpoint = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<EmailMessage> => {
    const message = await email().sendTest(request.user!)
    void worker().tick()
    return message
}

const listTemplatesEndpoint = async (): Promise<EmailTemplate[]> => email().listTemplates()

const createTemplateEndpoint = async (
    request: FastifyRequest<{ Body: EmailTemplateDraft }>,
    reply: FastifyReply
): Promise<EmailTemplate> => {
    const created = await email().createTemplate(request.body)
    void recordRequestAudit(request, 'create_email_template', created.key, created.name)
    reply.code(201)
    return created
}

const updateTemplateEndpoint = async (
    request: FastifyRequest<{ Params: { key: string }; Body: Partial<EmailTemplateDraft> }>,
    reply: FastifyReply
): Promise<EmailTemplate> => {
    const saved = await email().updateTemplate(request.params.key, request.body)
    void recordRequestAudit(request, 'update_email_template', saved.key, saved.name)
    return saved
}

const deleteTemplateEndpoint = async (
    request: FastifyRequest<{ Params: { key: string } }>,
    reply: FastifyReply
) => {
    await email().deleteTemplate(request.params.key)
    void recordRequestAudit(request, 'delete_email_template', request.params.key)
    reply.code(204)
    return null
}

const listTriggersEndpoint = async (): Promise<EmailTrigger[]> => email().listTriggers()

const listAuditActionsEndpoint = async (): Promise<string[]> => email().listAuditActions()

const listRecipientsEndpoint = async (): Promise<EmailRecipientOption[]> => email().listRecipients()

const saveTriggerEndpoint = async (
    request: FastifyRequest<{ Body: EmailTriggerDraft }>,
    reply: FastifyReply
): Promise<EmailTrigger> => {
    const saved = await email().saveTrigger(request.body)
    void recordRequestAudit(request, 'save_email_trigger', saved.id, `${saved.action} → ${saved.templateKey}`)
    reply.code(201)
    return saved
}

const deleteTriggerEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    await email().deleteTrigger(request.params.id)
    void recordRequestAudit(request, 'delete_email_trigger', request.params.id)
    reply.code(204)
    return null
}

const listMessagesEndpoint = async (
    request: FastifyRequest<{ Querystring: EmailFilters }>
): Promise<{ messages: EmailMessage[]; total: number; stats: EmailStats }> =>
    email().listMessages(request.query)

const composeEndpoint = async (
    request: FastifyRequest<{ Body: EmailComposeDraft }>,
    reply: FastifyReply
): Promise<EmailComposeResult> => {
    const result = await email().compose(request.user!, request.body)
    void recordRequestAudit(
        request,
        'queue_email',
        request.body.templateKey ?? '',
        `${result.queued} recipients,
        audience=${request.body.audience}`
    )
    if (!request.body.scheduledAt) void worker().tick()
    reply.code(201)
    return result
}

const patchMessageEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { status: EmailStatus } }>,
    reply: FastifyReply
): Promise<EmailMessage> => {
    const saved = await email().setMessageStatus(request.params.id, request.body.status)
    void recordRequestAudit(request, 'update_email_message', saved.id, saved.status)
    if (saved.status === 'queued') void worker().tick()
    return saved
}

export const emailRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireFeature('email'))
    app.addHook('preHandler', requireAuth)

    app.get('/api/email/config', { preHandler: [requirePermission('email.config.write')] }, getConfigEndpoint)

    app.put<{ Body: EmailConfigDraft }>(
        '/api/email/config',
        { schema: { body: configSchema }, preHandler: [requirePermission('email.config.write')] },
        saveConfigEndpoint
    )

    app.post(
        '/api/email/config/test',
        { preHandler: [requirePermission('email.config.write')] },
        testEmailEndpoint
    )

    app.get(
        '/api/email/templates',
        { preHandler: [requirePermission('email.outbox.read')] },
        listTemplatesEndpoint
    )

    app.post<{ Body: EmailTemplateDraft }>(
        '/api/email/templates',
        { schema: { body: templateSchema }, preHandler: [requirePermission('email.template.write')] },
        createTemplateEndpoint
    )

    app.patch<{ Params: { key: string }; Body: Partial<EmailTemplateDraft> }>(
        '/api/email/templates/:key',
        {
            schema: { body: { ...templateSchema, required: [] } },
            preHandler: [requirePermission('email.template.write')],
        },
        updateTemplateEndpoint
    )

    app.delete<{ Params: { key: string } }>(
        '/api/email/templates/:key',
        { preHandler: [requirePermission('email.template.write')] },
        deleteTemplateEndpoint
    )

    app.get(
        '/api/email/triggers',
        { preHandler: [requirePermission('email.outbox.read')] },
        listTriggersEndpoint
    )

    app.get(
        '/api/email/audit-actions',
        { preHandler: [requirePermission('email.outbox.read')] },
        listAuditActionsEndpoint
    )

    app.get(
        '/api/email/recipients',
        { preHandler: [requirePermission('email.outbox.read')] },
        listRecipientsEndpoint
    )

    app.post<{ Body: EmailTriggerDraft }>(
        '/api/email/triggers',
        { schema: { body: triggerSchema }, preHandler: [requirePermission('email.trigger.write')] },
        saveTriggerEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/email/triggers/:id',
        { preHandler: [requirePermission('email.trigger.write')] },
        deleteTriggerEndpoint
    )

    app.get<{ Querystring: EmailFilters }>(
        '/api/email/messages',
        { schema: { querystring: messageQuerySchema }, preHandler: [requirePermission('email.outbox.read')] },
        listMessagesEndpoint
    )

    app.post<{ Body: EmailComposeDraft }>(
        '/api/email/messages',
        {
            schema: { body: composeSchema },
            preHandler: [
                requirePermission('email.send'),
                rateLimit({ name: 'email_compose', max: 30, windowSeconds: 3600 }),
            ],
        },
        composeEndpoint
    )

    app.patch<{ Params: { id: string }; Body: { status: EmailStatus } }>(
        '/api/email/messages/:id',
        { schema: { body: messageStatusSchema }, preHandler: [requirePermission('email.send')] },
        patchMessageEndpoint
    )
}
