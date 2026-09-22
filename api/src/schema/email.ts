import type {
    EmailMessage,
    EmailRecipientMode,
    EmailStatus,
    EmailTemplate,
    EmailTrigger,
} from '../contracts/index.js'

export type EmailTemplateRow = {
    key: string
    name: string
    description: string
    subject: string
    body: string
    active: boolean
    created_at: Date
    updated_at: Date
}

export const toEmailTemplate = (row: EmailTemplateRow): EmailTemplate => ({
    key: row.key,
    name: row.name,
    description: row.description,
    subject: row.subject,
    body: row.body,
    active: row.active,
    updatedAt: row.updated_at.toISOString(),
})

export type EmailTriggerRow = {
    id: string
    action: string
    template_key: string
    template_name: string | null
    recipient: EmailRecipientMode
    role_id: string | null
    user_ids: string[]
    custom_email: string
    active: boolean
    created_at: Date
}

export type TriggerWithTemplateRow = EmailTriggerRow & {
    template_subject: string
    template_body: string
}

export const toEmailTrigger = (row: EmailTriggerRow): EmailTrigger => ({
    id: row.id,
    action: row.action,
    templateKey: row.template_key,
    templateName: row.template_name,
    recipient: row.recipient,
    roleId: row.role_id,
    userIds: Array.isArray(row.user_ids) ? row.user_ids : [],
    customEmail: row.custom_email,
    active: row.active,
    createdAt: row.created_at.toISOString(),
})

export type EmailMessageRow = {
    id: string
    to_email: string
    to_name: string
    subject: string
    body: string
    template_key: string | null
    status: EmailStatus
    attempts: number
    error: string
    scheduled_at: Date
    sent_at: Date | null
    created_at: Date
}

export const toEmailMessage = (row: EmailMessageRow): EmailMessage => ({
    id: row.id,
    toEmail: row.to_email,
    toName: row.to_name,
    subject: row.subject,
    body: row.body,
    templateKey: row.template_key,
    status: row.status,
    attempts: row.attempts,
    error: row.error,
    scheduledAt: row.scheduled_at.toISOString(),
    sentAt: row.sent_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})
