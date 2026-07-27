export const WEBHOOK_DELIVERY_STATUSES = [
    'pending',
    'delivered',
    'failed',
] as const

export type WebhookDeliveryStatus = typeof WEBHOOK_DELIVERY_STATUSES[number]

export type WebhookEndpoint = {
    id: string

    url: string

    description: string

    events: string[]

    active: boolean

    secretSet: boolean

    createdAt: string
    updatedAt: string
}

export type WebhookEndpointDraft = {
    url: string
    description?: string
    events: string[]
    active?: boolean
    secret?: string
}

export type WebhookDelivery = {
    id: string

    endpointId: string
    endpointUrl: string | null

    action: string

    payload: Record<string, unknown>

    status: WebhookDeliveryStatus

    attempts: number
    responseStatus: number | null
    error: string

    deliveredAt: string | null
    createdAt: string
}

export type WebhookDeliveryFilters = {
    endpointId?: string
    status?: WebhookDeliveryStatus
    action?: string
    q?: string
    limit?: number
    offset?: number

    cursor?: string
}

export type WebhookEventPayload = {
    deliveryId: string
    action: string
    actorId: string | null
    actorName: string
    targetId: string
    detail: string
    occurredAt: string
}
