import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { BundleDraft, BundleRule } from '../contracts/index.js'
import { BUNDLE_ENGINES, PACKING_ALGORITHMS, encodeErrorCause } from '../contracts/index.js'
import { requireAuth } from '../auth.js'
import { loadProject, requireProjectPermission } from '../projectAuth.js'
import container from '../container.js'
import { BundleService } from '../services/BundleService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const bundles = () => container.resolve(BundleService)

const bundleSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        engine: { type: 'string', enum: [...BUNDLE_ENGINES] },
        categoryId: { type: ['string', 'null'], maxLength: 80 },
        includedTags: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 80 } },
        excludedTags: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 80 } },
        buildTag: { type: 'string', maxLength: 80 },
        algorithm: { type: 'string', enum: [...PACKING_ALGORITHMS] },
        downscale: { type: 'number', minimum: 1, maximum: 100 },
        rotationEnabled: { type: 'boolean' },
    },
} as const

const previewSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        categoryId: { type: ['string', 'null'], maxLength: 80 },
        includedTags: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 80 } },
        excludedTags: { type: 'array', maxItems: 100, items: { type: 'string', minLength: 1, maxLength: 80 } },
    },
} as const

const listBundlesEndpoint = async (request: FastifyRequest) => bundles().list(request.project!.id)

const createBundleEndpoint = async (
    request: FastifyRequest<{ Body: BundleDraft }>,
    reply: FastifyReply
) => {
    try {
        const created = await bundles().create(request.project!, request.body)
        if (created.isErr()) {
            reply.code(409)
            return { error: encodeErrorCause('bundle_name_exists') }
        }
        const bundle = created.unwrap()
        void recordAudit(request.user!, 'bundle.created', bundle.id, bundle.name, request.id)
        reply.code(201)
        return bundle
    } catch (error) {
        return sendError(reply, error)
    }
}

const patchBundleEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; bundleId: string }; Body: Partial<BundleDraft> }>,
    reply: FastifyReply
) => {
    try {
        const updated = await bundles().update(request.project!, request.params.bundleId, request.body)
        if (updated.isErr()) {
            reply.code(409)
            return { error: encodeErrorCause('bundle_name_exists') }
        }
        const bundle = updated.unwrap()
        void recordAudit(request.user!, 'bundle.updated', bundle.id, bundle.name, request.id)
        return bundle
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteBundleEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; bundleId: string } }>,
    reply: FastifyReply
) => {
    try {
        await bundles().remove(request.project!, request.params.bundleId)
        void recordAudit(request.user!, 'bundle.deleted', request.params.bundleId, request.project!.id, request.id)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const previewEndpoint = async (request: FastifyRequest<{ Body: BundleRule }>) =>
    bundles().preview(request.project!.id, request.body ?? {})

export const bundleRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/bundles',
        { preHandler: [loadProject] },
        listBundlesEndpoint
    )

    app.post<{ Params: { id: string }; Body: BundleRule }>(
        '/api/projects/:id/bundles/preview',
        { schema: { body: previewSchema }, preHandler: [loadProject] },
        previewEndpoint
    )

    app.post<{ Params: { id: string }; Body: BundleDraft }>(
        '/api/projects/:id/bundles',
        { schema: { body: bundleSchema }, preHandler: [requireProjectPermission('bundle.write')] },
        createBundleEndpoint
    )

    app.patch<{ Params: { id: string; bundleId: string }; Body: Partial<BundleDraft> }>(
        '/api/projects/:id/bundles/:bundleId',
        {
            schema: { body: { ...bundleSchema, required: [] } },
            preHandler: [requireProjectPermission('bundle.write')],
        },
        patchBundleEndpoint
    )

    app.delete<{ Params: { id: string; bundleId: string } }>(
        '/api/projects/:id/bundles/:bundleId',
        { preHandler: [requireProjectPermission('bundle.write')] },
        deleteBundleEndpoint
    )
}
