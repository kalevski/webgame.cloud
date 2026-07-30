import { inject, injectable } from 'tsyringe'
import { createHmac, randomBytes, randomUUID } from 'node:crypto'
import type {
    User,
    WebhookDelivery,
    WebhookDeliveryFilters,
    WebhookEndpoint,
    WebhookEndpointDraft,
} from '../contracts/index.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'
import { getLogger } from '../logging.js'
import { WebhookRepository } from '../repositories/webhooks/WebhookRepository.js'
import { decodeCursor, takePage } from '../repositories/pagination.js'
import { toWebhookDelivery, toWebhookEndpoint } from '../schema/webhooks.js'

const log = getLogger('webhooks')

const TIMEOUT_MS = 10_000

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

export const signPayload = (secret: string, timestamp: string, body: string): string =>
    createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')

@injectable()
export class WebhookService {
    constructor(@inject(WebhookRepository) private webhooks: WebhookRepository) {}

    async listEndpoints(): Promise<WebhookEndpoint[]> {
        return (await this.webhooks.listEndpoints()).map(toWebhookEndpoint)
    }

    async createEndpoint(draft: WebhookEndpointDraft): Promise<WebhookEndpoint> {
        const url = draft.url.trim()
        if (!isHttpUrl(url)) throw new ValidationError('webhook_url_invalid', 'a http(s) url is required')

        const created = await this.webhooks.insertEndpoint({
            id: randomUUID(),
            url,
            secret: draft.secret?.trim() || randomBytes(24).toString('hex'),
            description: draft.description?.trim() ?? '',
            events: draft.events ?? [],
            active: draft.active ?? true,
        })
        if (!created) throw new NotFoundError('webhook_not_found', 'webhook not found')
        return toWebhookEndpoint(created)
    }

    async updateEndpoint(id: string, patch: Partial<WebhookEndpointDraft>): Promise<WebhookEndpoint> {
        if (patch.url !== undefined && !isHttpUrl(patch.url.trim())) {
            throw new ValidationError('webhook_url_invalid', 'a http(s) url is required')
        }

        const updated = await this.webhooks.updateEndpoint(id, {
            url: patch.url?.trim() ?? null,
            secret: patch.secret?.trim() || null,
            description: patch.description?.trim() ?? null,
            events: patch.events ?? null,
            active: patch.active ?? null,
        })
        if (!updated) throw new NotFoundError('webhook_not_found', 'webhook not found', [id])
        return toWebhookEndpoint(updated)
    }

    async deleteEndpoint(id: string): Promise<void> {
        const removed = await this.webhooks.deleteEndpoint(id)
        if (!removed) throw new NotFoundError('webhook_not_found', 'webhook not found', [id])
    }

    async listDeliveries(
        filters: WebhookDeliveryFilters
    ): Promise<{ deliveries: WebhookDelivery[]; total: number; nextCursor: string | null }> {
        const query = {
            endpointId: filters.endpointId ?? null,
            status: filters.status ?? null,
            action: filters.action ?? null,
            q: filters.q?.trim() || null,
        }
        const limit = filters.limit ?? 25
        const cursor = decodeCursor(filters.cursor)

        const [rows, total] = await Promise.all([
            this.webhooks.listDeliveries({
                ...query,
                limit: limit + 1,
                offset: cursor.createdAt ? 0 : filters.offset ?? 0,
                cursor,
            }),
            this.webhooks.countDeliveries(query),
        ])
        const page = takePage(rows, limit, (row) => ({ createdAt: row.created_at, id: row.id }))
        return { deliveries: page.rows.map(toWebhookDelivery), total, nextCursor: page.nextCursor }
    }

    async queueForAction(
        actor: User | null,
        action: string,
        targetId: string,
        detail: string
    ): Promise<string[]> {
        const endpoints = await this.webhooks.endpointsForAction(action)
        const deliveryIds: string[] = []

        for (const endpoint of endpoints) {
            const deliveryId = randomUUID()
            await this.webhooks.insertDelivery({
                id: deliveryId,
                endpointId: endpoint.id,
                action,
                payload: {
                    deliveryId,
                    action,
                    actorId: actor?.id ?? null,
                    actorName: actor ? actor.name || actor.email : '',
                    targetId,
                    detail,
                    occurredAt: new Date().toISOString(),
                },
            })
            deliveryIds.push(deliveryId)
        }

        return deliveryIds
    }

    async deliver(deliveryId: string): Promise<void> {
        const delivery = await this.webhooks.findDelivery(deliveryId)
        if (!delivery) return

        const body = JSON.stringify(delivery.payload ?? {})
        const timestamp = String(Math.floor(Date.now() / 1000))
        const signature = signPayload(delivery.endpoint_secret ?? '', timestamp, body)

        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
        try {
            const response = await fetch(delivery.endpoint_url ?? '', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-webgame-cloud-event': delivery.action,
                    'x-webgame-cloud-timestamp': timestamp,
                    'x-webgame-cloud-signature': `sha256=${signature}`,
                },
                body,
                signal: controller.signal,
            })

            if (!response.ok) {
                await this.webhooks.markFailed(deliveryId, response.status, `endpoint returned ${response.status}`)
                throw new Error(`webhook endpoint returned ${response.status}`)
            }

            await this.webhooks.markDelivered(deliveryId, response.status)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            await this.webhooks.markFailed(deliveryId, null, message)
            log.error('webhook delivery failed', { deliveryId, message })
            throw error
        } finally {
            clearTimeout(timer)
        }
    }
}
