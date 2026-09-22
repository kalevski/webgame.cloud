import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import { BUILD_SHA } from '../env.js'
import { STARTED_AT } from '../health.js'
import { requirePermission } from '../auth.js'
import type { OpsStatus, ReadyReport, VersionInfo } from '../contracts/index.js'
import { HealthService } from '../services/HealthService.js'
import pkg from '../../package.json' with { type: 'json' }

const APP_NAME = pkg.name
const APP_VERSION = pkg.version

const health = () => container.resolve(HealthService)

const healthEndpoint = async () => ({ status: 'ok' })

const readyEndpoint = async (request: FastifyRequest, reply: FastifyReply): Promise<ReadyReport> => {
    const report = await health().readiness()
    if (!report.ready) reply.code(503)

    if (!request.can('admin.overview.read')) return { ready: report.ready }
    return report
}

const versionEndpoint = async (): Promise<VersionInfo> => ({
    name: APP_NAME,
    version: APP_VERSION,
    build: BUILD_SHA,
    startedAt: STARTED_AT,
})

const statusEndpoint = async (): Promise<OpsStatus> => health().status()

export const healthRouter: FastifyPluginAsync = async (app) => {
    app.get('/api/health', healthEndpoint)

    app.get('/api/ready', readyEndpoint)

    app.get('/api/version', { config: { cache: { maxAge: 60, staleWhileRevalidate: 300 } } }, versionEndpoint)

    app.get('/api/ops/status', { preHandler: requirePermission('admin.overview.read') }, statusEndpoint)
}
