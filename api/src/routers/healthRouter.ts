import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import { Database } from '../Database.js'
import { BUILD_SHA } from '../env.js'
import { STARTED_AT, workerHealth } from '../health.js'
import type { ReadyReport, VersionInfo } from '../contracts/index.js'

const APP_NAME = '@appkit/api'
const APP_VERSION = '0.1.0'

const migrationVersion = async (): Promise<number | null> => {
    const database = container.resolve(Database)
    const { rows } = await database.pool.query<{ version_id: string | null }>(
        'SELECT max(version_id) AS version_id FROM goose_db_version WHERE is_applied'
    )
    const value = rows[0]?.version_id
    return value === null || value === undefined ? null : Number(value)
}

const healthEndpoint = async () => {
    const database = container.resolve(Database)
    await database.pool.query('SELECT 1')
    return { status: 'ok' }
}

const readyEndpoint = async (_request: FastifyRequest, reply: FastifyReply): Promise<ReadyReport> => {
    let database = true
    let migration: number | null = null
    try {
        migration = await migrationVersion()
    } catch {
        database = false
    }

    const workers = workerHealth()
    const ready = database && migration !== null && workers.every((worker) => worker.healthy)
    if (!ready) reply.code(503)

    return { ready, database, migration, workers }
}

const versionEndpoint = async (): Promise<VersionInfo> => ({
    name: APP_NAME,
    version: APP_VERSION,
    build: BUILD_SHA,
    startedAt: STARTED_AT,
})

export const healthRouter: FastifyPluginAsync = async (app) => {
    app.get('/api/health', healthEndpoint)

    app.get('/api/ready', readyEndpoint)

    app.get('/api/version', versionEndpoint)
}
