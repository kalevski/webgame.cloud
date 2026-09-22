import { inject, injectable } from 'tsyringe'
import type {
    Alarm,
    ComponentState,
    HealthComponent,
    HealthComponentKey,
    OpsStatus,
    ReadyReport,
} from '../contracts/index.js'
import {
    ALARM_KEYS,
    ALARM_SENTENCES,
    ALARM_THRESHOLDS,
    HEALTH_COMPONENTS,
    READINESS_BLOCKING,
} from '../contracts/index.js'
import { Database } from '../Database.js'
import { BUILD_SHA, DATABASE_SLOW_MS } from '../env.js'
import { STARTED_AT, workerHealth } from '../health.js'
import { getStoragePort } from '../domain/storage.js'
import { EmailRepository } from '../repositories/email/EmailRepository.js'
import { JobRepository } from '../repositories/jobs/JobRepository.js'
import { EmailService } from './EmailService.js'
import { FeatureService } from './FeatureService.js'
import { FileService } from './FileService.js'
import { SigningKeyService } from './SigningKeyService.js'
import pkg from '../../package.json' with { type: 'json' }

type Probe = { state: ComponentState; detail: string }

const ok = (detail: string): Probe => ({ state: 'ok', detail })
const degraded = (detail: string): Probe => ({ state: 'degraded', detail })
const down = (detail: string): Probe => ({ state: 'down', detail })

const ageSeconds = (since: Date | string | null): number => {
    if (!since) return 0
    return Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 1000))
}

const duration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`
    return `${Math.round(seconds / 3600)} h`
}

@injectable()
export class HealthService {
    private mailDownSince: number | null = null

    constructor(
        @inject(Database) private database: Database,
        @inject(FeatureService) private features: FeatureService,
        @inject(FileService) private files: FileService,
        @inject(SigningKeyService) private signing: SigningKeyService,
        @inject(JobRepository) private jobs: JobRepository,
        @inject(EmailRepository) private email: EmailRepository,
        @inject(EmailService) private mail: EmailService
    ) {}

    async migrationVersion(): Promise<number | null> {
        const { rows } = await this.database.pool.query<{ version_id: string | null }>(
            'SELECT max(version_id) AS version_id FROM goose_db_version WHERE is_applied'
        )
        const value = rows[0]?.version_id
        return value === null || value === undefined ? null : Number(value)
    }

    private async probeDatabase(): Promise<Probe & { millis: number | null }> {
        const started = Date.now()
        try {
            await this.database.pool.query('SELECT 1')
            const millis = Date.now() - started
            if (millis > DATABASE_SLOW_MS) {
                return { ...degraded(`SELECT 1 answered in ${millis} ms, over the ${DATABASE_SLOW_MS} ms budget`), millis }
            }
            return { ...ok(`answering in ${millis} ms`), millis }
        } catch (error) {
            return { ...down(`the connection failed: ${String(error)}`), millis: null }
        }
    }

    private async probeMigrations(): Promise<Probe & { version: number | null }> {
        try {
            const version = await this.migrationVersion()
            if (version === null) {
                return { ...down('no goose migration has been applied — the database is not migrated'), version }
            }
            return { ...ok(`schema version ${version}`), version }
        } catch (error) {
            return { ...down(`the migration table is unreadable: ${String(error)}`), version: null }
        }
    }

    private async probeStorage(): Promise<Probe> {
        if (!(await this.features.isEnabled('files'))) return ok('the files flag is off — no source is in use')

        const bindings = await this.files.getBindings()
        const boundIds = [...new Set(Object.values(bindings).filter(Boolean))] as string[]
        if (boundIds.length === 0) return degraded('the files flag is on but no file type is bound to a source')

        const sources = await this.files.listSources()
        const failures: string[] = []
        for (const id of boundIds) {
            const source = sources.find((entry) => entry.id === id)
            if (!source) {
                failures.push(`a file type is bound to source ${id}, which no longer exists`)
                continue
            }
            if (!getStoragePort(source.type)) {
                failures.push(`no storage port is registered for source type ${source.type}`)
            }
        }

        if (failures.length > 0) return down(failures.join('; '))
        return ok(`${boundIds.length} bound source${boundIds.length === 1 ? '' : 's'} reachable`)
    }

    private async probeSigningKeys(): Promise<Probe> {
        try {
            const keys = await this.signing.list()
            if (keys.length === 0) return degraded('no signing key pair exists yet')
            return ok(`${keys.length} key pair${keys.length === 1 ? '' : 's'} readable`)
        } catch (error) {
            return degraded(`a signing key is unreadable: ${String(error)}`)
        }
    }

    private async probeJobQueue(): Promise<Probe & { oldestSeconds: number }> {
        try {
            const { oldest, due } = await this.jobs.oldestDue()
            const seconds = ageSeconds(oldest)
            if (due === 0) return { ...ok('nothing is due'), oldestSeconds: 0 }
            if (seconds > ALARM_THRESHOLDS.queueStalledSeconds) {
                return {
                    ...down(`${due} job${due === 1 ? '' : 's'} due, the oldest for ${duration(seconds)}`),
                    oldestSeconds: seconds,
                }
            }
            return { ...ok(`${due} job${due === 1 ? '' : 's'} due, the oldest for ${duration(seconds)}`), oldestSeconds: seconds }
        } catch (error) {
            return { ...degraded(`the queue is unreadable: ${String(error)}`), oldestSeconds: 0 }
        }
    }

    private async probeMail(): Promise<Probe & { backlogSeconds: number; failed: number }> {
        if (!(await this.features.isEnabled('email'))) {
            return { ...ok('the email flag is off — nothing is queued'), backlogSeconds: 0, failed: 0 }
        }

        let backlogSeconds = 0
        let failed = 0
        try {
            const stats = await this.email.oldestQueued()
            backlogSeconds = ageSeconds(stats.oldest)
            failed = stats.failed
        } catch (error) {
            return { ...degraded(`the mail queue is unreadable: ${String(error)}`), backlogSeconds: 0, failed: 0 }
        }

        try {
            const { port, sender } = await this.mail.port()
            const ready = port.ready(sender)
            if (!ready) {
                this.mailDownSince ??= Date.now()
                return { ...down(`the ${port.id} provider is not ready to send`), backlogSeconds, failed }
            }
            this.mailDownSince = null
            const detail = failed > 0
                ? `${port.id} ready, ${failed} message${failed === 1 ? '' : 's'} have exhausted their retries`
                : `${port.id} ready`
            return { ...(failed > 0 ? degraded(detail) : ok(detail)), backlogSeconds, failed }
        } catch (error) {
            this.mailDownSince ??= Date.now()
            return { ...down(`the provider failed its readiness check: ${String(error)}`), backlogSeconds, failed }
        }
    }

    async report(): Promise<{ components: HealthComponent[]; alarms: Alarm[]; migration: number | null }> {
        const [database, migrations, storage, signingKeys, jobQueue, mail] = await Promise.all([
            this.probeDatabase(),
            this.probeMigrations(),
            this.probeStorage(),
            this.probeSigningKeys(),
            this.probeJobQueue(),
            this.probeMail(),
        ])

        const probes: Record<HealthComponentKey, Probe> = {
            database,
            migrations,
            storage,
            signingKeys,
            jobQueue,
            mail,
        }

        const components = HEALTH_COMPONENTS.map((key) => ({
            key,
            state: probes[key].state,
            detail: probes[key].detail,
        }))

        const mailDownSeconds = this.mailDownSince === null ? 0 : Math.round((Date.now() - this.mailDownSince) / 1000)

        const firing: Record<string, { firing: boolean; detail: string }> = {
            queue_stalled: {
                firing: jobQueue.oldestSeconds > ALARM_THRESHOLDS.queueStalledSeconds,
                detail: jobQueue.detail,
            },
            mail_backlog: {
                firing: mail.backlogSeconds > ALARM_THRESHOLDS.mailBacklogSeconds || mail.failed > 0,
                detail: mail.backlogSeconds > 0
                    ? `the oldest queued message has waited ${duration(mail.backlogSeconds)}, ${mail.failed} exhausted`
                    : `${mail.failed} message${mail.failed === 1 ? '' : 's'} have exhausted their retries`,
            },
            mail_down: {
                firing: mailDownSeconds > ALARM_THRESHOLDS.mailDownSeconds,
                detail: mail.detail,
            },
            database_degraded: {
                firing: database.state !== 'ok',
                detail: database.detail,
            },
        }

        const alarms = ALARM_KEYS.map((key) => ({
            key,
            firing: firing[key]?.firing ?? false,
            sentence: ALARM_SENTENCES[key],
            detail: firing[key]?.detail ?? '',
        }))

        return { components, alarms, migration: migrations.version }
    }

    private isReady(components: HealthComponent[]): boolean {
        return components
            .filter((component) => READINESS_BLOCKING.includes(component.key))
            .every((component) => component.state !== 'down')
    }

    async readiness(): Promise<ReadyReport & { components: HealthComponent[] }> {
        const { components, migration } = await this.report()
        const ready = this.isReady(components)

        return { ready, components, migration, workers: workerHealth() }
    }

    async status(): Promise<OpsStatus> {
        const { components, alarms } = await this.report()
        const ready = this.isReady(components)

        return {
            ready,
            name: pkg.name,
            version: pkg.version,
            build: BUILD_SHA,
            startedAt: STARTED_AT,
            components,
            alarms,
            workers: workerHealth(),
        }
    }
}
