import type { Job, JobStatus } from '../contracts/index.js'

export type JobRow = {
    id: string
    kind: string
    payload: Record<string, unknown>
    status: JobStatus
    run_at: Date
    attempts: number
    max_attempts: number
    error: string
    unique_key: string | null
    started_at: Date | null
    finished_at: Date | null
    created_at: Date
    updated_at: Date
}

export const toJob = (row: JobRow): Job => ({
    id: row.id,
    kind: row.kind,
    payload: row.payload ?? {},
    status: row.status,
    runAt: row.run_at.toISOString(),
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    error: row.error,
    startedAt: row.started_at?.toISOString() ?? null,
    finishedAt: row.finished_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})
