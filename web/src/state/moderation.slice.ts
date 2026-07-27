import { StateCreator } from 'zustand'
import ModerationService from 'services/ModerationService'
import { STRINGS } from 'configs/strings'
import { AuditEntry, AuditFilters, Report, ReportTargetKind } from 'types'
import type { AppStore } from './index'

export type ModerationSlice = {
    reports: Report[]
    auditLog: AuditEntry[]
    auditTotal: number
    auditActions: string[]
    auditLoading: boolean
    auditFilters: AuditFilters
    fetchReports: () => Promise<void>
    fetchAuditLog: (filters?: AuditFilters) => Promise<void>
    resolveReport: (id: string, resolution: string) => Promise<boolean>

    submitReport: (targetKind: ReportTargetKind, targetId: string, reason: string) => Promise<boolean>
}

export const createModerationSlice: StateCreator<AppStore, [], [], ModerationSlice> = (set, get) => ({
    reports: [],
    auditLog: [],
    auditTotal: 0,
    auditActions: [],
    auditLoading: false,
    auditFilters: { limit: 25, offset: 0 },

    async fetchReports() {
        try {
            set({ reports: await ModerationService.getInstance().fetchReports() })
        } catch {
            get().addAlert({ variant: 'danger', message: STRINGS.alerts.loadFailed, dismissible: true })
        }
    },

    async fetchAuditLog(filters) {
        const next = { ...get().auditFilters, ...filters }
        set({ auditLoading: true, auditFilters: next })
        try {
            const { entries, total, actions } = await ModerationService.getInstance().fetchAuditLog(next)
            set({ auditLog: entries, auditTotal: total, auditActions: actions, auditLoading: false })
        } catch {
            set({ auditLoading: false })
            get().addAlert({ variant: 'danger', message: STRINGS.alerts.loadFailed, dismissible: true })
        }
    },

    async resolveReport(id, resolution) {
        const t = STRINGS.moderation
        try {
            await ModerationService.getInstance().resolve(id, resolution)
            await get().fetchReports()
            get().addAlert({ variant: 'success', message: t.resolved, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.alerts.loadFailed,
                dismissible: true,
            })
            return false
        }
    },

    async submitReport(targetKind, targetId, reason) {
        const t = STRINGS.moderation
        try {
            await ModerationService.getInstance().report(targetKind, targetId, reason)
            get().addAlert({ variant: 'success', message: t.reportSent, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : t.reportFailed,
                dismissible: true,
            })
            return false
        }
    },
})
