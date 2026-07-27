export const JOB_STATUSES = [
    'queued',
    'running',
    'done',
    'failed',
    'canceled',
] as const

export type JobStatus = typeof JOB_STATUSES[number]

export type Job = {
    id: string

    kind: string

    payload: Record<string, unknown>

    status: JobStatus

    runAt: string

    attempts: number
    maxAttempts: number

    error: string

    startedAt: string | null
    finishedAt: string | null

    createdAt: string
    updatedAt: string
}

export type JobDraft = {
    kind: string

    payload?: Record<string, unknown>

    runAt?: string

    maxAttempts?: number

    uniqueKey?: string | null
}

export type JobFilters = {
    status?: JobStatus
    kind?: string
    q?: string
    limit?: number
    offset?: number

    cursor?: string
}

export type JobStats = Record<JobStatus, number>

export type JobScheduleRun = {
    id: string

    status: JobStatus

    runAt: string
    finishedAt: string | null

    attempts: number
    error: string
}

export type JobSchedule = {
    kind: string

    cron: string

    description: string

    nextRunAt: string | null

    lastRun: JobScheduleRun | null
}

export type JobRunRequest = {
    kinds: string[]
}

export type JobRunResult = {
    triggered: string[]
}
