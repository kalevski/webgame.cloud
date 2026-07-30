import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import { BaseRepository } from '@toolcase/node'
import type { AssetKind, AssetPatch, UploadStatus } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { AssetRow } from '../../schema/assets.js'

import SELECT_ASSETS from './sql/select-assets.sql'
import SELECT_ASSET from './sql/select-asset.sql'
import INSERT_ASSET from './sql/insert-asset.sql'
import FINALIZE_ASSET from './sql/finalize-asset.sql'
import PATCH_ASSET from './sql/patch-asset.sql'
import DELETE_ASSET from './sql/delete-asset.sql'
import REAP_ORPHANS from './sql/reap-orphans.sql'

const UNIQUE_VIOLATION = '23505'

export type AssetCreateConflict = 'normal_map_exists'

export type AssetWrite = {
    projectId: string
    uploadedBy: string
    parentAssetId: string | null
    kind: AssetKind
    categoryId: string | null
    name: string
    extension: string
    mime: string
    sizeBytes: number
}

export type AssetQuery = {
    categoryId?: string
    tag?: string
    status?: UploadStatus
}

@injectable()
export class AssetFileRepository extends BaseRepository<AssetRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'assets', 'id', repositoryOptions)
    }

    async listByProject(projectId: string, query: AssetQuery = {}, trx?: QueryRunner): Promise<AssetRow[]> {
        return this.time('listByProject', async () => {
            const { rows } = await this.run(trx).query<AssetRow>(SELECT_ASSETS, [
                projectId,
                query.categoryId ?? null,
                query.tag ?? null,
                query.status ?? null,
            ])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<AssetRow | undefined> {
        const { rows } = await this.run(trx).query<AssetRow>(SELECT_ASSET, [id])
        return rows[0]
    }

    async create(write: AssetWrite, trx?: QueryRunner): Promise<Result<AssetRow, AssetCreateConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_ASSET, [
                    randomUUID(),
                    write.projectId,
                    write.uploadedBy,
                    write.parentAssetId,
                    write.kind,
                    write.categoryId,
                    write.name,
                    write.extension,
                    write.mime,
                    write.sizeBytes,
                    randomUUID(),
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('normal_map_exists')
                throw error
            }
        })
    }

    async finalize(
        id: string,
        write: { status: 'ready' | 'failed'; sizeBytes: number; checksum: string; storagePath: string },
        trx?: QueryRunner
    ): Promise<AssetRow | undefined> {
        await this.run(trx).query(FINALIZE_ASSET, [
            id,
            write.status,
            Math.max(0, Math.floor(write.sizeBytes)),
            write.checksum,
            write.storagePath,
        ])
        return this.findById(id, trx)
    }

    async patchMany(projectId: string, patches: AssetPatch[], trx?: QueryRunner): Promise<number> {
        let changed = 0
        for (const patch of patches) {
            const result = await this.run(trx).query(PATCH_ASSET, [
                patch.id,
                projectId,
                patch.name ?? null,
                patch.categoryId === undefined ? null : patch.categoryId,
                patch.categoryId === undefined ? false : true,
                patch.tags ?? null,
                patch.parentAssetId === undefined ? null : patch.parentAssetId,
                patch.parentAssetId === undefined ? false : true,
            ])
            changed += result.rowCount ?? 0
        }
        return changed
    }

    async softDelete(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_ASSET, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }

    async reapOrphans(limit: number, trx?: QueryRunner): Promise<string[]> {
        const { rows } = await this.run(trx).query<{ id: string }>(REAP_ORPHANS, [limit])
        return rows.map((row) => row.id)
    }
}
