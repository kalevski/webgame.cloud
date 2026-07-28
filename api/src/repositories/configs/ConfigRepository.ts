import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import { BaseRepository } from '@toolcase/node'
import type { SchemaProperty } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { ConfigRow, ConfigSchemaRow, ConfigVersionRow } from '../../schema/configs.js'

import SELECT_SCHEMAS from './sql/select-schemas.sql'
import SELECT_SCHEMA from './sql/select-schema.sql'
import INSERT_SCHEMA from './sql/insert-schema.sql'
import UPDATE_SCHEMA from './sql/update-schema.sql'
import DELETE_SCHEMA from './sql/delete-schema.sql'
import SELECT_CONFIGS from './sql/select-configs.sql'
import SELECT_CONFIG from './sql/select-config.sql'
import INSERT_CONFIG from './sql/insert-config.sql'
import UPDATE_CONFIG from './sql/update-config.sql'
import REFRESH_CONFIG_SCHEMA from './sql/refresh-config-schema.sql'
import DELETE_CONFIG from './sql/delete-config.sql'
import SELECT_VERSIONS from './sql/select-versions.sql'
import UPSERT_DEFAULT_VERSION from './sql/upsert-default-version.sql'
import UPSERT_TAG_VERSION from './sql/upsert-tag-version.sql'
import DELETE_VERSION from './sql/delete-version.sql'
import RESOLVE_FOR_TAG from './sql/resolve-for-tag.sql'
import PUBLIC_READ from './sql/public-read.sql'

const UNIQUE_VIOLATION = '23505'

export type ConfigCreateConflict = 'exists'

export type ResolvedConfigRow = {
    key: string
    version_id: string
    build_tag: string
    values: Record<string, unknown>
    updated_at: Date
}

@injectable()
export class ConfigRepository extends BaseRepository<ConfigRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'configs', 'id', repositoryOptions)
    }

    async listSchemas(projectId: string, trx?: QueryRunner): Promise<ConfigSchemaRow[]> {
        const { rows } = await this.run(trx).query<ConfigSchemaRow>(SELECT_SCHEMAS, [projectId])
        return rows
    }

    async findSchema(id: string, trx?: QueryRunner): Promise<ConfigSchemaRow | undefined> {
        const { rows } = await this.run(trx).query<ConfigSchemaRow>(SELECT_SCHEMA, [id])
        return rows[0]
    }

    async createSchema(
        projectId: string,
        name: string,
        definition: SchemaProperty[],
        trx?: QueryRunner
    ): Promise<Result<ConfigSchemaRow, ConfigCreateConflict>> {
        try {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_SCHEMA, [
                randomUUID(),
                projectId,
                name,
                JSON.stringify(definition),
            ])
            return ok((await this.findSchema(rows[0].id, trx))!)
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
            throw error
        }
    }

    async updateSchema(
        id: string,
        projectId: string,
        name: string,
        definition: SchemaProperty[],
        trx?: QueryRunner
    ): Promise<Result<ConfigSchemaRow | undefined, ConfigCreateConflict>> {
        try {
            const result = await this.run(trx).query(UPDATE_SCHEMA, [
                id,
                projectId,
                name,
                JSON.stringify(definition),
            ])
            if ((result.rowCount ?? 0) === 0) return ok(undefined)
            return ok(await this.findSchema(id, trx))
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
            throw error
        }
    }

    async deleteSchema(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_SCHEMA, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }

    async listConfigs(projectId: string, trx?: QueryRunner): Promise<ConfigRow[]> {
        const { rows } = await this.run(trx).query<ConfigRow>(SELECT_CONFIGS, [projectId])
        return rows
    }

    async findConfig(id: string, trx?: QueryRunner): Promise<ConfigRow | undefined> {
        const { rows } = await this.run(trx).query<ConfigRow>(SELECT_CONFIG, [id])
        return rows[0]
    }

    async createConfig(
        projectId: string,
        write: { schemaId: string; key: string; description: string },
        trx?: QueryRunner
    ): Promise<Result<ConfigRow, ConfigCreateConflict>> {
        try {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_CONFIG, [
                randomUUID(),
                projectId,
                write.schemaId,
                write.key,
                write.description,
            ])
            return ok((await this.findConfig(rows[0].id, trx))!)
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
            throw error
        }
    }

    async updateConfig(id: string, projectId: string, description: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(UPDATE_CONFIG, [id, projectId, description])
        return (result.rowCount ?? 0) > 0
    }

    async refreshSchemaIterator(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(REFRESH_CONFIG_SCHEMA, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }

    async deleteConfig(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_CONFIG, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }

    async listVersions(configId: string, trx?: QueryRunner): Promise<ConfigVersionRow[]> {
        const { rows } = await this.run(trx).query<ConfigVersionRow>(SELECT_VERSIONS, [configId])
        return rows
    }

    async upsertVersion(
        configId: string,
        buildTag: string,
        values: Record<string, unknown>,
        userId: string,
        trx?: QueryRunner
    ): Promise<void> {
        const runner = this.run(trx)
        if (buildTag) {
            await runner.query(UPSERT_TAG_VERSION, [randomUUID(), configId, buildTag, JSON.stringify(values), userId])
            return
        }
        await runner.query(UPSERT_DEFAULT_VERSION, [randomUUID(), configId, JSON.stringify(values), userId])
    }

    async deleteVersion(configId: string, buildTag: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_VERSION, [configId, buildTag])
        return (result.rowCount ?? 0) > 0
    }

    async resolveForTag(projectId: string, buildTag: string, trx?: QueryRunner): Promise<ResolvedConfigRow[]> {
        const { rows } = await this.run(trx).query<ResolvedConfigRow>(RESOLVE_FOR_TAG, [projectId, buildTag])
        return rows
    }

    async publicRead(
        projectId: string,
        keys: string[],
        buildTag: string,
        trx?: QueryRunner
    ): Promise<ResolvedConfigRow[]> {
        const { rows } = await this.run(trx).query<ResolvedConfigRow>(PUBLIC_READ, [
            projectId,
            keys.map((key) => key.toLowerCase()),
            buildTag,
        ])
        return rows
    }
}
