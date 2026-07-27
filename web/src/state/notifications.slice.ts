import { StateCreator } from 'zustand'
import NotificationService from 'services/NotificationService'
import { STRINGS } from 'configs/strings'
import { AppNotification } from 'types'
import type { AppStore } from './index'

export type NotificationsSlice = {
    notifications: AppNotification[]
    notificationsUnread: number
    fetchNotifications: () => Promise<void>

    readNotification: (id: string) => Promise<void>

    readAllNotifications: () => Promise<void>

    pushEnabled: boolean | null
    probePush: () => Promise<void>
    enablePush: () => Promise<boolean>
    disablePush: () => Promise<void>
}

const pushRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
    return (await navigator.serviceWorker.getRegistration()) ?? null
}

const base64UrlToUint8 = (value: string): Uint8Array => {
    const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
    const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

export const createNotificationsSlice: StateCreator<AppStore, [], [], NotificationsSlice> = (set, get) => ({
    notifications: [],
    notificationsUnread: 0,

    async fetchNotifications() {
        try {
            const result = await NotificationService.getInstance().fetch()
            set({ notifications: result.notifications, notificationsUnread: result.unread })
        } catch {
        }
    },

    async readNotification(id) {
        const current = get().notifications
        const target = current.find((entry) => entry.id === id)
        if (!target || target.readAt !== null) return

        set({
            notifications: current.map((entry) =>
                entry.id === id ? { ...entry, readAt: new Date().toISOString() } : entry
            ),
            notificationsUnread: Math.max(0, get().notificationsUnread - 1),
        })
        try {
            await NotificationService.getInstance().markRead([id])
        } catch {
        }
    },

    async readAllNotifications() {
        set({
            notifications: get().notifications.map((entry) =>
                entry.readAt === null ? { ...entry, readAt: new Date().toISOString() } : entry
            ),
            notificationsUnread: 0,
        })
        try {
            await NotificationService.getInstance().markRead()
        } catch {
        }
    },

    pushEnabled: null,

    async probePush() {
        const registration = await pushRegistration()
        if (!registration) {
            set({ pushEnabled: null })
            return
        }
        const subscription = await registration.pushManager.getSubscription()
        set({ pushEnabled: subscription !== null })
    },

    async enablePush() {
        const t = STRINGS.notifications
        try {
            const registration = await pushRegistration()
            if (!registration) return false
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') {
                set({ pushEnabled: false })
                return false
            }
            const publicKey = await NotificationService.getInstance().fetchPushPublicKey()
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64UrlToUint8(publicKey).buffer as ArrayBuffer,
            })
            const json = subscription.toJSON()
            if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error('bad subscription')
            await NotificationService.getInstance().savePushSubscription({
                endpoint: json.endpoint,
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
            })
            set({ pushEnabled: true })
            get().addAlert({ variant: 'success', message: t.pushEnabled, dismissible: true })
            return true
        } catch {
            get().addAlert({ variant: 'danger', message: t.pushFailed, dismissible: true })
            return false
        }
    },

    async disablePush() {
        try {
            const registration = await pushRegistration()
            const subscription = await registration?.pushManager.getSubscription()
            if (subscription) {
                await NotificationService.getInstance().deletePushSubscription(subscription.endpoint)
                await subscription.unsubscribe()
            }
            set({ pushEnabled: false })
        } catch {
        }
    },
})
