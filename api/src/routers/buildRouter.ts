import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { BuildFilters, RealmJobResult, RealmJobStatus } from '../contracts/index.js'
import { BUILD_FILE_GROUPS, BUILD_STATUSES } from '../contracts/index.js'
import { requireAuth } from '../auth.js'
import { loadProject, requireProjectPermission } from '../projectAuth.js'
import { requireRealm } from '../realmAuth.js'
import container from '../container.js'
import { BuildService } from '../services/BuildService.js'
import { RealmService } from '../services/RealmService.js'
import { recordAudit } from '../audit.js'

const builds = () => container.resolve(BuildService)
const realms = () => container.resolve(RealmService)

const tagSchema = {
    type: 'object',
    required: ['buildTag'],
    additionalProperties: false,
    properties: { buildTag: { type: 'string', maxLength: 80 } },
} as const

const claimSchema = {
    type: 'object',
    additionalProperties: false,
    properties: { waitMs: { type: 'number', minimum: 0, maximum: 30000 } },
} as const

const statusSchema = {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: {
        status: { type: 'string' },
        progress: { type: 'number' },
        message: { type: 'string', maxLength: 500 },
    },
} as const

const resultSchema = {
    type: 'object',
    required: ['state'],
    additionalProperties: false,
    properties: {
        state: { type: 'string', enum: ['fulfilled', 'rejected'] },
        artifactUrl: { type: 'string', maxLength: 1000 },
        manifestUrl: { type: 'string', maxLength: 1000 },
        checksum: { type: 'string', maxLength: 200 },
        sizeBytes: { type: 'number', minimum: 0 },
        durationMs: { type: 'number', minimum: 0 },
        error: { type: 'string', maxLength: 2000 },
        files: {
            type: 'array',
            maxItems: 5000,
            items: {
                type: 'object',
                required: ['group', 'name'],
                additionalProperties: false,
                properties: {
                    group: { type: 'string', enum: [...BUILD_FILE_GROUPS] },
                    name: { type: 'string', minLength: 1, maxLength: 300 },
                    url: { type: 'string', maxLength: 1000 },
                    sizeBytes: { type: 'number', minimum: 0 },
                    checksum: { type: 'string', maxLength: 200 },
                },
            },
        },
    },
} as const

const listBuildsEndpoint = async (request: FastifyRequest<{ Querystring: BuildFilters }>) =>
    builds().list(request.project!.id, request.query)

const buildDetailEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; buildId: string } }>,
    reply: FastifyReply
) => {
    return await builds().detail(request.project!.id, request.params.buildId)
}

const triggerBuildEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; bundleId: string } }>,
    reply: FastifyReply
) => {
    const build = await builds().trigger(request.user!, request.project!, request.params.bundleId)
    void recordAudit(request.user!, 'build.triggered', build.id, build.bundleName, request.id)
    reply.code(201)
    return build
}

const setTagEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; buildId: string }; Body: { buildTag: string } }>,
    reply: FastifyReply
) => {
    const build = await builds().setTag(request.project!, request.params.buildId, request.body.buildTag)
    void recordAudit(request.user!, 'build.tagged', build.id, build.buildTag, request.id)
    return build
}

const deleteBuildEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; buildId: string } }>,
    reply: FastifyReply
) => {
    await builds().remove(request.project!, request.params.buildId)
    void recordAudit(request.user!, 'build.deleted', request.params.buildId, request.project!.id, request.id)
    reply.code(204)
    return null
}

const purgeBuildsEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
    const purged = await builds().purgeUntagged(request.project!)
    void recordAudit(request.user!, 'build.purged', request.project!.id, String(purged), request.id)
    return { purged }
}

const claimJobEndpoint = async (
    request: FastifyRequest<{ Body: { waitMs?: number } }>,
    reply: FastifyReply
) => {
    const job = await builds().claim(request.realm!, request.body?.waitMs)
    if (!job) {
        reply.code(204)
        return null
    }
    return job
}

const jobStatusEndpoint = async (
    request: FastifyRequest<{ Params: { jobId: string }; Body: RealmJobStatus }>,
    reply: FastifyReply
) => {
    if (request.body.status === 'started' || request.body.status === 'in_progress') {
        await builds().report(request.realm!, request.params.jobId)
    }
    reply.code(204)
    return null
}

const jobResultEndpoint = async (
    request: FastifyRequest<{ Params: { jobId: string }; Body: RealmJobResult }>,
    reply: FastifyReply
) => {
    await builds().complete(request.realm!, request.params.jobId, request.body)
    reply.code(204)
    return null
}

export const buildRouter: FastifyPluginAsync = async (app) => {
    app.get<{ Params: { id: string }; Querystring: BuildFilters }>(
        '/api/projects/:id/builds',
        { preHandler: [requireAuth, loadProject] },
        listBuildsEndpoint
    )

    app.get<{ Params: { id: string; buildId: string } }>(
        '/api/projects/:id/builds/:buildId',
        { preHandler: [requireAuth, loadProject] },
        buildDetailEndpoint
    )

    app.post<{ Params: { id: string; bundleId: string } }>(
        '/api/projects/:id/bundles/:bundleId/builds',
        { preHandler: [requireAuth, requireProjectPermission('build.run')] },
        triggerBuildEndpoint
    )

    app.put<{ Params: { id: string; buildId: string }; Body: { buildTag: string } }>(
        '/api/projects/:id/builds/:buildId/tag',
        { schema: { body: tagSchema }, preHandler: [requireAuth, requireProjectPermission('build.run')] },
        setTagEndpoint
    )

    app.delete<{ Params: { id: string; buildId: string } }>(
        '/api/projects/:id/builds/:buildId',
        { preHandler: [requireAuth, requireProjectPermission('build.run')] },
        deleteBuildEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/projects/:id/builds',
        { preHandler: [requireAuth, requireProjectPermission('build.run')] },
        purgeBuildsEndpoint
    )

    app.post<{ Body: { waitMs?: number } }>(
        '/api/realm/jobs/next',
        { schema: { body: claimSchema }, preHandler: [requireRealm] },
        claimJobEndpoint
    )

    app.post<{ Params: { jobId: string }; Body: RealmJobStatus }>(
        '/api/realm/jobs/:jobId/status',
        { schema: { body: statusSchema }, preHandler: [requireRealm] },
        jobStatusEndpoint
    )

    app.post<{ Params: { jobId: string }; Body: RealmJobResult }>(
        '/api/realm/jobs/:jobId/result',
        { schema: { body: resultSchema }, preHandler: [requireRealm] },
        jobResultEndpoint
    )
}

export const BUILD_WIRE_STATUSES = BUILD_STATUSES
