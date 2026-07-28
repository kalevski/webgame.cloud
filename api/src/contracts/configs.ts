export const SCHEMA_PROPERTY_TYPES = [
    'string',
    'number',
    'integer',
    'boolean',
    'object',
    'array',
    'ref',
] as const

export type SchemaPropertyType = typeof SCHEMA_PROPERTY_TYPES[number]

export const SCHEMA_REF_MAX_DEPTH = 5

export type SchemaProperty = {
    key: string
    type: SchemaPropertyType
    required?: boolean
    defaultValue?: unknown
    enum?: string[]
    ref?: string
    properties?: SchemaProperty[]
    itemType?: SchemaPropertyType
}

export type ConfigSchema = {
    id: string
    projectId: string
    name: string
    definition: SchemaProperty[]
    updateIterator: number
    usedByCount: number
    createdAt: string
    updatedAt: string
}

export type ConfigSchemaDraft = {
    name: string
    definition: SchemaProperty[]
}

export type ConfigVersionSummary = {
    id: string
    buildTag: string
    isDefault: boolean
    updatedAt: string
}

export type GameConfig = {
    id: string
    projectId: string
    schemaId: string
    schemaName: string

    key: string
    description: string

    schemaUpdateIterator: number
    stale: boolean

    versions: ConfigVersionSummary[]

    createdAt: string
    updatedAt: string
}

export type GameConfigDraft = {
    key: string
    schemaId: string
    description?: string
}

export type ConfigVersion = {
    id: string
    configId: string
    buildTag: string
    isDefault: boolean
    values: Record<string, unknown>
    updatedAt: string
}

export type ConfigValidationError = {
    path: string
    message: string
}

export type PublicConfig = {
    key: string
    values: Record<string, unknown>
    buildTag: string
    updatedAt: string
}
