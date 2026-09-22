import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type { ConfigSchemaDraft, GameConfigDraft } from '../contracts/index.js'
import { SCHEMA_PROPERTY_TYPES, encodeErrorCause } from '../contracts/index.js'
import { requireAuth } from '../auth.js'
import { loadProject, requireProjectPermission } from '../projectAuth.js'
import container from '../container.js'
import { ConfigService } from '../services/ConfigService.js'
import { recordAudit } from '../audit.js'

const configs = () => container.resolve(ConfigService)

const propertySchema = {
    type: 'object',
    required: ['key', 'type'],
    properties: {
        key: { type: 'string', minLength: 1, maxLength: 120 },
        type: { type: 'string', enum: [...SCHEMA_PROPERTY_TYPES] },
        required: { type: 'boolean' },
        defaultValue: {},
        enum: { type: 'array', items: { type: 'string', maxLength: 200 } },
        ref: { type: 'string', maxLength: 80 },
        itemType: { type: 'string', enum: [...SCHEMA_PROPERTY_TYPES] },
        properties: { type: 'array' },
    },
} as const

const schemaSchema = {
    type: 'object',
    required: ['name', 'definition'],
    additionalProperties: false,
    properties: {
        name: { type: 'string', minLength: 1, maxLength: 120 },
        definition: { type: 'array', maxItems: 200, items: propertySchema },
    },
} as const

const configSchema = {
    type: 'object',
    required: ['key', 'schemaId'],
    additionalProperties: false,
    properties: {
        key: { type: 'string', minLength: 1, maxLength: 120 },
        schemaId: { type: 'string', minLength: 1, maxLength: 80 },
        description: { type: 'string', maxLength: 1000 },
    },
} as const

const valuesSchema = {
    type: 'object',
    required: ['values'],
    additionalProperties: false,
    properties: { values: { type: 'object' } },
} as const

const listSchemasEndpoint = async (request: FastifyRequest) => configs().listSchemas(request.project!.id)

const saveSchemaEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; schemaId?: string }; Body: ConfigSchemaDraft }>,
    reply: FastifyReply
) => {
    const saved = await configs().saveSchema(request.project!, request.body, request.params.schemaId)
    if (saved.isErr()) {
        reply.code(409)
        return { error: encodeErrorCause('schema_name_exists') }
    }
    const schema = saved.unwrap()
    void recordAudit(request.user!, 'schema.saved', schema.id, schema.name, request.id)
    if (!request.params.schemaId) reply.code(201)
    return schema
}

const deleteSchemaEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; schemaId: string } }>,
    reply: FastifyReply
) => {
    await configs().deleteSchema(request.project!, request.params.schemaId)
    void recordAudit(request.user!, 'schema.deleted', request.params.schemaId, request.project!.id, request.id)
    reply.code(204)
    return null
}

const listConfigsEndpoint = async (request: FastifyRequest) => configs().listConfigs(request.project!.id)

const createConfigEndpoint = async (
    request: FastifyRequest<{ Body: GameConfigDraft }>,
    reply: FastifyReply
) => {
    const created = await configs().createConfig(request.project!, request.body)
    if (created.isErr()) {
        reply.code(409)
        return { error: encodeErrorCause('config_key_exists') }
    }
    const config = created.unwrap()
    void recordAudit(request.user!, 'config.created', config.id, config.key, request.id)
    reply.code(201)
    return config
}

const patchConfigEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; configId: string }; Body: { description?: string } }>,
    reply: FastifyReply
) => {
    return await configs().updateConfig(request.project!, request.params.configId, request.body.description ?? '')
}

const deleteConfigEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; configId: string } }>,
    reply: FastifyReply
) => {
    await configs().deleteConfig(request.project!, request.params.configId)
    void recordAudit(request.user!, 'config.deleted', request.params.configId, request.project!.id, request.id)
    reply.code(204)
    return null
}

const readVersionEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; configId: string; tag: string } }>,
    reply: FastifyReply
) => {
    return await configs().readVersion(request.project!, request.params.configId, request.params.tag)
}

const saveVersionEndpoint = async (
    request: FastifyRequest<{
        Params: { id: string; configId: string; tag: string }
        Body: { values: Record<string, unknown> }
    }>,
    reply: FastifyReply
) => {
    const version = await configs().saveVersion(
        request.user!,
        request.project!,
        request.params.configId,
        request.params.tag,
        request.body.values
    )
    void recordAudit(request.user!, 'config.version_saved', request.params.configId, request.params.tag, request.id)
    return version
}

const deleteVersionEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; configId: string; tag: string } }>,
    reply: FastifyReply
) => {
    await configs().deleteVersion(request.project!, request.params.configId, request.params.tag)
    reply.code(204)
    return null
}

const refreshSchemaEndpoint = async (
    request: FastifyRequest<{ Params: { id: string; configId: string } }>,
    reply: FastifyReply
) => {
    return await configs().refreshSchema(request.project!, request.params.configId)
}

export const configRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/schemas',
        { preHandler: [loadProject] },
        listSchemasEndpoint
    )

    app.post<{ Params: { id: string }; Body: ConfigSchemaDraft }>(
        '/api/projects/:id/schemas',
        { schema: { body: schemaSchema }, preHandler: [requireProjectPermission('config.write')] },
        saveSchemaEndpoint
    )

    app.patch<{ Params: { id: string; schemaId: string }; Body: ConfigSchemaDraft }>(
        '/api/projects/:id/schemas/:schemaId',
        { schema: { body: schemaSchema }, preHandler: [requireProjectPermission('config.write')] },
        saveSchemaEndpoint
    )

    app.delete<{ Params: { id: string; schemaId: string } }>(
        '/api/projects/:id/schemas/:schemaId',
        { preHandler: [requireProjectPermission('config.write')] },
        deleteSchemaEndpoint
    )

    app.get<{ Params: { id: string } }>(
        '/api/projects/:id/configs',
        { preHandler: [loadProject] },
        listConfigsEndpoint
    )

    app.post<{ Params: { id: string }; Body: GameConfigDraft }>(
        '/api/projects/:id/configs',
        { schema: { body: configSchema }, preHandler: [requireProjectPermission('config.write')] },
        createConfigEndpoint
    )

    app.patch<{ Params: { id: string; configId: string }; Body: { description?: string } }>(
        '/api/projects/:id/configs/:configId',
        { preHandler: [requireProjectPermission('config.write')] },
        patchConfigEndpoint
    )

    app.delete<{ Params: { id: string; configId: string } }>(
        '/api/projects/:id/configs/:configId',
        { preHandler: [requireProjectPermission('config.write')] },
        deleteConfigEndpoint
    )

    app.get<{ Params: { id: string; configId: string; tag: string } }>(
        '/api/projects/:id/configs/:configId/versions/:tag',
        { preHandler: [loadProject] },
        readVersionEndpoint
    )

    app.put<{ Params: { id: string; configId: string; tag: string }; Body: { values: Record<string, unknown> } }>(
        '/api/projects/:id/configs/:configId/versions/:tag',
        { schema: { body: valuesSchema }, preHandler: [requireProjectPermission('config.write')] },
        saveVersionEndpoint
    )

    app.delete<{ Params: { id: string; configId: string; tag: string } }>(
        '/api/projects/:id/configs/:configId/versions/:tag',
        { preHandler: [requireProjectPermission('config.write')] },
        deleteVersionEndpoint
    )

    app.post<{ Params: { id: string; configId: string } }>(
        '/api/projects/:id/configs/:configId/refresh-schema',
        { preHandler: [requireProjectPermission('config.write')] },
        refreshSchemaEndpoint
    )
}
