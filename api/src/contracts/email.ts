export const EMAIL_PLACEHOLDERS = [
    'workspace',
    'recipientName',
    'recipientEmail',
    'actorName',
    'actorEmail',
    'date',
] as const

export type EmailPlaceholder = typeof EMAIL_PLACEHOLDERS[number]

export const EMAIL_PROVIDERS = [
    'log',
    'smtp',
    'mailchimp',
] as const

export type EmailProvider = typeof EMAIL_PROVIDERS[number]

export type EmailConfig = {
    provider: EmailProvider

    fromName: string
    fromEmail: string

    smtpHost: string
    smtpPort: number
    smtpUser: string
    smtpSecure: boolean

    smtpPasswordSet: boolean
    mailchimpKeySet: boolean

    batchSize: number
}

export type EmailConfigDraft = {
    provider?: EmailProvider

    fromName?: string
    fromEmail?: string

    smtpHost?: string
    smtpPort?: number
    smtpUser?: string
    smtpSecure?: boolean

    smtpPassword?: string
    mailchimpKey?: string

    batchSize?: number
}

export const EMAIL_STATUSES = [
    'queued',
    'sending',
    'sent',
    'failed',
    'canceled',
] as const

export type EmailStatus = typeof EMAIL_STATUSES[number]

export type EmailMessage = {
    id: string

    toEmail: string
    toName: string

    subject: string
    body: string

    templateKey: string | null

    status: EmailStatus
    attempts: number
    error: string

    scheduledAt: string
    sentAt: string | null
    createdAt: string
}

export type EmailTemplate = {
    key: string
    name: string
    description: string

    subject: string
    body: string

    active: boolean

    updatedAt: string
}

export type EmailTemplateDraft = {
    key?: string
    name: string
    description?: string
    subject: string
    body: string
    active?: boolean
}

export const EMAIL_RECIPIENT_MODES = [
    'actor',
    'role',
    'members',
    'custom',
] as const

export type EmailRecipientMode = typeof EMAIL_RECIPIENT_MODES[number]

export type EmailTrigger = {
    id: string

    action: string

    templateKey: string
    templateName: string | null

    recipient: EmailRecipientMode

    roleId: string | null
    userIds: string[]

    customEmail: string

    active: boolean

    createdAt: string
}

export type EmailTriggerDraft = {
    action: string
    templateKey: string
    recipient?: EmailRecipientMode
    roleId?: string | null
    userIds?: string[]
    customEmail?: string
    active?: boolean
}

export type EmailRecipientOption = {
    id: string
    email: string
    name: string
    role: string
}

export const EMAIL_AUDIENCES = [
    'self',
    'custom',
    'all_users',
    'role',
    'members',
] as const

export type EmailAudience = typeof EMAIL_AUDIENCES[number]

export type EmailComposeDraft = {
    audience: EmailAudience

    roleId?: string
    emails?: string[]

    userIds?: string[]

    templateKey?: string

    subject?: string
    body?: string

    variables?: Record<string, string>

    scheduledAt?: string | null
}

export type EmailFilters = {
    status?: EmailStatus
    templateKey?: string

    q?: string

    from?: string
    to?: string

    limit?: number
    offset?: number

    cursor?: string
}

export type EmailStats = Record<EmailStatus, number>

export type EmailComposeResult = {
    queued: number
    scheduledAt: string
}
