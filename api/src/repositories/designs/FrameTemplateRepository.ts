import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { DesignField, DesignFormat, DesignLayer } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { FrameTemplateRow } from '../../schema/designs.js'

import SELECT_FRAME_TEMPLATES from './sql/select-frame-templates.sql'
import SELECT_FRAME_TEMPLATE from './sql/select-frame-template.sql'
import INSERT_FRAME_TEMPLATE from './sql/insert-frame-template.sql'
import UPDATE_FRAME_TEMPLATE from './sql/update-frame-template.sql'
import DELETE_FRAME_TEMPLATE from './sql/delete-frame-template.sql'
import COUNT_FRAME_TEMPLATE_USAGE from './sql/count-frame-template-usage.sql'

export type FrameTemplateFields = {
    name: string
    description: string
    format: DesignFormat
    background: string
    layers: DesignLayer[]
    fields: DesignField[]
}

@injectable()
export class FrameTemplateRepository extends BaseRepository<FrameTemplateRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'frame_templates', 'id', repositoryOptions)
    }

    async listForOwner(ownerId: string, trx?: QueryRunner): Promise<FrameTemplateRow[]> {
        return this.time('listForOwner', async () => {
            const { rows } = await this.run(trx).query<FrameTemplateRow>(SELECT_FRAME_TEMPLATES, [ownerId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<FrameTemplateRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<FrameTemplateRow>(SELECT_FRAME_TEMPLATE, [id])
            return rows[0]
        })
    }

    async create(ownerId: string, fields: FrameTemplateFields, trx?: QueryRunner): Promise<FrameTemplateRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_FRAME_TEMPLATE, [
                randomUUID(),
                ownerId,
                fields.name,
                fields.description,
                fields.format,
                fields.background,
                JSON.stringify(fields.layers),
                JSON.stringify(fields.fields),
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async updateFields(
        id: string,
        fields: FrameTemplateFields,
        trx?: QueryRunner
    ): Promise<FrameTemplateRow | undefined> {
        return this.time('updateFields', async () => {
            const result = await this.run(trx).query(UPDATE_FRAME_TEMPLATE, [
                id,
                fields.name,
                fields.description,
                fields.format,
                fields.background,
                JSON.stringify(fields.layers),
                JSON.stringify(fields.fields),
            ])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }

    async countUsage(id: string, trx?: QueryRunner): Promise<number> {
        return this.time('countUsage', async () => {
            const { rows } = await this.run(trx).query<{ c: number }>(COUNT_FRAME_TEMPLATE_USAGE, [id])
            return rows[0]?.c ?? 0
        })
    }

    async remove(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('remove', async () => {
            const result = await this.run(trx).query(DELETE_FRAME_TEMPLATE, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
