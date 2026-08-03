import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { DesignEntry, DesignKind } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { DesignRow } from '../../schema/designs.js'

import SELECT_DESIGNS from './sql/select-designs.sql'
import SELECT_DESIGN from './sql/select-design.sql'
import INSERT_DESIGN from './sql/insert-design.sql'
import UPDATE_DESIGN from './sql/update-design.sql'
import DELETE_DESIGN from './sql/delete-design.sql'

export type DesignFields = {
    name: string
    kind: DesignKind
    frameTemplateId: string | null
    videoTemplateId: string | null
    entries: DesignEntry[]
}

@injectable()
export class DesignRepository extends BaseRepository<DesignRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'designs', 'id', repositoryOptions)
    }

    async listForOwner(ownerId: string, trx?: QueryRunner): Promise<DesignRow[]> {
        return this.time('listForOwner', async () => {
            const { rows } = await this.run(trx).query<DesignRow>(SELECT_DESIGNS, [ownerId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<DesignRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<DesignRow>(SELECT_DESIGN, [id])
            return rows[0]
        })
    }

    async create(ownerId: string, fields: DesignFields, trx?: QueryRunner): Promise<DesignRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_DESIGN, [
                randomUUID(),
                ownerId,
                fields.name,
                fields.kind,
                fields.frameTemplateId,
                fields.videoTemplateId,
                JSON.stringify(fields.entries),
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async updateFields(
        id: string,
        patch: { name: string; entries: DesignEntry[]; fileId: string | null },
        trx?: QueryRunner
    ): Promise<DesignRow | undefined> {
        return this.time('updateFields', async () => {
            const result = await this.run(trx).query(UPDATE_DESIGN, [
                id,
                patch.name,
                JSON.stringify(patch.entries),
                patch.fileId,
            ])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }

    async remove(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('remove', async () => {
            const result = await this.run(trx).query(DELETE_DESIGN, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
