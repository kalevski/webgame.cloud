import { apiFetch } from 'helpers/api'
import { NotificationsResult } from 'types'

class NotificationService {
    private static instance: NotificationService
    private constructor() {}

    static getInstance(): NotificationService {
        if (!NotificationService.instance) NotificationService.instance = new NotificationService()
        return NotificationService.instance
    }

    async fetch(): Promise<NotificationsResult> {
        return apiFetch<NotificationsResult>('/api/notifications')
    }

    async markRead(ids?: string[]): Promise<void> {
        await apiFetch<void>('/api/notifications/read', {
            method: 'POST',
            body: JSON.stringify(ids ? { ids } : {}),
        })
    }

    async fetchPushPublicKey(): Promise<string> {
        const { publicKey } = await apiFetch<{ publicKey: string }>('/api/push/public-key')
        return publicKey
    }

    async savePushSubscription(subscription: { endpoint: string; p256dh: string; auth: string }): Promise<void> {
        await apiFetch<{ ok: boolean }>('/api/push/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subscription),
        })
    }

    async deletePushSubscription(endpoint: string): Promise<void> {
        await apiFetch<void>('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) })
    }
}

export default NotificationService
