import type { ReportStatus, ReportTargetKind } from '../contracts/index.js'

export type ReportRow = {
    id: string

    reporter_id: string
    reporter_name: string
    target_kind: ReportTargetKind
    target_id: string
    target_label: string
    reason: string
    status: ReportStatus
    resolved_by: string | null
    resolved_at: Date | null
    resolution: string
    created_at: Date
}

export type AuditRow = {
    id: string
    actor_id: string | null
    actor_name: string
    action: string
    target_id: string
    detail: string
    impersonated: boolean
    created_at: Date
}
