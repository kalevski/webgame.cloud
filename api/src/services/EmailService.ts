import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type {
    EmailComposeDraft,
    EmailComposeResult,
    EmailConfig,
    EmailConfigDraft,
    EmailFilters,
    EmailMessage,
    EmailProvider,
    EmailRecipientOption,
    EmailStats,
    EmailStatus,
    EmailTemplate,
    EmailTemplateDraft,
    EmailTrigger,
    EmailTriggerDraft,
    User,
} from '../contracts/index.js'
import { EMAIL_STATUSES, OWNER_ROLE_ID, toRoleId } from '../contracts/index.js'
import { WORKSPACE_NAME } from '../env.js'
import { getEmailPort, logEmailPort, renderTemplate, type EmailSender } from '../domain/email.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { EmailRepository } from '../repositories/email/EmailRepository.js'
import { decodeCursor, takePage } from '../repositories/pagination.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { toEmailMessage, toEmailTemplate, toEmailTrigger } from '../schema/email.js'
import { SettingsService } from './SettingsService.js'
import { getLogger } from '../logging.js'

const log = getLogger('email')

const KEY = {
    provider: 'email_provider',
    fromName: 'email_from_name',
    fromEmail: 'email_from_email',
    smtpHost: 'email_smtp_host',
    smtpPort: 'email_smtp_port',
    smtpUser: 'email_smtp_user',
    smtpPassword: 'email_smtp_password',
    smtpSecure: 'email_smtp_secure',
    mailchimpKey: 'email_mailchimp_key',
    batchSize: 'email_batch_size',
} as const

const emptyStats = (): EmailStats =>
    Object.fromEntries(EMAIL_STATUSES.map((status) => [status, 0])) as EmailStats

@injectable()
export class EmailService {
    constructor(
        @inject(EmailRepository) private email: EmailRepository,
        @inject(UserRepository) private users: UserRepository,
        @inject(SettingsService) private settings: SettingsService
    ) {}

    async getSender(): Promise<EmailSender> {
        const [fromName, fromEmail, smtpHost, smtpPort, smtpUser, smtpPassword, smtpSecure, mailchimpKey] =
            await Promise.all([
                this.settings.getRaw(KEY.fromName),
                this.settings.getRaw(KEY.fromEmail),
                this.settings.getRaw(KEY.smtpHost),
                this.settings.getRaw(KEY.smtpPort),
                this.settings.getRaw(KEY.smtpUser),
                this.settings.getRaw(KEY.smtpPassword),
                this.settings.getRaw(KEY.smtpSecure),
                this.settings.getRaw(KEY.mailchimpKey),
            ])

        return {
            fromName: fromName ?? WORKSPACE_NAME,
            fromEmail: fromEmail ?? '',
            smtpHost: smtpHost ?? '',
            smtpPort: Number(smtpPort ?? 587) || 587,
            smtpUser: smtpUser ?? '',
            smtpPassword: smtpPassword ?? '',
            smtpSecure: smtpSecure === 'true',
            mailchimpKey: mailchimpKey ?? '',
        }
    }

    async getConfig(): Promise<EmailConfig> {
        const sender = await this.getSender()
        const [provider, batchSize] = await Promise.all([
            this.settings.getRaw(KEY.provider),
            this.settings.getRaw(KEY.batchSize),
        ])

        return {
            provider: (provider as EmailProvider) ?? 'log',
            fromName: sender.fromName,
            fromEmail: sender.fromEmail,
            smtpHost: sender.smtpHost,
            smtpPort: sender.smtpPort,
            smtpUser: sender.smtpUser,
            smtpSecure: sender.smtpSecure,
            smtpPasswordSet: sender.smtpPassword.length > 0,
            mailchimpKeySet: sender.mailchimpKey.length > 0,
            batchSize: Number(batchSize ?? 25) || 25,
        }
    }

    async saveConfig(draft: EmailConfigDraft): Promise<EmailConfig> {
        const writes: Array<[string, string]> = []
        if (draft.provider) writes.push([KEY.provider, draft.provider])
        if (draft.fromName !== undefined) writes.push([KEY.fromName, draft.fromName.trim()])
        if (draft.fromEmail !== undefined) writes.push([KEY.fromEmail, draft.fromEmail.trim()])
        if (draft.smtpHost !== undefined) writes.push([KEY.smtpHost, draft.smtpHost.trim()])
        if (draft.smtpPort !== undefined) writes.push([KEY.smtpPort, String(draft.smtpPort)])
        if (draft.smtpUser !== undefined) writes.push([KEY.smtpUser, draft.smtpUser.trim()])
        if (draft.smtpSecure !== undefined) writes.push([KEY.smtpSecure, String(draft.smtpSecure)])
        if (draft.batchSize !== undefined) writes.push([KEY.batchSize, String(Math.max(1, Math.min(draft.batchSize, 200)))])
        if (draft.smtpPassword) writes.push([KEY.smtpPassword, draft.smtpPassword])
        if (draft.mailchimpKey) writes.push([KEY.mailchimpKey, draft.mailchimpKey])

        for (const [key, value] of writes) await this.settings.setRaw(key, value)
        return this.getConfig()
    }

    async listTemplates(): Promise<EmailTemplate[]> {
        return (await this.email.listTemplates()).map(toEmailTemplate)
    }

    async createTemplate(draft: EmailTemplateDraft): Promise<EmailTemplate> {
        const name = draft.name.trim()
        if (!name) throw new ValidationError('template_required', 'a template name is required')
        if (!draft.subject.trim() || !draft.body.trim()) {
            throw new ValidationError('template_required', 'a subject and body are required')
        }

        const key = toRoleId(draft.key?.trim() || name)
        if (!key) throw new ValidationError('template_required', 'a template name is required')
        if (await this.email.findTemplate(key)) {
            throw new ConflictError('template_exists', 'a template with that key already exists', [key])
        }

        const created = await this.email.insertTemplate({
            key,
            name,
            description: draft.description?.trim() ?? '',
            subject: draft.subject.trim(),
            body: draft.body,
            active: draft.active ?? true,
        })
        if (!created) throw new NotFoundError('template_not_found', 'template not found', [key])
        return toEmailTemplate(created)
    }

    async updateTemplate(key: string, draft: Partial<EmailTemplateDraft>): Promise<EmailTemplate> {
        const updated = await this.email.updateTemplate(key, {
            name: draft.name?.trim(),
            description: draft.description?.trim(),
            subject: draft.subject?.trim(),
            body: draft.body,
            active: draft.active,
        })
        if (!updated) throw new NotFoundError('template_not_found', 'template not found', [key])
        return toEmailTemplate(updated)
    }

    async deleteTemplate(key: string): Promise<void> {
        if (!(await this.email.deleteTemplate(key))) {
            throw new NotFoundError('template_not_found', 'template not found', [key])
        }
    }

    async listTriggers(): Promise<EmailTrigger[]> {
        return (await this.email.listTriggers()).map(toEmailTrigger)
    }

    async saveTrigger(draft: EmailTriggerDraft): Promise<EmailTrigger> {
        const action = draft.action.trim()
        if (!action) throw new ValidationError('invalid_input', 'an action is required')
        if (!(await this.email.findTemplate(draft.templateKey))) {
            throw new NotFoundError('template_not_found', 'template not found', [draft.templateKey])
        }

        await this.email.saveTrigger({
            id: randomUUID(),
            action,
            templateKey: draft.templateKey,
            recipient: draft.recipient ?? 'actor',
            roleId: draft.roleId ?? null,
            userIds: draft.userIds ?? [],
            customEmail: draft.customEmail?.trim() ?? '',
            active: draft.active ?? true,
        })

        const saved = (await this.email.listTriggers())
            .find((row) => row.action === action && row.template_key === draft.templateKey)
        if (!saved) throw new NotFoundError('trigger_not_found', 'trigger not found')
        return toEmailTrigger(saved)
    }

    async deleteTrigger(id: string): Promise<void> {
        if (!(await this.email.deleteTrigger(id))) {
            throw new NotFoundError('trigger_not_found', 'trigger not found', [id])
        }
    }

    async listAuditActions(): Promise<string[]> {
        return this.email.listAuditActions()
    }

    async listRecipients(): Promise<EmailRecipientOption[]> {
        return this.email.listRecipients()
    }

    async listMessages(
        filters: EmailFilters
    ): Promise<{ messages: EmailMessage[]; total: number; stats: EmailStats; nextCursor: string | null }> {
        const limit = Math.min(filters.limit ?? 25, 200)
        const cursor = decodeCursor(filters.cursor)
        const query = {
            status: filters.status ?? null,
            templateKey: filters.templateKey ?? null,
            from: filters.from ? new Date(filters.from) : null,
            to: filters.to ? new Date(filters.to) : null,
            q: filters.q?.trim() || null,
            limit,
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total, counts] = await Promise.all([
            this.email.listMessages({
                ...query,
                limit: limit + 1,
                offset: cursor.createdAt ? 0 : query.offset,
                cursor,
            }),
            this.email.countMessages(query),
            this.email.messageStats(),
        ])
        const page = takePage(rows, limit, (row) => ({ createdAt: row.created_at, id: row.id }))

        const stats = emptyStats()
        for (const entry of counts) {
            if ((EMAIL_STATUSES as readonly string[]).includes(entry.status)) {
                stats[entry.status as EmailStatus] = entry.count
            }
        }

        return { messages: page.rows.map(toEmailMessage), total, stats, nextCursor: page.nextCursor }
    }

    async setMessageStatus(id: string, status: EmailStatus): Promise<EmailMessage> {
        const updated = await this.email.setStatus(id, status)
        if (!updated) throw new NotFoundError('message_not_found', 'message not found', [id])
        return toEmailMessage(updated)
    }

    async compose(actor: User, draft: EmailComposeDraft): Promise<EmailComposeResult> {
        const template = draft.templateKey ? await this.email.findTemplate(draft.templateKey) : undefined
        if (draft.templateKey && !template) {
            throw new NotFoundError('template_not_found', 'template not found', [draft.templateKey])
        }

        const subject = (draft.subject?.trim() || template?.subject || '').trim()
        const body = draft.body?.trim() || template?.body || ''
        if (!subject || !body) throw new ValidationError('template_required', 'a subject and body are required')

        const recipients = await this.resolveAudience(actor, draft)
        if (recipients.length === 0) throw new ValidationError('recipients_required', 'no recipients matched')

        const scheduledAt = draft.scheduledAt ? new Date(draft.scheduledAt) : new Date()
        const variables = draft.variables ?? {}

        for (const recipient of recipients) {
            const context = { ...this.context(recipient), ...variables }
            await this.queue({
                toEmail: recipient.email,
                toName: recipient.name,
                subject: renderTemplate(subject, context),
                body: renderTemplate(body, context),
                templateKey: template?.key ?? null,
                scheduledAt,
            })
        }

        return { queued: recipients.length, scheduledAt: scheduledAt.toISOString() }
    }

    async sendTest(actor: User): Promise<EmailMessage> {
        const config = await this.getConfig()
        if (!config.fromEmail) throw new ValidationError('email_not_configured', 'set a sender address first')

        const id = await this.queue({
            toEmail: actor.email,
            toName: actor.name,
            subject: `${WORKSPACE_NAME} test email`,
            body: `This is a test email from ${WORKSPACE_NAME}, sent through the ${config.provider} provider.`,
            templateKey: null,
            scheduledAt: new Date(),
        })

        const row = await this.email.findMessage(id)
        if (!row) throw new NotFoundError('message_not_found', 'message not found')
        return toEmailMessage(row)
    }

    async handleAuditEvent(actor: User, action: string, targetId: string, detail: string): Promise<void> {
        const triggers = await this.email.listTriggersForAction(action)
        if (triggers.length === 0) return

        for (const trigger of triggers) {
            const template = await this.email.findTemplate(trigger.template_key)
            if (!template) continue

            const recipients = await this.resolveTriggerRecipients(trigger, actor)

            for (const recipient of recipients) {
                const context = {
                    ...this.context(recipient),
                    actorName: actor.name || actor.email,
                    actorEmail: actor.email,
                    action,
                    targetId,
                    detail,
                }
                await this.queue({
                    toEmail: recipient.email,
                    toName: recipient.name,
                    subject: renderTemplate(template.subject, context),
                    body: renderTemplate(template.body, context),
                    templateKey: template.key,
                    scheduledAt: new Date(),
                })
            }
        }
    }

    async claimDue(limit: number) {
        return this.email.claimDue(limit)
    }

    async markSent(id: string): Promise<void> {
        await this.email.markSent(id)
    }

    async markFailed(id: string, error: string): Promise<void> {
        await this.email.markFailed(id, error, 5, 60)
    }

    async resetStuck(): Promise<number> {
        return this.email.resetStuck()
    }

    async port() {
        const config = await this.getConfig()
        const sender = await this.getSender()
        const port = getEmailPort(config.provider) ?? logEmailPort
        if (!port.ready(sender)) {
            log.info('email provider not configured, falling back to log', { provider: config.provider })
            return { port: logEmailPort, sender, batchSize: config.batchSize }
        }
        return { port, sender, batchSize: Math.min(config.batchSize, port.batchSize) }
    }

    private async resolveTriggerRecipients(
        trigger: { recipient: string; role_id: string | null; user_ids: string[]; custom_email: string },
        actor: User
    ): Promise<Array<{ email: string; name: string }>> {
        if (trigger.recipient === 'actor') return [{ email: actor.email, name: actor.name }]

        if (trigger.recipient === 'custom') {
            return trigger.custom_email
                .split(',')
                .map((value) => ({ email: value.trim(), name: '' }))
                .filter((entry) => entry.email.includes('@'))
        }

        const users = (await this.users.list()).filter((user) => user.active)

        if (trigger.recipient === 'members') {
            const ids = new Set(Array.isArray(trigger.user_ids) ? trigger.user_ids : [])
            return users.filter((user) => ids.has(user.id)).map((user) => ({ email: user.email, name: user.name }))
        }

        return users
            .filter((user) => user.role === (trigger.role_id ?? OWNER_ROLE_ID))
            .map((user) => ({ email: user.email, name: user.name }))
    }

    private context(recipient: { email: string; name: string }): Record<string, string> {
        return {
            workspace: WORKSPACE_NAME,
            recipientName: recipient.name || recipient.email,
            recipientEmail: recipient.email,
            actorName: recipient.name || recipient.email,
            actorEmail: recipient.email,
            date: new Date().toLocaleDateString('en-GB'),
        }
    }

    private async resolveAudience(
        actor: User,
        draft: EmailComposeDraft
    ): Promise<Array<{ email: string; name: string }>> {
        if (draft.audience === 'self') return [{ email: actor.email, name: actor.name }]

        if (draft.audience === 'custom') {
            return (draft.emails ?? [])
                .map((value) => ({ email: value.trim(), name: '' }))
                .filter((entry) => entry.email.includes('@'))
        }

        const users = (await this.users.list()).filter((user) => user.active)

        if (draft.audience === 'members') {
            const ids = new Set(draft.userIds ?? [])
            return users.filter((user) => ids.has(user.id)).map((user) => ({ email: user.email, name: user.name }))
        }

        const scoped = draft.audience === 'role' && draft.roleId
            ? users.filter((user) => user.role === draft.roleId)
            : users
        return scoped.map((user) => ({ email: user.email, name: user.name }))
    }

    async queueDirect(write: {
        toEmail: string
        toName: string
        subject: string
        body: string
    }): Promise<string> {
        return this.queue({ ...write, templateKey: null, scheduledAt: new Date() })
    }

    private async queue(write: {
        toEmail: string
        toName: string
        subject: string
        body: string
        templateKey: string | null
        scheduledAt: Date
    }): Promise<string> {
        const id = randomUUID()
        await this.email.insertMessage({
            id,
            toEmail: write.toEmail,
            toName: write.toName,
            subject: write.subject,
            body: write.body,
            templateKey: write.templateKey,
            scheduledAt: write.scheduledAt,
        })
        return id
    }
}
