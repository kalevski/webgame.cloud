import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import type { FileRow, AssetSourceRow } from '../../schema/files.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'

import COUNT_FILES_FOR_SOURCE from './sql/count-files-for-source.sql'
import DELETE_FILE from './sql/delete-file.sql'
import DELETE_SOURCE from './sql/delete-source.sql'
import INSERT_FILE from './sql/insert-file.sql'
import INSERT_SOURCE from './sql/insert-source.sql'
import SELECT_FILE from './sql/select-file.sql'
import SELECT_SOURCE from './sql/select-source.sql'
import SELECT_SOURCES from './sql/select-sources.sql'
import UPDATE_SOURCE from './sql/update-source.sql'

@injectable()
export class FileRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'files', 'id', repositoryOptions)
    }

    async insertSource(
        write: {
            id: string
            name: string
            type: string
            config: Record<string, unknown>
            secret: string
            extensions: string[]
            mimeTypes: string[]
        },
        trx?: QueryRunner
    ): Promise<AssetSourceRow | undefined> {
        await this.run(trx).query(INSERT_SOURCE, [
            write.id, write.name, write.type, JSON.stringify(write.config), write.secret,
            JSON.stringify(write.extensions), JSON.stringify(write.mimeTypes),
        ])
        return this.findSource(write.id, trx)
    }

    async updateSource(
        id: string,
        patch: {
            name: string | null
            config: Record<string, unknown> | null
            secret: string | null
            extensions: string[] | null
            mimeTypes: string[] | null
        },
        trx?: QueryRunner
    ): Promise<AssetSourceRow | undefined> {
        const result = await this.run(trx).query(UPDATE_SOURCE, [
            id,
            patch.name,
            patch.config === null ? null : JSON.stringify(patch.config),
            patch.secret,
            patch.extensions === null ? null : JSON.stringify(patch.extensions),
            patch.mimeTypes === null ? null : JSON.stringify(patch.mimeTypes),
        ])
        if ((result.rowCount ?? 0) === 0) return undefined
        return this.findSource(id, trx)
    }

    async deleteSource(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('deleteSource', async () => {
            const result = await this.run(trx).query(DELETE_SOURCE, [id])
            return (result.rowCount ?? 0) > 0
        })
    }

    async findSource(id: string, trx?: QueryRunner): Promise<AssetSourceRow | undefined> {
        return this.time('findSource', async () => {
            const { rows } = await this.run(trx).query<AssetSourceRow>(SELECT_SOURCE, [id])
            return rows[0]
        })
    }

    async listSources(trx?: QueryRunner): Promise<AssetSourceRow[]> {
        return this.time('listSources', async () => {
            const { rows } = await this.run(trx).query<AssetSourceRow>(SELECT_SOURCES)
            return rows
        })
    }

    async countFilesForSource(sourceId: string, trx?: QueryRunner): Promise<number> {
        return this.time('countFilesForSource', async () => {
            const { rows } = await this.run(trx).query<{ c: number }>(COUNT_FILES_FOR_SOURCE, [sourceId])
            return rows[0]?.c ?? 0
        })
    }

    async insertFile(
        write: {
            id: string
            assetType: string
            sourceId: string
            location: string
            ownerId: string | null
            originalName: string
            mime: string
            size: number
        },
        trx?: QueryRunner
    ): Promise<FileRow | undefined> {
        await this.run(trx).query(INSERT_FILE, [
            write.id, write.assetType, write.sourceId, write.location,
            write.ownerId, write.originalName, write.mime, write.size,
        ])
        return this.findFile(write.id, trx)
    }

    async findFile(id: string, trx?: QueryRunner): Promise<FileRow | undefined> {
        return this.time('findFile', async () => {
            const { rows } = await this.run(trx).query<FileRow>(SELECT_FILE, [id])
            return rows[0]
        })
    }

    async deleteFile(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('deleteFile', async () => {
            const result = await this.run(trx).query(DELETE_FILE, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
