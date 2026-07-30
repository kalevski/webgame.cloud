import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import type {
    ConfigSchema,
    ConfigSchemaDraft,
    ConfigVersion,
    GameConfig,
    GameConfigDraft,
    PublicConfig,
    SchemaProperty,
    User,
} from '../contracts/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import {
    SchemaCycleError,
    inlineDefinition,
    migrateValues,
    validateValues,
} from '../domain/configValidation.js'
import { ConfigRepository } from '../repositories/configs/ConfigRepository.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import {
    toConfigSchema,
    toConfigVersion,
    toGameConfig,
} from '../schema/configs.js'
import type { ProjectRow } from '../schema/projects.js'

export type ConfigConflict = 'exists'

@injectable()
export class ConfigService {
    constructor(
        @inject(ConfigRepository) private configs: ConfigRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    async listSchemas(projectId: string): Promise<ConfigSchema[]> {
        return (await this.configs.listSchemas(projectId)).map(toConfigSchema)
    }

    async saveSchema(
        project: ProjectRow,
        draft: ConfigSchemaDraft,
        schemaId?: string
    ): Promise<Result<ConfigSchema, ConfigConflict>> {
        const name = draft.name?.trim() ?? ''
        if (!name) throw new ValidationError('invalid_body', 'a schema needs a name', ['name'])

        await this.assertResolvable(project.id, draft.definition ?? [], schemaId)

        if (schemaId) {
            const updated = await this.configs.updateSchema(schemaId, project.id, name, draft.definition ?? [])
            if (updated.isErr()) return err('exists')
            const row = updated.unwrap()
            if (!row) throw new NotFoundError('schema_not_found', `unknown schema ${schemaId}`, [schemaId])
            return ok(toConfigSchema(row))
        }

        const created = await this.configs.createSchema(project.id, name, draft.definition ?? [])
        if (created.isErr()) return err('exists')
        return ok(toConfigSchema(created.unwrap()))
    }

    async deleteSchema(project: ProjectRow, schemaId: string): Promise<void> {
        const schema = await this.configs.findSchema(schemaId)
        if (!schema || schema.project_id !== project.id) {
            throw new NotFoundError('schema_not_found', `unknown schema ${schemaId}`, [schemaId])
        }
        const deleted = await this.configs.deleteSchema(schemaId, project.id)
        if (!deleted) throw new ConflictError('schema_in_use', 'a config still uses this schema', [schema.name])
    }

    async listConfigs(projectId: string): Promise<GameConfig[]> {
        const rows = await this.configs.listConfigs(projectId)
        return Promise.all(rows.map(async (row) =>
            toGameConfig(row, await this.configs.listVersions(row.id))))
    }

    async createConfig(
        project: ProjectRow,
        draft: GameConfigDraft
    ): Promise<Result<GameConfig, ConfigConflict>> {
        const key = draft.key?.trim() ?? ''
        if (!key) throw new ValidationError('invalid_body', 'a config needs a key', ['key'])
        if (!draft.schemaId) throw new ValidationError('schema_required', 'pick a schema first')

        const schema = await this.configs.findSchema(draft.schemaId)
        if (!schema || schema.project_id !== project.id) {
            throw new NotFoundError('schema_not_found', `unknown schema ${draft.schemaId}`, [draft.schemaId])
        }

        await this.access.assertWithinProjectLimit(
            { id: project.id, ownerId: project.owner_id },
            'configs_per_project'
        )

        const created = await this.configs.createConfig(project.id, {
            schemaId: draft.schemaId,
            key,
            description: draft.description?.trim() ?? '',
        })
        if (created.isErr()) return err('exists')

        const row = created.unwrap()
        return ok(toGameConfig(row, await this.configs.listVersions(row.id)))
    }

    async updateConfig(project: ProjectRow, configId: string, description: string): Promise<GameConfig> {
        const config = await this.requireConfig(project.id, configId)
        await this.configs.updateConfig(configId, project.id, description.trim())
        const fresh = await this.configs.findConfig(configId)
        return toGameConfig(fresh ?? config, await this.configs.listVersions(configId))
    }

    async deleteConfig(project: ProjectRow, configId: string): Promise<void> {
        await this.requireConfig(project.id, configId)
        await this.configs.deleteConfig(configId, project.id)
    }

    async readVersion(project: ProjectRow, configId: string, tagOrDefault: string): Promise<ConfigVersion> {
        await this.requireConfig(project.id, configId)
        const versions = await this.configs.listVersions(configId)
        const tag = tagOrDefault === 'default' ? '' : tagOrDefault

        const exact = versions.find((row) => (tag ? row.build_tag === tag : row.is_default))
        if (exact) return toConfigVersion(exact)

        const fallback = versions.find((row) => row.is_default)
        if (!fallback) {
            return { id: '', configId, buildTag: tag, isDefault: !tag, values: {}, updatedAt: '' }
        }
        return { ...toConfigVersion(fallback), id: '', buildTag: tag, isDefault: !tag }
    }

    async saveVersion(
        user: User,
        project: ProjectRow,
        configId: string,
        tagOrDefault: string,
        values: Record<string, unknown>
    ): Promise<ConfigVersion> {
        const config = await this.requireConfig(project.id, configId)
        const tag = tagOrDefault === 'default' ? '' : tagOrDefault

        if (tag) {
            const buildTags = await this.projects.listNames('buildTags', project.id)
            if (!buildTags.some((row) => row.name.toLowerCase() === tag.toLowerCase())) {
                throw new ValidationError('build_tag_unknown', 'that build tag is not in this project', [tag])
            }
        }

        const definition = await this.definitionOf(project.id, config.schema_id)
        const errors = validateValues(definition, values)
        if (errors.length > 0) {
            throw new ValidationError('config_values_invalid', 'values do not match the schema', [errors.length])
        }

        await this.configs.upsertVersion(configId, tag, values, user.id)
        return this.readVersion(project, configId, tagOrDefault)
    }

    async deleteVersion(project: ProjectRow, configId: string, tag: string): Promise<void> {
        await this.requireConfig(project.id, configId)
        const deleted = await this.configs.deleteVersion(configId, tag)
        if (!deleted) {
            throw new NotFoundError('config_version_not_found', `no version for ${tag}`, [tag])
        }
    }

    async refreshSchema(project: ProjectRow, configId: string): Promise<GameConfig> {
        const config = await this.requireConfig(project.id, configId)
        const definition = await this.definitionOf(project.id, config.schema_id)

        const versions = await this.configs.listVersions(configId)
        for (const version of versions) {
            await this.configs.upsertVersion(
                configId,
                version.build_tag,
                migrateValues(definition, version.values ?? {}),
                ''
            )
        }
        await this.configs.refreshSchemaIterator(configId, project.id)

        const fresh = await this.configs.findConfig(configId)
        return toGameConfig(fresh!, await this.configs.listVersions(configId))
    }

    async resolveForBuildTag(
        projectId: string,
        buildTag: string
    ): Promise<Array<{ key: string; versionId: string; buildTag: string }>> {
        const rows = await this.configs.resolveForTag(projectId, buildTag)
        return rows.map((row) => ({ key: row.key, versionId: row.version_id, buildTag: row.build_tag }))
    }

    async publicRead(projectId: string, keys: string[], buildTag = ''): Promise<PublicConfig[]> {
        const rows = await this.configs.publicRead(projectId, keys, buildTag)
        return rows.map((row) => ({
            key: row.key,
            values: row.values ?? {},
            buildTag: row.build_tag,
            updatedAt: row.updated_at.toISOString(),
        }))
    }

    private async requireConfig(projectId: string, configId: string) {
        const config = await this.configs.findConfig(configId)
        if (!config || config.project_id !== projectId) {
            throw new NotFoundError('config_not_found', `unknown config ${configId}`, [configId])
        }
        return config
    }

    private async definitionOf(projectId: string, schemaId: string): Promise<SchemaProperty[]> {
        const schemas = await this.configs.listSchemas(projectId)
        const lookup = (id: string) => schemas.find((row) => row.id === id)?.definition
        const target = schemas.find((row) => row.id === schemaId)
        return inlineDefinition(target?.definition ?? [], lookup, [schemaId])
    }

    private async assertResolvable(
        projectId: string,
        definition: SchemaProperty[],
        schemaId?: string
    ): Promise<void> {
        const schemas = await this.configs.listSchemas(projectId)
        const lookup = (id: string) =>
            id === schemaId ? definition : schemas.find((row) => row.id === id)?.definition
        try {
            inlineDefinition(definition, lookup, schemaId ? [schemaId] : [])
        } catch (error) {
            if (error instanceof SchemaCycleError) {
                throw new ValidationError('schema_ref_cycle', error.message)
            }
            throw error
        }
    }
}
