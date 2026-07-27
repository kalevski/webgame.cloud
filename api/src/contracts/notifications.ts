export const NOTIFICATION_KINDS = [
    'welcome',
    'project_shared',
    'task_activity',
    'system',
] as const

export type NotificationKind = typeof NOTIFICATION_KINDS[number]

export type AppNotification = {
    id: string
    kind: NotificationKind
    title: string
    link: string
    readAt: string | null
    createdAt: string
}

export type NotificationsResult = {
    notifications: AppNotification[]

    unread: number
}

export const notificationBadge = (unread: number): string => (unread > 9 ? '9+' : String(unread))

export type PushSubscriptionDraft = {
    endpoint: string
    p256dh: string
    auth: string
}

export const REPORT_TARGET_KINDS = ['project', 'user'] as const

export type ReportTargetKind = typeof REPORT_TARGET_KINDS[number]

export type ReportStatus = 'pending' | 'resolved'

export type Report = {
    id: string
    reporterId: string

    reporterName: string
    targetKind: ReportTargetKind
    targetId: string

    targetLabel: string
    reason: string
    status: ReportStatus
    resolvedBy: string | null
    resolvedAt: string | null
    resolution: string
    createdAt: string
}

export type AuditFilters = {
    actorId?: string
    action?: string

    q?: string

    from?: string
    to?: string

    limit?: number
    offset?: number

    cursor?: string
}

export type AuditEntry = {
    id: string
    actorId: string | null
    actorName: string
    action: string
    targetId: string
    detail: string
    createdAt: string
}
