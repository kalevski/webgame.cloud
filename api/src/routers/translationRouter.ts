import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { TranslationDoc } from '../contracts/index.js'
import { TRANSLATION_LIMITS } from '../contracts/index.js'
import { requireAuth } from '../auth.js'
import { loadProject, requireProjectPermission } from '../projectAuth.js'
import container from '../container.js'
import { TranslationService } from '../services/TranslationService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const translations = () => container.resolve(TranslationService)

const docSchema = {
    type: 'object',
    required: ['doc'],
    additionalProperties: false,
    properties: {
        doc: {
            type: 'object',
            required: ['languages', 'groups'],
            additionalProperties: false,
            properties: {
                languages: {
                    type: 'array',
                    maxItems: TRANSLATION_LIMITS.languages,
                    items: { type: 'string', minLength: 2, maxLength: 8 },
                },
                groups: {
                    type: 'array',
                    maxItems: TRANSLATION_LIMITS.groups,
                    items: {
                        type: 'object',
                        required: ['id', 'name', 'terms'],
                        additionalProperties: false,
                        properties: {
                            id: { type: 'string', minLength: 1, maxLength: 80 },
                            name: { type: 'string', minLength: 1, maxLength: TRANSLATION_LIMITS.groupNameLength },
                            terms: {
                                type: 'array',
                                maxItems: TRANSLATION_LIMITS.termsPerGroup,
                                items: {
                                    type: 'object',
                                    required: ['id', 'term', 'values'],
                                    additionalProperties: false,
                                    properties: {
                                        id: { type: 'string', minLength: 1, maxLength: 80 },
                                        term: { type: 'string', minLength: 1, maxLength: TRANSLATION_LIMITS.termLength },
                                        values: {
                                            type: 'object',
                                            additionalProperties: {
                                                type: 'string',
                                                maxLength: TRANSLATION_LIMITS.valueLength,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} as const

const getTranslationsEndpoint = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) => {
    try {
        return await translations().get(request.project!.id)
    } catch (error) {
        return sendError(reply, error)
    }
}

const saveTranslationsEndpoint = async (
    request: FastifyRequest<{ Params: { id: string }; Body: { doc: TranslationDoc } }>,
    reply: FastifyReply
) => {
    try {
        const saved = await translations().save(request.project!.id, request.body.doc)
        void recordAudit(request.user!, 'translations.saved', request.project!.id, '', request.id)
        return saved
    } catch (error) {
        return sendError(reply, error)
    }
}

export const translationRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/translations',
        { preHandler: [loadProject] },
        getTranslationsEndpoint
    )

    app.put<{ Params: { id: string }; Body: { doc: TranslationDoc } }>(
        '/api/projects/:id/translations',
        { schema: { body: docSchema }, preHandler: [requireProjectPermission('config.write')] },
        saveTranslationsEndpoint
    )
}
