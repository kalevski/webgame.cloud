import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { DesignFormat, DesignTransition } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { VideoTemplateRow } from '../../schema/designs.js'

import SELECT_VIDEO_TEMPLATES from './sql/select-video-templates.sql'
import SELECT_VIDEO_TEMPLATE from './sql/select-video-template.sql'
import INSERT_VIDEO_TEMPLATE from './sql/insert-video-template.sql'
import UPDATE_VIDEO_TEMPLATE from './sql/update-video-template.sql'
import DELETE_VIDEO_TEMPLATE from './sql/delete-video-template.sql'
import CLEAR_VIDEO_FRAMES from './sql/clear-video-frames.sql'
import INSERT_VIDEO_FRAME from './sql/insert-video-frame.sql'

export type VideoTemplateFields = {
    name: string
    description: string
    format: DesignFormat
}

export type VideoFrameInput = {
    frameTemplateId: string
    durationMs: number
    transition: DesignTransition
    values: Record<string, string>
}

@injectable()
export class VideoTemplateRepository extends BaseRepository<VideoTemplateRow, QueryRunner> {
    constructor(@inject(Database) private database: Database) {
        super(database.pool, 'video_templates', 'id', repositoryOptions)
    }

    async listForOwner(ownerId: string, trx?: QueryRunner): Promise<VideoTemplateRow[]> {
        return this.time('listForOwner', async () => {
            const { rows } = await this.run(trx).query<VideoTemplateRow>(SELECT_VIDEO_TEMPLATES, [ownerId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<VideoTemplateRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<VideoTemplateRow>(SELECT_VIDEO_TEMPLATE, [id])
            return rows[0]
        })
    }

    private async writeFrames(id: string, frames: VideoFrameInput[], runner: QueryRunner): Promise<void> {
        await runner.query(CLEAR_VIDEO_FRAMES, [id])
        for (let position = 0; position < frames.length; position += 1) {
            const frame = frames[position]
            await runner.query(INSERT_VIDEO_FRAME, [
                randomUUID(),
                id,
                frame.frameTemplateId,
                position,
                frame.durationMs,
                frame.transition,
                JSON.stringify(frame.values),
            ])
        }
    }

    async create(
        ownerId: string,
        fields: VideoTemplateFields,
        frames: VideoFrameInput[]
    ): Promise<VideoTemplateRow> {
        return this.time('create', async () => {
            const id = await this.database.transaction(async (trx) => {
                const { rows } = await trx.query<{ id: string }>(INSERT_VIDEO_TEMPLATE, [
                    randomUUID(),
                    ownerId,
                    fields.name,
                    fields.description,
                    fields.format,
                ])
                await this.writeFrames(rows[0].id, frames, trx)
                return rows[0].id
            })
            const created = await this.findById(id)
            return created!
        })
    }

    async updateFields(
        id: string,
        fields: VideoTemplateFields,
        frames: VideoFrameInput[]
    ): Promise<VideoTemplateRow | undefined> {
        return this.time('updateFields', async () => {
            const updated = await this.database.transaction(async (trx) => {
                const result = await trx.query(UPDATE_VIDEO_TEMPLATE, [
                    id,
                    fields.name,
                    fields.description,
                    fields.format,
                ])
                if ((result.rowCount ?? 0) === 0) return false
                await this.writeFrames(id, frames, trx)
                return true
            })
            if (!updated) return undefined
            return this.findById(id)
        })
    }

    async remove(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('remove', async () => {
            const result = await this.run(trx).query(DELETE_VIDEO_TEMPLATE, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
