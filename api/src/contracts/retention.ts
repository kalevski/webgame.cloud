export const RETENTION_MAX_DAYS = 3650

export const PURGE_INTERVAL_BOUNDS = { min: 10, max: 86_400 } as const

export const PURGE_BATCH_BOUNDS = { min: 10, max: 10_000 } as const

export const PURGE_TABLES_PER_TICK_BOUNDS = { min: 1, max: 50 } as const

export type PurgeSettings = {
    intervalSeconds: number

    batchSize: number

    tablesPerTick: number
}

export const PURGE_DEFAULTS: PurgeSettings = {
    intervalSeconds: 300,
    batchSize: 500,
    tablesPerTick: 5,
}

export type TableRetention = {
    table: string

    days: number

    totalRows: number
    softDeleted: number
    duePurge: number
}

export type RetentionPolicy = Record<string, number>

export type PurgeRun = {
    startedAt: string

    deleted: number

    tables: string[]
}

export type RetentionReport = {
    tables: TableRetention[]

    settings: PurgeSettings

    lastRun: PurgeRun | null
}

export const DEFAULT_RETENTION_DAYS: RetentionPolicy = {
    audit_log: 0,
    notifications: 90,
    email_messages: 90,
    jobs: 30,
    webhook_deliveries: 30,
    sessions: 30,
}

export const TABLE_LABELS: Record<string, string> = {
    audit_log: 'Audit log',
    email_messages: 'Email outbox',
    jobs: 'Background jobs',
    webhook_deliveries: 'Webhook deliveries',
    webhook_endpoints: 'Webhook endpoints',
    file_sources: 'File storage sources',
    user_identities: 'Linked sign-in identities',
    user_permissions: 'Per-account permissions',
    user_limit_overrides: 'Per-account limits',
    role_permissions: 'Role permissions',
    role_limits: 'Role limits',
    push_subscriptions: 'Push subscriptions',
    login_tokens: 'Magic-link tokens',
    api_keys: 'API keys',
    rate_limits: 'Rate limit buckets',
    idempotency_keys: 'Idempotency keys',
    notification_preferences: 'Notification preferences',
    coupon_redemptions: 'Coupon redemptions',
    usage_events: 'Usage events',
    invoice_reminders: 'Invoice reminders',
    sales_enquiries: 'Sales enquiries',
    sales_enquiry_events: 'Sales enquiry events',
    billing_plans: 'Billing plans',
    email_templates: 'Email templates',
    email_triggers: 'Email triggers',
}

export const tableLabel = (table: string): string =>
    TABLE_LABELS[table] ?? table.replace(/_/g, ' ').replace(/^./, (character) => character.toUpperCase())
