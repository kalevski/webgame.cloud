import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import { BaseRepository } from '@toolcase/node'
import type { BundleEngine, BundleRule, PackingAlgorithm } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { BundleRow } from '../../schema/bundles.js'
import type { AssetRow } from '../../schema/assets.js'

import SELECT_BUNDLES from './sql/select-bundles.sql'
import SELECT_BUNDLE from './sql/select-bundle.sql'
import INSERT_BUNDLE from './sql/insert-bundle.sql'
import UPDATE_BUNDLE from './sql/update-bundle.sql'
import DELETE_BUNDLE from './sql/delete-bundle.sql'
import PREVIEW_FILES from './sql/preview-files.sql'
import PREVIEW_COUNT from './sql/preview-count.sql'
import RESOLVE_UPLOADS from './sql/resolve-uploads.sql'

const UNIQUE_VIOLATION = '23505'

export type BundleCreateConflict = 'exists'

export type BundleWrite = {
    name: string
    engine: BundleEngine
    categoryId: string | null
    includedTags: string[]
    excludedTags: string[]
    buildTag: string
    algorithm: PackingAlgorithm
    downscale: number
    rotationEnabled: boolean
}

export type ResolvedAssetRow = Pick<AssetRow, 'id' | 'upload_uuid' | 'parent_asset_id' | 'kind'>

const ruleParams = (projectId: string, rule: BundleRule) => [
    projectId,
    rule.categoryId ?? null,
    rule.includedTags ?? [],
    rule.excludedTags ?? [],
]

@injectable()
export class BundleRepository extends BaseRepository<BundleRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'bundles', 'id', repositoryOptions)
    }

    async listByProject(projectId: string, trx?: QueryRunner): Promise<BundleRow[]> {
        return this.time('listByProject', async () => {
            const { rows } = await this.run(trx).query<BundleRow>(SELECT_BUNDLES, [projectId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<BundleRow | undefined> {
        const { rows } = await this.run(trx).query<BundleRow>(SELECT_BUNDLE, [id])
        return rows[0]
    }

    async create(
        projectId: string,
        write: BundleWrite,
        trx?: QueryRunner
    ): Promise<Result<BundleRow, BundleCreateConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_BUNDLE, [
                    randomUUID(),
                    projectId,
                    write.name,
                    write.engine,
                    write.categoryId,
                    write.includedTags,
                    write.excludedTags,
                    write.buildTag,
                    write.algorithm,
                    write.downscale,
                    write.rotationEnabled,
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
                throw error
            }
        })
    }

    async updateBundle(
        id: string,
        projectId: string,
        write: BundleWrite,
        trx?: QueryRunner
    ): Promise<Result<BundleRow | undefined, BundleCreateConflict>> {
        try {
            const result = await this.run(trx).query(UPDATE_BUNDLE, [
                id,
                projectId,
                write.name,
                write.engine,
                write.categoryId,
                write.includedTags,
                write.excludedTags,
                write.buildTag,
                write.algorithm,
                write.downscale,
                write.rotationEnabled,
            ])
            if ((result.rowCount ?? 0) === 0) return ok(undefined)
            return ok(await this.findById(id, trx))
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
            throw error
        }
    }

    async softDeleteCascade(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const { rows } = await this.run(trx).query<{ c: number }>(DELETE_BUNDLE, [id, projectId])
        return (rows[0]?.c ?? 0) > 0
    }

    async previewFiles(projectId: string, rule: BundleRule, trx?: QueryRunner): Promise<AssetRow[]> {
        const { rows } = await this.run(trx).query<AssetRow>(PREVIEW_FILES, ruleParams(projectId, rule))
        return rows
    }

    async previewCount(
        projectId: string,
        rule: BundleRule,
        trx?: QueryRunner
    ): Promise<{ count: number; totalBytes: number }> {
        const { rows } = await this.run(trx).query<{ c: string; total_bytes: string }>(
            PREVIEW_COUNT,
            ruleParams(projectId, rule)
        )
        return { count: Number(rows[0]?.c ?? 0), totalBytes: Number(rows[0]?.total_bytes ?? 0) }
    }

    async resolveAssets(projectId: string, rule: BundleRule, trx?: QueryRunner): Promise<ResolvedAssetRow[]> {
        const { rows } = await this.run(trx).query<ResolvedAssetRow>(RESOLVE_UPLOADS, ruleParams(projectId, rule))
        return rows
    }
}
