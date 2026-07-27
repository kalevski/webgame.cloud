import type { WebhookDelivery, WebhookDeliveryStatus, WebhookEndpoint } from '../contracts/index.js'

export type WebhookEndpointRow = {
    id: string
    url: string
    secret: string
    description: string
    events: string[]
    active: boolean
    created_at: Date
    updated_at: Date
}

export type WebhookDeliveryRow = {
    id: string
    endpoint_id: string
    endpoint_url: string | null
    endpoint_secret?: string
    action: string
    payload: Record<string, unknown>
    status: WebhookDeliveryStatus
    attempts: number
    response_status: number | null
    error: string
    delivered_at: Date | null
    created_at: Date
    updated_at: Date
}

export const toWebhookEndpoint = (row: WebhookEndpointRow): WebhookEndpoint => ({
    id: row.id,
    url: row.url,
    description: row.description,
    events: row.events ?? [],
    active: row.active,
    secretSet: row.secret !== '',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

export const toWebhookDelivery = (row: WebhookDeliveryRow): WebhookDelivery => ({
    id: row.id,
    endpointId: row.endpoint_id,
    endpointUrl: row.endpoint_url ?? null,
    action: row.action,
    payload: row.payload ?? {},
    status: row.status,
    attempts: row.attempts,
    responseStatus: row.response_status,
    error: row.error,
    deliveredAt: row.delivered_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})
