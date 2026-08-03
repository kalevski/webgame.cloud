import type { User } from './contracts/index.js'
import container from './container.js'
import { AuditRepository } from './repositories/moderation/AuditRepository.js'
import { EmailService } from './services/EmailService.js'
import { FeatureService } from './services/FeatureService.js'
import { JobService } from './services/JobService.js'
import { WebhookService } from './services/WebhookService.js'
import { JOB_WEBHOOK_DELIVERY } from './jobs.js'

const SYSTEM_ACTOR: User = {
    id: 'system',
    email: 'system@local',
    name: 'System',
    picture: '',
    role: 'system',
    kind: 'human',
    active: true,
    verified: true,
    consentedAt: null,
    createdAt: new Date(0).toISOString(),
}

export const recordAudit = async (
    rawActor: User | null,
    action: string,
    targetId: string,
    detail = '',
    requestId = ''
): Promise<void> => {
    const actor = rawActor ?? SYSTEM_ACTOR
    await container.resolve(AuditRepository).record(
        rawActor ? actor.id : null,
        actor.name || actor.email,
        action,
        targetId,
        detail,
        requestId
    )

    try {
        if (await container.resolve(FeatureService).isEnabled('email')) {
            await container.resolve(EmailService).handleAuditEvent(actor, action, targetId, detail)
        }
    } catch {
    }

    try {
        const deliveryIds = await container.resolve(WebhookService)
            .queueForAction(actor, action, targetId, detail)
        const jobs = container.resolve(JobService)
        for (const deliveryId of deliveryIds) {
            await jobs.enqueue({ kind: JOB_WEBHOOK_DELIVERY, payload: { deliveryId } })
        }
    } catch {
    }
}
