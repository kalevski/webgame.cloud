import { inject, injectable } from 'tsyringe'
import { randomUUID } from 'node:crypto'
import type {
    Job,
    JobDraft,
    JobFilters,
    JobSchedule,
    JobStats,
    JobStatus,
} from '../contracts/index.js'
import { JOB_STATUSES } from '../contracts/index.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'
import { jobRegistrations, nextRun, scheduledRegistrations } from '../domain/jobs.js'
import { JobRepository } from '../repositories/jobs/JobRepository.js'
import { decodeCursor, takePage } from '../repositories/pagination.js'
import { toJob } from '../schema/jobs.js'

const EMPTY_STATS: JobStats = { queued: 0, running: 0, done: 0, failed: 0, canceled: 0 }

@injectable()
export class JobService {
    constructor(@inject(JobRepository) private jobs: JobRepository) {}

    async enqueue(draft: JobDraft): Promise<Job | null> {
        const created = await this.jobs.insertJob({
            id: randomUUID(),
            kind: draft.kind,
            payload: draft.payload ?? {},
            runAt: draft.runAt ? new Date(draft.runAt) : null,
            maxAttempts: draft.maxAttempts ?? 5,
            uniqueKey: draft.uniqueKey ?? null,
        })
        return created ? toJob(created) : null
    }

    async list(
        filters: JobFilters
    ): Promise<{ jobs: Job[]; total: number; stats: JobStats; nextCursor: string | null }> {
        const query = {
            status: filters.status ?? null,
            kind: filters.kind ?? null,
            q: filters.q?.trim() || null,
        }
        const limit = filters.limit ?? 25
        const cursor = decodeCursor(filters.cursor)

        const [rows, total, stats] = await Promise.all([
            this.jobs.list({
                ...query,
                limit: limit + 1,
                offset: cursor.createdAt ? 0 : filters.offset ?? 0,
                cursor,
            }),
            this.jobs.countJobs(query),
            this.jobs.stats(),
        ])

        const page = takePage(rows, limit, (row) => ({ createdAt: row.created_at, id: row.id }))

        const counts: JobStats = { ...EMPTY_STATS }
        for (const row of stats) {
            if ((JOB_STATUSES as readonly string[]).includes(row.status)) counts[row.status] = Number(row.c)
        }

        return { jobs: page.rows.map(toJob), total, stats: counts, nextCursor: page.nextCursor }
    }

    async listSchedules(): Promise<JobSchedule[]> {
        const registrations = scheduledRegistrations()
        const latest = await this.jobs.latestPerKind(registrations.map((entry) => entry.kind))
        const byKind = new Map(latest.map((row) => [row.kind, row]))
        const now = new Date()

        return registrations.map((registration) => {
            const row = byKind.get(registration.kind)
            const upcoming = nextRun(registration.cron, now)
            return {
                kind: registration.kind,
                cron: registration.cron,
                description: registration.description,
                nextRunAt: upcoming ? upcoming.toISOString() : null,
                lastRun: row
                    ? {
                        id: row.id,
                        status: row.status,
                        runAt: row.run_at.toISOString(),
                        finishedAt: row.finished_at?.toISOString() ?? null,
                        attempts: row.attempts,
                        error: row.error,
                    }
                    : null,
            }
        })
    }

    async runNow(kinds: string[]): Promise<string[]> {
        const known = new Set(jobRegistrations().map((entry) => entry.kind))
        const scheduled = scheduledRegistrations().map((entry) => entry.kind)
        const targets = kinds.length > 0 ? kinds : scheduled

        const unknown = targets.filter((kind) => !known.has(kind))
        if (unknown.length > 0) {
            throw new ValidationError('job_kind_unknown', 'no handler is registered for that job', unknown)
        }

        const triggered: string[] = []
        for (const kind of targets) {
            await this.enqueue({ kind, uniqueKey: `manual:${kind}:${randomUUID()}` })
            triggered.push(kind)
        }
        return triggered
    }

    async setStatus(id: string, status: JobStatus): Promise<Job> {
        const updated = await this.jobs.setStatus(id, status)
        if (!updated) throw new NotFoundError('job_not_found', 'job not found', [id])
        const row = await this.jobs.findById(id)
        if (!row) throw new NotFoundError('job_not_found', 'job not found', [id])
        return toJob(row)
    }
}
