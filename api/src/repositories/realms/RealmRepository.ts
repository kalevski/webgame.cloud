import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import { BaseRepository } from '@toolcase/node'
import type { RealmHeartbeat, RealmStatus } from '../../contracts/index.js'
import { REALM_SILENT_SECONDS } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { RealmRow } from '../../schema/realms.js'

import SELECT_REALMS from './sql/select-realms.sql'
import SELECT_REALM from './sql/select-realm.sql'
import SELECT_REALM_BY_TOKEN from './sql/select-realm-by-token.sql'
import SELECT_CANDIDATE_REALMS from './sql/select-candidate-realms.sql'
import INSERT_REALM from './sql/insert-realm.sql'
import UPDATE_REALM from './sql/update-realm.sql'
import UPDATE_REALM_TOKEN from './sql/update-realm-token.sql'
import UPDATE_REALM_HEARTBEAT from './sql/update-realm-heartbeat.sql'
import DELETE_REALM from './sql/delete-realm.sql'
import COUNT_REALM_PROJECTS from './sql/count-realm-projects.sql'

const UNIQUE_VIOLATION = '23505'

export type RealmCreateConflict = 'exists'

export type RealmWrite = {
    name: string
    baseUrl: string
    region: string
    planId: string | null
    exclusive: boolean
    status: RealmStatus
}

@injectable()
export class RealmRepository extends BaseRepository<RealmRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'realms', 'id', repositoryOptions)
    }

    async findAll(trx?: QueryRunner): Promise<RealmRow[]> {
        return this.time('findAll', async () => {
            const { rows } = await this.run(trx).query<RealmRow>(SELECT_REALMS)
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<RealmRow | undefined> {
        const { rows } = await this.run(trx).query<RealmRow>(SELECT_REALM, [id])
        return rows[0]
    }

    async findByTokenHash(hash: string, trx?: QueryRunner): Promise<RealmRow | undefined> {
        const { rows } = await this.run(trx).query<RealmRow>(SELECT_REALM_BY_TOKEN, [hash])
        return rows[0]
    }

    async findCandidates(planId: string | null, trx?: QueryRunner): Promise<RealmRow[]> {
        const { rows } = await this.run(trx).query<RealmRow>(SELECT_CANDIDATE_REALMS, [
            planId,
            REALM_SILENT_SECONDS,
        ])
        return rows
    }

    async create(
        write: RealmWrite,
        tokenHash: string,
        trx?: QueryRunner
    ): Promise<Result<RealmRow, RealmCreateConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_REALM, [
                    randomUUID(),
                    write.name,
                    write.baseUrl,
                    write.region,
                    write.planId,
                    write.exclusive,
                    write.status,
                    tokenHash,
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
                throw error
            }
        })
    }

    async updateRealm(
        id: string,
        write: RealmWrite,
        trx?: QueryRunner
    ): Promise<Result<RealmRow | undefined, RealmCreateConflict>> {
        try {
            const result = await this.run(trx).query(UPDATE_REALM, [
                id,
                write.name,
                write.baseUrl,
                write.region,
                write.planId,
                write.exclusive,
                write.status,
            ])
            if ((result.rowCount ?? 0) === 0) return ok(undefined)
            return ok(await this.findById(id, trx))
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
            throw error
        }
    }

    async setTokenHash(id: string, hash: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(UPDATE_REALM_TOKEN, [id, hash])
        return (result.rowCount ?? 0) > 0
    }

    async touchHeartbeat(id: string, beat: RealmHeartbeat, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(UPDATE_REALM_HEARTBEAT, [
            id,
            beat.health,
            Math.max(0, Math.floor(beat.diskFreeBytes)),
            Math.max(0, Math.floor(beat.queueDepth)),
        ])
    }

    async softDelete(id: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_REALM, [id])
        return (result.rowCount ?? 0) > 0
    }

    async countProjects(id: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_REALM_PROJECTS, [id])
        return Number(rows[0]?.c ?? 0)
    }
}
