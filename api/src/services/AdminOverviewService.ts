import { inject, injectable } from 'tsyringe'
import type { AdminOverview } from '../contracts/index.js'
import { Database } from '../Database.js'
import { ReportRepository } from '../repositories/moderation/ReportRepository.js'

@injectable()
export class AdminOverviewService {
    constructor(
        @inject(Database) private database: Database,
        @inject(ReportRepository) private reports: ReportRepository
    ) {}

    async overview(): Promise<AdminOverview> {
        const [stats, reportPending, weeks, visibility, statuses, roles] = await Promise.all([
            this.database.pool.query<{
                signups_total: string
                signups_last_30: string
                wau: string
                cohort_size: string
                cohort_active: string
                projects_total: string
                projects_last_30: string
                tasks_total: string
            }>(
                `SELECT
                    (SELECT count(*) FROM users) AS signups_total,
                    (SELECT count(*) FROM users WHERE created_at > now() - interval '30 days') AS signups_last_30,
                    (SELECT count(*) FROM users WHERE last_seen_at > now() - interval '7 days') AS wau,
                    (SELECT count(*) FROM users
                     WHERE created_at BETWEEN now() - interval '37 days' AND now() - interval '30 days') AS cohort_size,
                    (SELECT count(*) FROM users
                     WHERE created_at BETWEEN now() - interval '37 days' AND now() - interval '30 days'
                       AND last_seen_at > now() - interval '7 days') AS cohort_active,
                    (SELECT count(*) FROM projects) AS projects_total,
                    (SELECT count(*) FROM projects WHERE created_at > now() - interval '30 days') AS projects_last_30,
                    (SELECT count(*) FROM tasks) AS tasks_total`
            ),
            this.reports.countPending(),

            this.database.pool.query<{ week: string; count: string }>(
                `SELECT to_char(w.week, 'YYYY-MM-DD') AS week, count(u.id) AS count
                 FROM generate_series(
                     date_trunc('week', now()) - interval '11 weeks',
                     date_trunc('week', now()),
                     interval '1 week'
                 ) AS w(week)
                 LEFT JOIN users u ON date_trunc('week', u.created_at) = w.week
                 GROUP BY w.week ORDER BY w.week`
            ),
            this.database.pool.query<{ visibility: string; count: string }>(
                `SELECT visibility, count(*) AS count FROM projects GROUP BY visibility`
            ),
            this.database.pool.query<{ status: string; count: string }>(
                `SELECT status, count(*) AS count FROM tasks GROUP BY status`
            ),
            this.database.pool.query<{ role: string; name: string; count: string }>(
                `SELECT u.role, coalesce(r.name, u.role) AS name, count(*) AS count
                 FROM users u LEFT JOIN roles r ON r.id = u.role
                 GROUP BY u.role, r.name ORDER BY count(*) DESC`
            ),
        ])
        const row = stats.rows[0]
        const cohortSize = Number(row.cohort_size)
        return {
            signupsTotal: Number(row.signups_total),
            signupsLast30: Number(row.signups_last_30),
            wau: Number(row.wau),
            d30Retention: cohortSize > 0 ? Math.round((Number(row.cohort_active) / cohortSize) * 100) / 100 : null,
            projectsTotal: Number(row.projects_total),
            projectsLast30: Number(row.projects_last_30),
            tasksTotal: Number(row.tasks_total),
            reportQueue: { pending: reportPending },
            signupsByWeek: weeks.rows.map((r) => ({ week: r.week, count: Number(r.count) })),
            projectsByVisibility: visibility.rows.map((r) => ({ visibility: r.visibility, count: Number(r.count) })),
            tasksByStatus: statuses.rows.map((r) => ({ status: r.status, count: Number(r.count) })),
            usersByRole: roles.rows.map((r) => ({ role: r.role, name: r.name, count: Number(r.count) })),
        }
    }
}
