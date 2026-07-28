import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import { BaseRepository } from '@toolcase/node'
import type { MigrationState } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { ProjectMigrationRow } from '../../schema/realms.js'

import SELECT_ACTIVE_MIGRATION from './sql/select-active-migration.sql'
import SELECT_MIGRATION from './sql/select-migration.sql'
import SELECT_NONTERMINAL_MIGRATIONS from './sql/select-nonterminal-migrations.sql'
import SELECT_STALE_MIGRATIONS from './sql/select-stale-migrations.sql'
import INSERT_MIGRATION from './sql/insert-migration.sql'
import UPDATE_MIGRATION_STATE from './sql/update-migration-state.sql'
import FAIL_MIGRATION from './sql/fail-migration.sql'

const UNIQUE_VIOLATION = '23505'

export type MigrationCreateConflict = 'in_progress'

@injectable()
export class ProjectMigrationRepository extends BaseRepository<ProjectMigrationRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'project_migrations', 'id', repositoryOptions)
    }

    async findActive(projectId: string, trx?: QueryRunner): Promise<ProjectMigrationRow | undefined> {
        const { rows } = await this.run(trx).query<ProjectMigrationRow>(SELECT_ACTIVE_MIGRATION, [projectId])
        return rows[0]
    }

    async findById(id: string, trx?: QueryRunner): Promise<ProjectMigrationRow | undefined> {
        const { rows } = await this.run(trx).query<ProjectMigrationRow>(SELECT_MIGRATION, [id])
        return rows[0]
    }

    async findNonTerminal(trx?: QueryRunner): Promise<ProjectMigrationRow[]> {
        const { rows } = await this.run(trx).query<ProjectMigrationRow>(SELECT_NONTERMINAL_MIGRATIONS)
        return rows
    }

    async findStale(minutes: number, trx?: QueryRunner): Promise<ProjectMigrationRow[]> {
        const { rows } = await this.run(trx).query<ProjectMigrationRow>(SELECT_STALE_MIGRATIONS, [minutes])
        return rows
    }

    async create(
        write: { projectId: string; fromRealmId: string | null; toRealmId: string; actorId: string | null },
        trx?: QueryRunner
    ): Promise<Result<ProjectMigrationRow, MigrationCreateConflict>> {
        return this.time('create', async () => {
            try {
                const { rows } = await this.run(trx).query<{ id: string }>(INSERT_MIGRATION, [
                    randomUUID(),
                    write.projectId,
                    write.fromRealmId,
                    write.toRealmId,
                    write.actorId,
                ])
                const created = await this.findById(rows[0].id, trx)
                return ok(created!)
            } catch (error) {
                if ((error as { code?: string }).code === UNIQUE_VIOLATION) return err('in_progress')
                throw error
            }
        })
    }

    async advance(id: string, state: MigrationState, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(UPDATE_MIGRATION_STATE, [id, state])
        return (result.rowCount ?? 0) > 0
    }

    async fail(id: string, error: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(FAIL_MIGRATION, [id, error.slice(0, 500)])
        return (result.rowCount ?? 0) > 0
    }
}
