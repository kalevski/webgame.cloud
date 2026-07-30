import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { ProjectPermission } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { ProjectInviteRow } from '../../schema/projects.js'
import { ok, err, type Result } from '@toolcase/base'

import SELECT_INVITES from './sql/select-invites.sql'
import SELECT_INVITE from './sql/select-invite.sql'
import SELECT_INVITES_FOR_USER from './sql/select-invites-for-user.sql'
import INSERT_INVITE from './sql/insert-invite.sql'
import ACCEPT_INVITE from './sql/accept-invite.sql'
import DELETE_INVITE from './sql/delete-invite.sql'
import UPDATE_INVITE_PERMISSIONS from './sql/update-invite-permissions.sql'

export type InviteCreateConflict = 'exists'

@injectable()
export class InviteRepository extends BaseRepository<ProjectInviteRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'project_invites', 'id', repositoryOptions)
    }

    async listByProject(projectId: string, trx?: QueryRunner): Promise<ProjectInviteRow[]> {
        const { rows } = await this.run(trx).query<ProjectInviteRow>(SELECT_INVITES, [projectId])
        return rows
    }

    async listForUser(userId: string, email: string, trx?: QueryRunner): Promise<ProjectInviteRow[]> {
        const { rows } = await this.run(trx).query<ProjectInviteRow>(SELECT_INVITES_FOR_USER, [userId, email])
        return rows
    }

    async findById(id: string, trx?: QueryRunner): Promise<ProjectInviteRow | undefined> {
        const { rows } = await this.run(trx).query<ProjectInviteRow>(SELECT_INVITE, [id])
        return rows[0]
    }

    async create(
        projectId: string,
        write: { email: string; userId: string | null; permissions: readonly ProjectPermission[]; invitedBy: string },
        trx?: QueryRunner
    ): Promise<Result<ProjectInviteRow, InviteCreateConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_INVITE, [
                    randomUUID(),
                    projectId,
                    write.email,
                    write.userId,
                    [...write.permissions],
                    write.invitedBy,
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === '23505') return err('exists')
                throw error
            }
        })
    }

    async setPermissions(
        id: string,
        projectId: string,
        permissions: ProjectPermission[],
        trx?: QueryRunner
    ): Promise<boolean> {
        return this.time('setPermissions', async () => {
            const result = await this.run(trx).query(UPDATE_INVITE_PERMISSIONS, [id, projectId, permissions])
            return (result.rowCount ?? 0) > 0
        })
    }

    async accept(id: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(ACCEPT_INVITE, [id])
        return (result.rowCount ?? 0) > 0
    }

    async revoke(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_INVITE, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }
}
