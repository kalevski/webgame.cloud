import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { TaskRow } from '../../schema/projects.js'
import type { TaskStatus } from '../../contracts/index.js'

import SELECT_TASKS from './sql/select-tasks.sql'
import SELECT_TASK from './sql/select-task.sql'
import INSERT_TASK from './sql/insert-task.sql'
import UPDATE_TASK from './sql/update-task.sql'
import DELETE_TASK from './sql/delete-task.sql'

@injectable()
export class TaskRepository extends BaseRepository<TaskRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'tasks', 'id', repositoryOptions)
    }

    async listForProject(projectId: string, trx?: QueryRunner): Promise<TaskRow[]> {
        return this.time('listForProject', async () => {
            const { rows } = await this.run(trx).query<TaskRow>(SELECT_TASKS, [projectId])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<TaskRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<TaskRow>(SELECT_TASK, [id])
            return rows[0]
        })
    }

    async create(
        projectId: string,
        ownerId: string,
        title: string,
        status: TaskStatus,
        trx?: QueryRunner
    ): Promise<TaskRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_TASK, [
                randomUUID(), projectId, ownerId, title.trim(), status,
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async updateFields(
        id: string,
        patch: { title: string; status: TaskStatus },
        trx?: QueryRunner
    ): Promise<TaskRow | undefined> {
        return this.time('updateFields', async () => {
            const result = await this.run(trx).query(UPDATE_TASK, [id, patch.title.trim(), patch.status])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }

    async remove(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('remove', async () => {
            const result = await this.run(trx).query(DELETE_TASK, [id])
            return (result.rowCount ?? 0) > 0
        })
    }
}
