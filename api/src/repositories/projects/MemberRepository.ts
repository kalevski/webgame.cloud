import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { ProjectPermission } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { ProjectMemberRow } from '../../schema/projects.js'

import SELECT_MEMBERS from './sql/select-members.sql'
import SELECT_MEMBER from './sql/select-member.sql'
import SELECT_MEMBERSHIP from './sql/select-membership.sql'
import INSERT_MEMBER from './sql/insert-member.sql'
import UPDATE_MEMBER from './sql/update-member.sql'
import DELETE_MEMBER from './sql/delete-member.sql'
import DELETE_MEMBERSHIP from './sql/delete-membership.sql'

@injectable()
export class MemberRepository extends BaseRepository<ProjectMemberRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'project_members', 'id', repositoryOptions)
    }

    async listByProject(projectId: string, trx?: QueryRunner): Promise<ProjectMemberRow[]> {
        return this.time('listByProject', async () => {
            const { rows } = await this.run(trx).query<ProjectMemberRow>(SELECT_MEMBERS, [projectId])
            return rows
        })
    }

    async findMember(id: string, projectId: string, trx?: QueryRunner): Promise<ProjectMemberRow | undefined> {
        const { rows } = await this.run(trx).query<ProjectMemberRow>(SELECT_MEMBER, [id, projectId])
        return rows[0]
    }

    async findMembership(
        projectId: string,
        userId: string,
        trx?: QueryRunner
    ): Promise<ProjectMemberRow | undefined> {
        const { rows } = await this.run(trx).query<ProjectMemberRow>(SELECT_MEMBERSHIP, [projectId, userId])
        return rows[0]
    }

    async add(
        projectId: string,
        userId: string,
        permissions: readonly ProjectPermission[],
        trx?: QueryRunner
    ): Promise<string> {
        return this.time('add', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_MEMBER, [
                randomUUID(),
                projectId,
                userId,
                [...permissions],
            ])
            return rows[0].id
        })
    }

    async setPermissions(
        id: string,
        projectId: string,
        permissions: readonly ProjectPermission[],
        trx?: QueryRunner
    ): Promise<boolean> {
        const result = await this.run(trx).query(UPDATE_MEMBER, [id, projectId, [...permissions]])
        return (result.rowCount ?? 0) > 0
    }

    async remove(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_MEMBER, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }

    async removeMembership(projectId: string, userId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_MEMBERSHIP, [projectId, userId])
        return (result.rowCount ?? 0) > 0
    }
}
