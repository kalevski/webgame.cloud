import webpush from 'web-push'
import { inject, injectable } from 'tsyringe'
import type { PushSubscriptionDraft } from '../contracts/index.js'
import { PushSubscriptionRepository } from '../repositories/push/PushSubscriptionRepository.js'
import { ValidationError } from '../domain/errors.js'
import { isAllowedPushEndpoint } from '../util/pushEndpoint.js'
import { Async } from '@toolcase/base'

import { SettingsService } from './SettingsService.js'

export type PushPayload = {
    title: string

    link: string
}

const DEAD_ENDPOINT_STATUS = new Set([403, 404, 410])

const PUSH_CONCURRENCY = 5

@injectable()
export class PushService {
    private cachedKeys: { publicKey: string; privateKey: string } | null = null

    constructor(
        @inject(PushSubscriptionRepository) private subscriptions: PushSubscriptionRepository,
        @inject(SettingsService) private settings: SettingsService
    ) {}

    async getVapidPublicKey(): Promise<string> {
        return (await this.ensureKeys()).publicKey
    }

    private async ensureKeys(): Promise<{ publicKey: string; privateKey: string }> {
        if (this.cachedKeys) return this.cachedKeys
        const stored = await this.settings.getPushVapidKeys()
        if (stored && stored !== 'corrupt') {
            this.cachedKeys = stored
            return stored
        }
        const generated = webpush.generateVAPIDKeys()

        await this.settings.savePushVapidKeys(generated, stored === 'corrupt')

        const settled = await this.settings.getPushVapidKeys()
        this.cachedKeys = settled && settled !== 'corrupt' ? settled : generated
        return this.cachedKeys
    }

    async subscribe(userId: string, draft: PushSubscriptionDraft): Promise<void> {
        if (!isAllowedPushEndpoint(draft.endpoint)) {
            throw new ValidationError('invalid_push_endpoint', 'invalid push endpoint')
        }
        await this.subscriptions.save({
            user_id: userId,
            endpoint: draft.endpoint,
            p256dh: draft.p256dh,
            auth: draft.auth,
        })
    }

    async unsubscribe(userId: string, endpoint: string): Promise<void> {
        await this.subscriptions.deleteForUser(userId, endpoint)
    }

    async sendToUser(userId: string, payload: PushPayload): Promise<void> {
        const subscriptions = await this.subscriptions.listForUser(userId)
        if (subscriptions.length === 0) return

        const keys = await this.ensureKeys()
        const body = JSON.stringify(payload)
        const limit = Async.pLimit(PUSH_CONCURRENCY)

        await Promise.all(subscriptions.map((subscription) => limit(async () => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
                    },
                    body,
                    {
                        vapidDetails: {
                            subject: 'mailto:admin@example.com',
                            publicKey: keys.publicKey,
                            privateKey: keys.privateKey,
                        },
                        TTL: 24 * 60 * 60,
                    }
                )
            } catch (error) {
                const statusCode = (error as { statusCode?: number }).statusCode
                if (statusCode !== undefined && DEAD_ENDPOINT_STATUS.has(statusCode)) {
                    await this.subscriptions.deleteEndpoint(subscription.endpoint)
                }

            }
        })))
    }
}
