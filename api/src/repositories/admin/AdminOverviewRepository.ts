import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'
import type {
    AdminStatsRow,
    BuildStatusCountRow,
    ProjectAppTypeCountRow,
    SignupWeekRow,
    UserRoleCountRow,
} from '../../schema/admin.js'

import SELECT_ADMIN_STATS from './sql/select-admin-stats.sql'
import SELECT_SIGNUPS_BY_WEEK from './sql/select-signups-by-week.sql'
import SELECT_USERS_BY_ROLE from './sql/select-users-by-role.sql'
import SELECT_PROJECTS_BY_APP_TYPE from './sql/select-projects-by-app-type.sql'
import SELECT_BUILDS_BY_STATUS from './sql/select-builds-by-status.sql'

@injectable()
export class AdminOverviewRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'admin_overview', 'id', repositoryOptions)
    }

    async stats(trx?: QueryRunner): Promise<AdminStatsRow> {
        return this.time('stats', async () => {
            const { rows } = await this.run(trx).query<AdminStatsRow>(SELECT_ADMIN_STATS)
            return rows[0]
        })
    }

    async signupsByWeek(trx?: QueryRunner): Promise<SignupWeekRow[]> {
        return this.time('signupsByWeek', async () => {
            const { rows } = await this.run(trx).query<SignupWeekRow>(SELECT_SIGNUPS_BY_WEEK)
            return rows
        })
    }

    async usersByRole(trx?: QueryRunner): Promise<UserRoleCountRow[]> {
        return this.time('usersByRole', async () => {
            const { rows } = await this.run(trx).query<UserRoleCountRow>(SELECT_USERS_BY_ROLE)
            return rows
        })
    }

    async projectsByAppType(trx?: QueryRunner): Promise<ProjectAppTypeCountRow[]> {
        return this.time('projectsByAppType', async () => {
            const { rows } = await this.run(trx).query<ProjectAppTypeCountRow>(SELECT_PROJECTS_BY_APP_TYPE)
            return rows
        })
    }

    async buildsByStatus(trx?: QueryRunner): Promise<BuildStatusCountRow[]> {
        return this.time('buildsByStatus', async () => {
            const { rows } = await this.run(trx).query<BuildStatusCountRow>(SELECT_BUILDS_BY_STATUS)
            return rows
        })
    }
}
