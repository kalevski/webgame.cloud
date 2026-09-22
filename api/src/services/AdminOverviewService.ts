import { inject, injectable } from 'tsyringe'
import type { AdminOverview } from '../contracts/index.js'
import { AdminOverviewRepository } from '../repositories/admin/AdminOverviewRepository.js'
import { ReportRepository } from '../repositories/moderation/ReportRepository.js'

@injectable()
export class AdminOverviewService {
    constructor(
        @inject(AdminOverviewRepository) private overviewRepository: AdminOverviewRepository,
        @inject(ReportRepository) private reports: ReportRepository
    ) {}

    async overview(): Promise<AdminOverview> {
        const [stats, reportPending, weeks, appTypes, statuses, roles] = await Promise.all([
            this.overviewRepository.stats(),
            this.reports.countPending(),
            this.overviewRepository.signupsByWeek(),
            this.overviewRepository.projectsByAppType(),
            this.overviewRepository.buildsByStatus(),
            this.overviewRepository.usersByRole(),
        ])
        const cohortSize = Number(stats.cohort_size)
        return {
            signupsTotal: Number(stats.signups_total),
            signupsLast30: Number(stats.signups_last_30),
            wau: Number(stats.wau),
            d30Retention: cohortSize > 0 ? Math.round((Number(stats.cohort_active) / cohortSize) * 100) / 100 : null,
            projectsTotal: Number(stats.projects_total),
            projectsLast30: Number(stats.projects_last_30),
            buildsTotal: Number(stats.builds_total),
            reportQueue: { pending: reportPending },
            signupsByWeek: weeks.map((row) => ({ week: row.week, count: Number(row.count) })),
            projectsByAppType: appTypes.map((row) => ({ appType: row.app_type, count: Number(row.count) })),
            buildsByStatus: statuses.map((row) => ({ status: row.status, count: Number(row.count) })),
            usersByRole: roles.map((row) => ({ role: row.role, name: row.name, count: Number(row.count) })),
        }
    }
}
