import { inject, injectable } from 'tsyringe'
import type { AuditFilters, AuditEntry, Report, ReportStatus, ReportTargetKind, User } from '../contracts/index.js'
import type { AuditRow, ReportRow } from '../schema/moderation.js'
import { ReportRepository } from '../repositories/moderation/ReportRepository.js'
import { AuditRepository } from '../repositories/moderation/AuditRepository.js'
import { decodeCursor, takePage } from '../repositories/pagination.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { MemberRepository } from '../repositories/projects/MemberRepository.js'
import { ConflictError, NotFoundError } from '../domain/errors.js'
import { UserRepository } from '../repositories/users/UserRepository.js'

const toReport = (row: ReportRow): Report => ({
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    targetKind: row.target_kind,
    targetId: row.target_id,
    targetLabel: row.target_label,
    reason: row.reason,
    status: row.status,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at?.toISOString() ?? null,
    resolution: row.resolution,
    createdAt: row.created_at.toISOString(),
})

const toAuditEntry = (row: AuditRow): AuditEntry => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    targetId: row.target_id,
    detail: row.detail,
    impersonated: row.impersonated,
    createdAt: row.created_at.toISOString(),
})

@injectable()
export class ModerationService {
    constructor(
        @inject(ReportRepository) private reports: ReportRepository,
        @inject(AuditRepository) private audit: AuditRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(MemberRepository) private members: MemberRepository,
        @inject(UserRepository) private users: UserRepository
    ) {}

    private async resolveTargetLabel(
        user: User,
        targetKind: ReportTargetKind,
        targetId: string
    ): Promise<string | null> {
        if (targetKind === 'project') {
            const project = await this.projects.findById(targetId)
            if (!project) return null

            const member = await this.members.findMembership(targetId, user.id)
            return project.owner_id === user.id || member ? project.name : null
        }
        const profile = await this.users.findById(targetId)
        return profile ? profile.name || profile.email : null
    }

    async report(
        user: User,
        targetKind: ReportTargetKind,
        targetId: string,
        reason: string
    ): Promise<Report> {
        const targetLabel = await this.resolveTargetLabel(user, targetKind, targetId)
        if (targetLabel === null) {
            throw new NotFoundError('target_not_found', `${targetKind} ${targetId} not found`)
        }

        const result = await this.reports.create({
            reporterId: user.id,
            targetKind,
            targetId,
            targetLabel,
            reason: reason.trim(),
        })
        if (result.isErr()) {
            throw new ConflictError('report_exists', 'You already have an open report for this.')
        }
        return toReport(result.unwrap())
    }

    async listReports(status: ReportStatus | undefined, offset: number): Promise<Report[]> {
        const rows = await this.reports.list(status, offset)
        return rows.map(toReport)
    }

    async resolveReport(user: User, reportId: string, resolution: string): Promise<Report> {
        const result = await this.reports.resolve(reportId, user.id, resolution.trim())
        if (result.isErr()) {
            const conflict = result.unwrapErr()
            if (conflict === 'missing') {
                throw new NotFoundError('report_not_found', `report ${reportId} not found`)
            }
            throw new ConflictError('report_not_pending', 'this report has already been resolved')
        }
        const report = toReport(result.unwrap())
        void this.audit.record(
            user.id,
            user.name || user.email,
            'resolve_report',
            report.targetId,
            `${report.targetKind}: ${report.targetLabel}`
        )
        return report
    }

    async listAuditEntries(
        filters: AuditFilters
    ): Promise<{ entries: AuditEntry[]; total: number; actions: string[]; nextCursor: string | null }> {
        const limit = Math.min(filters.limit ?? 50, 200)
        const cursor = decodeCursor(filters.cursor)
        const query = {
            actorId: filters.actorId ?? null,
            action: filters.action ?? null,
            from: filters.from ? new Date(filters.from) : null,
            to: filters.to ? new Date(filters.to) : null,
            q: filters.q?.trim() || null,
            limit,
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total, actions] = await Promise.all([
            this.audit.list({
                ...query,
                limit: limit + 1,
                offset: cursor.createdAt ? 0 : query.offset,
                cursor,
            }),
            this.audit.count(query),
            cursor.createdAt || query.offset > 0 ? Promise.resolve([]) : this.audit.listActions(),
        ])
        const page = takePage(rows, limit, (row) => ({ createdAt: row.created_at, id: row.id }))
        return { entries: page.rows.map(toAuditEntry), total, actions, nextCursor: page.nextCursor }
    }
}
