export type WorkerHealth = {
    name: string

    lastTickAt: string | null

    healthy: boolean
}

export const HEALTH_COMPONENTS = [
    'database',      // the pool answers SELECT 1 inside the slow budget
    'migrations',    // the applied goose version is at least the highest migration shipped
    'storage',       // every source bound to a FILE_TYPES entry answers a cheap probe
    'signingKeys',   // a readable key pair in SIGNING_KEYS_DIR
    'jobQueue',      // the age of the oldest due queued job
    'mail',          // the configured email provider port's own readiness
] as const

export type HealthComponentKey = typeof HEALTH_COMPONENTS[number]

export const READINESS_BLOCKING: readonly HealthComponentKey[] = [
    'database',
    'migrations',
    'storage',
]

export const COMPONENT_STATES = ['ok', 'degraded', 'down'] as const

export type ComponentState = typeof COMPONENT_STATES[number]

export type HealthComponent = {
    key: HealthComponentKey

    state: ComponentState

    detail: string
}

export const ALARM_KEYS = [
    'queue_stalled',      // the job worker is stopped or wedged
    'mail_backlog',       // queued mail is not leaving, or a message has exhausted its retries
    'mail_down',          // the provider port is failing readiness
    'database_degraded',  // SELECT 1 is slow, or the connection failed
] as const

export type AlarmKey = typeof ALARM_KEYS[number]

export const ALARM_THRESHOLDS = {
    queueStalledSeconds: 15 * 60,
    mailBacklogSeconds: 30 * 60,
    mailDownSeconds: 10 * 60,
    databaseSlowMillis: 1_000,
    digestThrottleSeconds: 60 * 60,
} as const

export const ALARM_SENTENCES: Record<AlarmKey, string> = {
    queue_stalled: 'A job has been due for over fifteen minutes. The job worker is stopped or wedged — scheduled work, webhook delivery and mail all ride on it.',
    mail_backlog: 'Mail is queued and not leaving, or a message has exhausted its retries. Nothing is lost; the outbox holds everything until the cause is fixed.',
    mail_down: 'The email provider has been failing its readiness check for ten minutes. No email is leaving the system.',
    database_degraded: 'The database is answering slowly or not at all. Everything else follows from this one.',
}

export type Alarm = {
    key: AlarmKey

    firing: boolean

    sentence: string

    detail: string
}

export type ReadyReport = {
    ready: boolean

    components?: HealthComponent[]

    migration?: number | null

    workers?: WorkerHealth[]
}

export type OpsStatus = {
    ready: boolean

    name: string
    version: string
    build: string
    startedAt: string

    components: HealthComponent[]

    alarms: Alarm[]

    workers: WorkerHealth[]
}

export type VersionInfo = {
    name: string
    version: string

    build: string

    startedAt: string
}
