import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type {
    FrameTemplate,
    FrameTemplateDraft,
    Design,
    DesignDraft,
    DesignSourceInfo,
    DesignSourceItem,
    User,
    VideoTemplate,
    VideoTemplateDraft,
} from '../contracts/index.js'
import {
    OWNER_ROLE_ID,
    DESIGN_ALIGNMENTS,
    DESIGN_FIELD_KINDS,
    DESIGN_FONTS,
    DESIGN_FORMATS,
    DESIGN_GRADIENT_DIRECTIONS,
    DESIGN_IMAGE_FITS,
    DESIGN_LAYER_KINDS,
    DESIGN_KINDS,
    DESIGN_TRANSITIONS,
    DESIGN_DURATION_BOUNDS,
    DESIGN_FIELD_LIMIT,
    DESIGN_FRAME_LIMIT,
    DESIGN_LAYER_LIMIT,
    encodeErrorCause,
} from '../contracts/index.js'
import { requireAuth, requirePermission } from '../auth.js'
import { requireFeature } from '../features.js'
import container from '../container.js'
import { DesignService } from '../services/DesignService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'
import { designSource, designSourceCatalog } from '../domain/designSources.js'

const studio = () => container.resolve(DesignService)

const canEditTemplate = (user: User, ownerId: string): boolean =>
    user.role === OWNER_ROLE_ID || ownerId === user.id

const layerSchema = {
    type: 'object',
    required: ['id', 'kind'],
    additionalProperties: false,
    properties: {
        id: { type: 'string', minLength: 1, maxLength: 60 },
        kind: { type: 'string', enum: [...DESIGN_LAYER_KINDS] },
        x: { type: 'number', minimum: -100, maximum: 200 },
        y: { type: 'number', minimum: -100, maximum: 200 },
        width: { type: 'number', minimum: 0, maximum: 200 },
        height: { type: 'number', minimum: 0, maximum: 200 },
        field: { type: 'string', maxLength: 60 },
        text: { type: 'string', maxLength: 2000 },
        font: { type: 'string', enum: [...DESIGN_FONTS] },
        fontSize: { type: 'number', minimum: 4, maximum: 400 },
        fontWeight: { type: 'integer', minimum: 100, maximum: 900 },
        align: { type: 'string', enum: [...DESIGN_ALIGNMENTS] },
        lineHeight: { type: 'number', minimum: 0.6, maximum: 3 },
        uppercase: { type: 'boolean' },
        letterSpacing: { type: 'number', minimum: -20, maximum: 60 },
        color: { type: 'string', maxLength: 40 },
        opacity: { type: 'number', minimum: 0, maximum: 1 },
        radius: { type: 'number', minimum: 0, maximum: 500 },
        fit: { type: 'string', enum: [...DESIGN_IMAGE_FITS] },
        gradientTo: { type: 'string', maxLength: 40 },
        gradientDirection: { type: 'string', enum: [...DESIGN_GRADIENT_DIRECTIONS] },
        css: { type: 'string', maxLength: 2000 },
    },
} as const

const fieldSchema = {
    type: 'object',
    required: ['key', 'label', 'kind'],
    additionalProperties: false,
    properties: {
        key: { type: 'string', minLength: 1, maxLength: 60 },
        label: { type: 'string', minLength: 1, maxLength: 120 },
        kind: { type: 'string', enum: [...DESIGN_FIELD_KINDS] },
        sample: { type: 'string', maxLength: 2000 },
        source: { type: 'string', maxLength: 60 },
        sourceField: { type: 'string', maxLength: 60 },
    },
} as const

const frameSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        description: { type: 'string', maxLength: 500 },
        format: { type: 'string', enum: [...DESIGN_FORMATS] },
        background: { type: 'string', maxLength: 40 },
        layers: { type: 'array', maxItems: DESIGN_LAYER_LIMIT, items: layerSchema },
        fields: { type: 'array', maxItems: DESIGN_FIELD_LIMIT, items: fieldSchema },
    },
} as const

const videoFrameSchema = {
    type: 'object',
    required: ['frameTemplateId'],
    additionalProperties: false,
    properties: {
        frameTemplateId: { type: 'string', minLength: 1, maxLength: 60 },
        durationMs: {
            type: 'integer',
            minimum: DESIGN_DURATION_BOUNDS.min,
            maximum: DESIGN_DURATION_BOUNDS.max,
        },
        transition: { type: 'string', enum: [...DESIGN_TRANSITIONS] },
        values: { type: 'object', additionalProperties: { type: 'string', maxLength: 4000 } },
    },
} as const

const videoSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        description: { type: 'string', maxLength: 500 },
        format: { type: 'string', enum: [...DESIGN_FORMATS] },
        frames: { type: 'array', maxItems: DESIGN_FRAME_LIMIT, items: videoFrameSchema },
    },
} as const

const renderSchema = {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        kind: { type: 'string', enum: [...DESIGN_KINDS] },
        frameTemplateId: { type: ['string', 'null'], maxLength: 60 },
        videoTemplateId: { type: ['string', 'null'], maxLength: 60 },
        fileId: { type: ['string', 'null'], maxLength: 60 },
        entries: {
            type: 'array',
            maxItems: DESIGN_FRAME_LIMIT,
            items: {
                type: 'object',
                required: ['frameTemplateId'],
                additionalProperties: false,
                properties: {
                    frameTemplateId: { type: 'string', minLength: 1, maxLength: 60 },
                    values: { type: 'object', additionalProperties: { type: 'string', maxLength: 4000 } },
                },
            },
        },
    },
} as const

const listSourcesEndpoint = async (): Promise<DesignSourceInfo[]> => designSourceCatalog()

const listSourceItemsEndpoint = async (
    request: FastifyRequest<{ Params: { sourceId: string } }>,
    reply: FastifyReply
): Promise<DesignSourceItem[] | { error: string }> => {
    const source = designSource(request.params.sourceId)
    if (!source) {
        reply.code(404)
        return { error: encodeErrorCause('design_source_not_found', request.params.sourceId) }
    }
    return source.list(request.user!)
}

const resolveSourceEndpoint = async (
    request: FastifyRequest<{ Params: { sourceId: string; itemId: string } }>,
    reply: FastifyReply
): Promise<Record<string, string> | { error: string }> => {
    const source = designSource(request.params.sourceId)
    if (!source) {
        reply.code(404)
        return { error: encodeErrorCause('design_source_not_found', request.params.sourceId) }
    }
    return source.resolve(request.user!, request.params.itemId)
}

const listRendersEndpoint = async (request: FastifyRequest): Promise<Design[]> =>
    studio().listRenders(request.user!.id)

const createRenderEndpoint = async (request: FastifyRequest<{ Body: DesignDraft }>, reply: FastifyReply) => {
    try {
        const render = await studio().createRender(request.user!, request.body)
        void recordAudit(request.user!, 'create_design', render.id, render.name)
        reply.code(201)
        return render
    } catch (error) {
        return sendError(reply, error)
    }
}

const getRenderEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const render = await studio().getRender(request.params.id)
    if (!render || !canEditTemplate(request.user!, render.ownerId)) {
        reply.code(404)
        return { error: encodeErrorCause('design_not_found', request.params.id) }
    }
    return render
}

const patchRenderEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: Partial<DesignDraft> }>,
    reply: FastifyReply
) => {
    try {
        const render = await studio().getRender(request.params.id)
        if (!render || !canEditTemplate(request.user!, render.ownerId)) {
            reply.code(404)
            return { error: encodeErrorCause('design_not_found', request.params.id) }
        }
        const updated = await studio().updateRender(request.params.id, render, request.body)
        void recordAudit(request.user!, 'update_design', updated.id, updated.name)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteRenderEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const render = await studio().getRender(request.params.id)
        if (!render || !canEditTemplate(request.user!, render.ownerId)) {
            reply.code(404)
            return { error: encodeErrorCause('design_not_found', request.params.id) }
        }
        await studio().removeRender(request.params.id)
        void recordAudit(request.user!, 'delete_design', render.id, render.name)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const listFramesEndpoint = async (request: FastifyRequest): Promise<FrameTemplate[]> =>
    studio().listFrames(request.user!.id)

const createFrameEndpoint = async (request: FastifyRequest<{ Body: FrameTemplateDraft }>, reply: FastifyReply) => {
    try {
        const frame = await studio().createFrame(request.user!, request.body)
        void recordAudit(request.user!, 'create_frame_template', frame.id, frame.name)
        reply.code(201)
        return frame
    } catch (error) {
        return sendError(reply, error)
    }
}

const getFrameEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const frame = await studio().getFrame(request.params.id)
    if (!frame || !canEditTemplate(request.user!, frame.ownerId)) {
        reply.code(404)
        return { error: encodeErrorCause('frame_template_not_found', request.params.id) }
    }
    return frame
}

const patchFrameEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: Partial<FrameTemplateDraft> }>,
    reply: FastifyReply
) => {
    try {
        const frame = await studio().getFrame(request.params.id)
        if (!frame || !canEditTemplate(request.user!, frame.ownerId)) {
            reply.code(404)
            return { error: encodeErrorCause('frame_template_not_found', request.params.id) }
        }
        const updated = await studio().updateFrame(request.params.id, frame, request.body)
        void recordAudit(request.user!, 'update_frame_template', updated.id, updated.name)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteFrameEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const frame = await studio().getFrame(request.params.id)
        if (!frame || !canEditTemplate(request.user!, frame.ownerId)) {
            reply.code(404)
            return { error: encodeErrorCause('frame_template_not_found', request.params.id) }
        }
        await studio().removeFrame(request.params.id)
        void recordAudit(request.user!, 'delete_frame_template', frame.id, frame.name)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

const listVideosEndpoint = async (request: FastifyRequest): Promise<VideoTemplate[]> =>
    studio().listVideos(request.user!.id)

const createVideoEndpoint = async (request: FastifyRequest<{ Body: VideoTemplateDraft }>, reply: FastifyReply) => {
    try {
        const video = await studio().createVideo(request.user!, request.body)
        void recordAudit(request.user!, 'create_video_template', video.id, video.name)
        reply.code(201)
        return video
    } catch (error) {
        return sendError(reply, error)
    }
}

const getVideoEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const video = await studio().getVideo(request.params.id)
    if (!video || !canEditTemplate(request.user!, video.ownerId)) {
        reply.code(404)
        return { error: encodeErrorCause('video_template_not_found', request.params.id) }
    }
    return video
}

const patchVideoEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: Partial<VideoTemplateDraft> }>,
    reply: FastifyReply
) => {
    try {
        const video = await studio().getVideo(request.params.id)
        if (!video || !canEditTemplate(request.user!, video.ownerId)) {
            reply.code(404)
            return { error: encodeErrorCause('video_template_not_found', request.params.id) }
        }
        const updated = await studio().updateVideo(request.params.id, video, request.body)
        void recordAudit(request.user!, 'update_video_template', updated.id, updated.name)
        return updated
    } catch (error) {
        return sendError(reply, error)
    }
}

const deleteVideoEndpoint = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
        const video = await studio().getVideo(request.params.id)
        if (!video || !canEditTemplate(request.user!, video.ownerId)) {
            reply.code(404)
            return { error: encodeErrorCause('video_template_not_found', request.params.id) }
        }
        await studio().removeVideo(request.params.id)
        void recordAudit(request.user!, 'delete_video_template', video.id, video.name)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const designRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)
    app.addHook('preHandler', requireFeature('designs'))

    app.get(
        '/api/studio/frames',
        { preHandler: [requirePermission('design.template.read')] },
        listFramesEndpoint
    )

    app.post<{ Body: FrameTemplateDraft }>(
        '/api/studio/frames',
        { schema: { body: frameSchema }, preHandler: [requirePermission('design.template.write')] },
        createFrameEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/studio/frames/:id',
        { preHandler: [requirePermission('design.template.read')] },
        getFrameEndpoint
    )

    app.patch<{ Params: { id: string }; Body: Partial<FrameTemplateDraft> }>(
        '/api/studio/frames/:id',
        {
            schema: { body: { ...frameSchema, required: [] } },
            preHandler: [requirePermission('design.template.write')],
        },
        patchFrameEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/studio/frames/:id',
        { preHandler: [requirePermission('design.template.write')] },
        deleteFrameEndpoint
    )

    app.get(
        '/api/studio/videos',
        { preHandler: [requirePermission('design.template.read')] },
        listVideosEndpoint
    )

    app.post<{ Body: VideoTemplateDraft }>(
        '/api/studio/videos',
        { schema: { body: videoSchema }, preHandler: [requirePermission('design.template.write')] },
        createVideoEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/studio/videos/:id',
        { preHandler: [requirePermission('design.template.read')] },
        getVideoEndpoint
    )

    app.patch<{ Params: { id: string }; Body: Partial<VideoTemplateDraft> }>(
        '/api/studio/videos/:id',
        {
            schema: { body: { ...videoSchema, required: [] } },
            preHandler: [requirePermission('design.template.write')],
        },
        patchVideoEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/studio/videos/:id',
        { preHandler: [requirePermission('design.template.write')] },
        deleteVideoEndpoint
    )

    app.get(
        '/api/studio/sources',
        { preHandler: [requirePermission('design.template.read')] },
        listSourcesEndpoint
    )

    app.get<{ Params: { sourceId: string } }>(
        '/api/studio/sources/:sourceId/items',
        { preHandler: [requirePermission('design.template.read')] },
        listSourceItemsEndpoint
    )

    app.get<{ Params: { sourceId: string; itemId: string } }>(
        '/api/studio/sources/:sourceId/items/:itemId',
        { preHandler: [requirePermission('design.template.read')] },
        resolveSourceEndpoint
    )

    app.get(
        '/api/studio/designs',
        { preHandler: [requirePermission('design.template.read')] },
        listRendersEndpoint
    )

    app.post<{ Body: DesignDraft }>(
        '/api/studio/designs',
        { schema: { body: renderSchema }, preHandler: [requirePermission('design.template.write')] },
        createRenderEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/studio/designs/:id',
        { preHandler: [requirePermission('design.template.read')] },
        getRenderEndpoint
    )

    app.patch<{ Params: { id: string }; Body: Partial<DesignDraft> }>(
        '/api/studio/designs/:id',
        {
            schema: { body: { ...renderSchema, required: [] } },
            preHandler: [requirePermission('design.template.write')],
        },
        patchRenderEndpoint
    )

    app.delete<{ Params: { id: string } }>(
        '/api/studio/designs/:id',
        { preHandler: [requirePermission('design.template.write')] },
        deleteRenderEndpoint
    )
}
