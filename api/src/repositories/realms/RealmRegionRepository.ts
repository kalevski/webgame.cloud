import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import { BaseRepository } from '@toolcase/node'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { RealmRegionRow } from '../../schema/realms.js'

import SELECT_REALM_REGIONS from './sql/select-realm-regions.sql'
import SELECT_REALM_REGION from './sql/select-realm-region.sql'
import INSERT_REALM_REGION from './sql/insert-realm-region.sql'
import UPDATE_REALM_REGION from './sql/update-realm-region.sql'
import DELETE_REALM_REGION from './sql/delete-realm-region.sql'
import COUNT_REGION_REALMS from './sql/count-region-realms.sql'

const UNIQUE_VIOLATION = '23505'

export type RealmRegionConflict = 'exists'

export type RealmRegionWrite = {
    name: string
    active: boolean
}

@injectable()
export class RealmRegionRepository extends BaseRepository<RealmRegionRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'realm_regions', 'id', repositoryOptions)
    }

    async findAll(trx?: QueryRunner): Promise<RealmRegionRow[]> {
        return this.time('findAll', async () => {
            const { rows } = await this.run(trx).query<RealmRegionRow>(SELECT_REALM_REGIONS)
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<RealmRegionRow | undefined> {
        const { rows } = await this.run(trx).query<RealmRegionRow>(SELECT_REALM_REGION, [id])
        return rows[0]
    }

    async create(
        write: RealmRegionWrite,
        trx?: QueryRunner
    ): Promise<Result<RealmRegionRow, RealmRegionConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_REALM_REGION, [
                    randomUUID(),
                    write.name,
                    write.active,
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
                throw error
            }
        })
    }

    async updateRegion(
        id: string,
        write: RealmRegionWrite,
        trx?: QueryRunner
    ): Promise<Result<RealmRegionRow | undefined, RealmRegionConflict>> {
        try {
            const result = await this.run(trx).query(UPDATE_REALM_REGION, [id, write.name, write.active])
            if ((result.rowCount ?? 0) === 0) return ok(undefined)
            return ok(await this.findById(id, trx))
        } catch (error) {
            if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('exists')
            throw error
        }
    }

    async softDelete(id: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_REALM_REGION, [id])
        return (result.rowCount ?? 0) > 0
    }

    async countRealms(id: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_REGION_REALMS, [id])
        return Number(rows[0]?.c ?? 0)
    }
}
