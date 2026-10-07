import type { FastifyPluginAsync } from 'fastify'
import type { BillingProvider } from '../contracts/index.js'
import { getBillingPort } from '../domain/billing.js'
import { NotFoundError, UnauthorizedError, UnavailableError, ValidationError } from '../domain/errors.js'
import container from '../container.js'
import { BillingEventService } from '../services/BillingEventService.js'

export const billingWebhookRouter: FastifyPluginAsync = async (app) => {
    app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, payload, done) => {
        done(null, payload)
    })
    app.addContentTypeParser('*', { parseAs: 'buffer' }, (_request, payload, done) => {
        done(null, payload)
    })

    app.post<{ Params: { provider: string } }>(
        '/api/billing/webhooks/:provider',
        async (request, reply) => {
            const port = getBillingPort(request.params.provider as BillingProvider)
            if (!port) throw new NotFoundError('not_found', 'no gateway is registered under that name')
            if (!port.ready()) throw new UnavailableError('provider_not_ready', 'the gateway has no credentials configured')

            const raw = request.body as Buffer
            if (!port.verifyWebhookSignature(raw, request.headers)) {
                throw new UnauthorizedError('unauthorized', 'invalid webhook signature')
            }

            let payload: unknown
            try {
                payload = JSON.parse(raw.toString('utf8'))
            } catch {
                throw new ValidationError('invalid_body', 'the webhook body is not valid JSON')
            }

            const event = port.parseWebhookPayload(payload)
            await container.resolve(BillingEventService).receive(port.id, event, payload)

            reply.code(204)
            return null
        }
    )
}
