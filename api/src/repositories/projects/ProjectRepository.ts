import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { ProjectDraft, ProjectVisibility } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { ProjectRow } from '../../schema/projects.js'

import SELECT_PROJECTS_VISIBLE from './sql/select-projects-visible.sql'
import SELECT_PROJECT from './sql/select-project.sql'
import INSERT_PROJECT from './sql/insert-project.sql'
import UPDATE_PROJECT from './sql/update-project.sql'
import DELETE_PROJECT from './sql/delete-project.sql'

@injectable()
export class ProjectRepository extends BaseRepository<ProjectRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'projects', 'id', repositoryOptions)
    }

    async listVisible(userId: string, trx?: QueryRunner): Promise<ProjectRow[]> {
        return this.time('listVisible', async () => {
            const { rows } = await this.run(trx).query<ProjectRow>(SELECT_PROJECTS_VISIBLE, [userId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<ProjectRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<ProjectRow>(SELECT_PROJECT, [id])
            return rows[0]
        })
    }

    async create(ownerId: string, draft: ProjectDraft, trx?: QueryRunner): Promise<ProjectRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_PROJECT, [
                randomUUID(),
                ownerId,
                draft.name.trim(),
                draft.description?.trim() ?? '',
                draft.visibility ?? 'private',
                draft.icon?.trim() || 'FolderKanban',
                draft.color?.trim() ?? '',
                draft.priority ?? 3,
                draft.dueDate ?? null,
                draft.notifyOnActivity ?? true,
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async updateFields(
        id: string,
        patch: {
            name: string
            description: string
            visibility: ProjectVisibility
            icon: string
            color: string
            priority: number
            dueDate: string | null
            notifyOnActivity: boolean
        },
        trx?: QueryRunner
    ): Promise<ProjectRow | undefined> {
        return this.time('updateFields', async () => {
            const result = await this.run(trx).query(UPDATE_PROJECT, [
                id,
                patch.name.trim(),
                patch.description.trim(),
                patch.visibility,
                patch.icon.trim() || 'FolderKanban',
                patch.color.trim(),
                patch.priority,
                patch.dueDate,
                patch.notifyOnActivity,
            ])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }

    async remove(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('remove', async () => {
            const result = await this.run(trx).query(DELETE_PROJECT, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
