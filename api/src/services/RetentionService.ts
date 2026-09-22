import { inject, injectable } from 'tsyringe'
import type {
    PurgeRun,
    PurgeSettings,
    RetentionPolicy,
    RetentionReport,
    TableRetention,
} from '../contracts/index.js'
import {
    DEFAULT_RETENTION_DAYS,
    PURGE_BATCH_BOUNDS,
    PURGE_DEFAULTS,
    PURGE_INTERVAL_BOUNDS,
    PURGE_TABLES_PER_TICK_BOUNDS,
    RETENTION_MAX_DAYS,
} from '../contracts/index.js'
import { getLogger } from '../logging.js'
import { RetentionRepository } from '../repositories/retention/RetentionRepository.js'
import { SettingsService } from './SettingsService.js'

const log = getLogger('retention')

const settingKey = (table: string): string => `retention_${table}`

const SETTING = {
    intervalSeconds: 'purge_interval_seconds',
    batchSize: 'purge_batch_size',
    tablesPerTick: 'purge_tables_per_tick',
} as const

const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, Math.floor(value)))

@injectable()
export class RetentionService {
    constructor(
        @inject(RetentionRepository) private retention: RetentionRepository,
        @inject(SettingsService) private settings: SettingsService
    ) {}

    private cursor = 0

    private lastRun: PurgeRun | null = null

    async tables(): Promise<string[]> {
        return this.retention.listTables()
    }

    private resolveDays(stored: Map<string, string>, table: string): number {
        const raw = stored.get(settingKey(table))
        if (raw === undefined || raw === '') return DEFAULT_RETENTION_DAYS[table] ?? 0
        const days = Number(raw)
        return Number.isFinite(days) && days >= 0 ? Math.min(Math.floor(days), RETENTION_MAX_DAYS) : 0
    }

    async policy(): Promise<RetentionPolicy> {
        const [tables, stored] = await Promise.all([this.tables(), this.storedDays()])
        return Object.fromEntries(tables.map((table) => [table, this.resolveDays(stored, table)]))
    }

    private async storedDays(): Promise<Map<string, string>> {
        return this.settings.getRawByPrefix('retention_')
    }

    async savePolicy(patch: RetentionPolicy): Promise<void> {
        const tables = new Set(await this.tables())
        for (const [table, value] of Object.entries(patch)) {
            if (!tables.has(table) || value === undefined || value === null) continue
            await this.settings.setRaw(settingKey(table), String(clamp(Number(value) || 0, 0, RETENTION_MAX_DAYS)))
        }
    }

    async purgeSettings(): Promise<PurgeSettings> {
        const [interval, batch, perTick] = await Promise.all([
            this.settings.getRaw(SETTING.intervalSeconds),
            this.settings.getRaw(SETTING.batchSize),
            this.settings.getRaw(SETTING.tablesPerTick),
        ])
        return {
            intervalSeconds: clamp(
                Number(interval) || PURGE_DEFAULTS.intervalSeconds,
                PURGE_INTERVAL_BOUNDS.min,
                PURGE_INTERVAL_BOUNDS.max
            ),
            batchSize: clamp(
                Number(batch) || PURGE_DEFAULTS.batchSize,
                PURGE_BATCH_BOUNDS.min,
                PURGE_BATCH_BOUNDS.max
            ),
            tablesPerTick: clamp(
                Number(perTick) || PURGE_DEFAULTS.tablesPerTick,
                PURGE_TABLES_PER_TICK_BOUNDS.min,
                PURGE_TABLES_PER_TICK_BOUNDS.max
            ),
        }
    }

    async saveSettings(patch: Partial<PurgeSettings>): Promise<PurgeSettings> {
        if (patch.intervalSeconds !== undefined) {
            const value = clamp(patch.intervalSeconds, PURGE_INTERVAL_BOUNDS.min, PURGE_INTERVAL_BOUNDS.max)
            await this.settings.setRaw(SETTING.intervalSeconds, String(value))
        }
        if (patch.batchSize !== undefined) {
            const value = clamp(patch.batchSize, PURGE_BATCH_BOUNDS.min, PURGE_BATCH_BOUNDS.max)
            await this.settings.setRaw(SETTING.batchSize, String(value))
        }
        if (patch.tablesPerTick !== undefined) {
            const value = clamp(patch.tablesPerTick, PURGE_TABLES_PER_TICK_BOUNDS.min, PURGE_TABLES_PER_TICK_BOUNDS.max)
            await this.settings.setRaw(SETTING.tablesPerTick, String(value))
        }
        return this.purgeSettings()
    }

    async report(): Promise<RetentionReport> {
        const [tables, stored, settings] = await Promise.all([
            this.tables(),
            this.storedDays(),
            this.purgeSettings(),
        ])

        const rows = await Promise.all(tables.map(async (table): Promise<TableRetention> => {
            const days = this.resolveDays(stored, table)
            try {
                const counts = await this.retention.counts(table, days)
                return {
                    table,
                    days,
                    totalRows: counts.total,
                    softDeleted: counts.softDeleted,
                    duePurge: counts.due,
                }
            } catch (error) {
                log.warning('retention count failed', { table, error: String(error) })
                return { table, days, totalRows: 0, softDeleted: 0, duePurge: 0 }
            }
        }))

        return { tables: rows, settings, lastRun: this.lastRun }
    }

    async purgeOnce(): Promise<PurgeRun> {
        const startedAt = new Date().toISOString()
        const [settings, tables, stored] = await Promise.all([
            this.purgeSettings(),
            this.tables(),
            this.storedDays(),
        ])

        const run: PurgeRun = { startedAt, deleted: 0, tables: [] }
        if (tables.length === 0) {
            this.lastRun = run
            return run
        }

        let purged = 0
        let scanned = 0
        while (purged < settings.tablesPerTick && scanned < tables.length) {
            const table = tables[(this.cursor + scanned) % tables.length]!
            scanned += 1

            const days = this.resolveDays(stored, table)
            if (days <= 0) continue

            purged += 1
            try {
                const deleted = await this.retention.purgeBatch(table, days, settings.batchSize)
                if (deleted > 0) {
                    run.deleted += deleted
                    run.tables.push(table)
                }
            } catch (error) {
                log.warning('retention purge failed', { table, error: String(error) })
            }
        }

        this.cursor = (this.cursor + scanned) % tables.length
        if (run.deleted > 0) log.info('retention purge', { deleted: run.deleted, tables: run.tables })

        this.lastRun = run
        return run
    }
}
