import { StateCreator } from 'zustand'
import { AppAlert } from 'types'
import { generateId } from 'helpers/id'
import type { AppStore } from './index'

const AUTO_DISMISS_MS = 6000

const timers = new Map<string, ReturnType<typeof setTimeout>>()

export type AlertsSlice = {
    alerts: AppAlert[]
    addAlert: (alert: Omit<AppAlert, 'key'> & { key?: string }) => void
    dismissAlert: (key: string) => void
}

export const createAlertsSlice: StateCreator<AppStore, [], [], AlertsSlice> = (set, get) => ({
    alerts: [],

    addAlert(alert) {
        const key = alert.key ?? generateId()
        const existing = timers.get(key)
        if (existing) clearTimeout(existing)
        set({ alerts: [...get().alerts.filter((entry) => entry.key !== key), { ...alert, key }] })
        timers.set(
            key,
            setTimeout(() => get().dismissAlert(key), AUTO_DISMISS_MS)
        )
    },

    dismissAlert(key) {
        const timer = timers.get(key)
        if (timer) clearTimeout(timer)
        timers.delete(key)
        set({ alerts: get().alerts.filter((alert) => alert.key !== key) })
    },
})
