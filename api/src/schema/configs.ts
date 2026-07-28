import type {
    ConfigSchema,
    ConfigVersion,
    ConfigVersionSummary,
    GameConfig,
    SchemaProperty,
} from '../contracts/index.js'

export type ConfigSchemaRow = {
    id: string
    project_id: string
    name: string
    definition: SchemaProperty[]
    update_iterator: number
    used_by_count?: string
    created_at: Date
    updated_at: Date
}

export type ConfigRow = {
    id: string
    project_id: string
    schema_id: string
    key: string
    description: string
    schema_update_iterator: number
    schema_name?: string
    schema_iterator?: number
    created_at: Date
    updated_at: Date
}

export type ConfigVersionRow = {
    id: string
    config_id: string
    build_tag: string
    is_default: boolean
    values: Record<string, unknown>
    updated_at: Date
}

export const toConfigSchema = (row: ConfigSchemaRow): ConfigSchema => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    definition: Array.isArray(row.definition) ? row.definition : [],
    updateIterator: row.update_iterator,
    usedByCount: Number(row.used_by_count ?? 0),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

export const toVersionSummary = (row: ConfigVersionRow): ConfigVersionSummary => ({
    id: row.id,
    buildTag: row.build_tag,
    isDefault: row.is_default,
    updatedAt: row.updated_at.toISOString(),
})

export const toConfigVersion = (row: ConfigVersionRow): ConfigVersion => ({
    id: row.id,
    configId: row.config_id,
    buildTag: row.build_tag,
    isDefault: row.is_default,
    values: row.values ?? {},
    updatedAt: row.updated_at.toISOString(),
})

export const toGameConfig = (row: ConfigRow, versions: ConfigVersionRow[]): GameConfig => ({
    id: row.id,
    projectId: row.project_id,
    schemaId: row.schema_id,
    schemaName: row.schema_name ?? '',
    key: row.key,
    description: row.description,
    schemaUpdateIterator: row.schema_update_iterator,
    stale: (row.schema_iterator ?? 0) > row.schema_update_iterator,
    versions: versions.map(toVersionSummary),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})
