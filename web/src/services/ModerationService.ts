import { apiFetch } from 'helpers/api'
import { AuditEntry, AuditFilters, Report, ReportStatus, ReportTargetKind } from 'types'

class ModerationService {
    private static instance: ModerationService
    private constructor() {}

    static getInstance(): ModerationService {
        if (!ModerationService.instance) ModerationService.instance = new ModerationService()
        return ModerationService.instance
    }

    async report(targetKind: ReportTargetKind, targetId: string, reason: string): Promise<Report> {
        return apiFetch<Report>('/api/reports', {
            method: 'POST',
            body: JSON.stringify({ targetKind, targetId, reason }),
        })
    }

    async fetchReports(status?: ReportStatus): Promise<Report[]> {
        const query = status ? `?status=${encodeURIComponent(status)}` : ''
        return apiFetch<Report[]>(`/api/moderation/reports${query}`)
    }

    async resolve(id: string, resolution: string): Promise<Report> {
        return apiFetch<Report>(`/api/moderation/reports/${encodeURIComponent(id)}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ resolution }),
        })
    }

    async fetchAuditLog(filters: AuditFilters): Promise<{ entries: AuditEntry[]; total: number; actions: string[] }> {
        const query = new URLSearchParams()
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
        }
        const suffix = query.toString()
        return apiFetch<{ entries: AuditEntry[]; total: number; actions: string[] }>(
            `/api/moderation/audit-log${suffix ? `?${suffix}` : ''}`
        )
    }
}

export default ModerationService
