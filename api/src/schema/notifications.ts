import type { NotificationKind } from '../contracts/index.js'

export type NotificationRow = {
    id: string
    user_id: string
    kind: NotificationKind
    title: string
    link: string
    read_at: Date | null
    created_at: Date
}

export type PushSubscriptionRow = {
    user_id: string
    endpoint: string
    p256dh: string
    auth: string
}
