import { inject, injectable } from 'tsyringe'
import type { User, WaitlistSignup, WaitlistSignupDraft, WaitlistStats } from '../contracts/index.js'
import { BYTES_PER_MB, WAITLIST_CONSENT_VERSION } from '../contracts/index.js'
import { ValidationError } from '../domain/errors.js'
import { WaitlistRepository, type WaitlistRow } from '../repositories/waitlist/WaitlistRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { getLogger } from '../logging.js'

const log = getLogger('waitlist')

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const toSignup = (row: WaitlistRow): WaitlistSignup => ({
    id: row.id,
    email: row.email,
    marketingOptIn: row.marketing_opt_in,
    consentVersion: row.consent_version,
    source: row.source,
    grantedBytes: Number(row.granted_bytes ?? 0),
    claimedAt: row.claimed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})

@injectable()
export class WaitlistService {
    constructor(
        @inject(WaitlistRepository) private waitlist: WaitlistRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    async signup(draft: WaitlistSignupDraft): Promise<void> {
        if (draft.website) return

        const email = draft.email?.trim().toLowerCase() ?? ''
        if (!EMAIL.test(email)) {
            throw new ValidationError('email_invalid', 'that is not a valid address', [email])
        }

        await this.waitlist.upsertSignup({
            email,
            marketingOptIn: draft.marketingOptIn ?? false,
            consentVersion: draft.consentVersion ?? WAITLIST_CONSENT_VERSION,
            source: draft.source?.trim() || 'landing',
        })
    }

    async list(query: { limit?: number; offset?: number; cursor?: string }): Promise<WaitlistSignup[]> {
        const [createdAt, id] = (query.cursor ?? '').split('|')
        const rows = await this.waitlist.list({
            limit: query.limit,
            offset: query.offset,
            cursorCreatedAt: createdAt || undefined,
            cursorId: id || undefined,
        })
        return rows.map(toSignup)
    }

    async stats(): Promise<WaitlistStats> {
        return this.waitlist.stats()
    }

    async claimGrant(user: User): Promise<boolean> {
        const row = await this.waitlist.findByEmail(user.email).catch(() => undefined)
        if (!row) return false

        const grantMb = Math.ceil(Number(row.granted_bytes ?? 0) / BYTES_PER_MB)
        if (grantMb <= 0) return false

        const overrides = await this.access.getUserOverrides(user.id)
        const planLimits = await this.access.limitsFor(user)
        const planMb = planLimits.storage_mb
        const target = planMb === null ? null : Math.max(planMb, grantMb)

        if (overrides.limits.storage_mb === target) {
            if (!row.claimed_at) await this.waitlist.markClaimed(row.id, user.id)
            return true
        }

        await this.access.saveUserOverrides(user.id, {
            permissions: overrides.permissions,
            limits: { ...overrides.limits, storage_mb: target },
        })
        await this.waitlist.markClaimed(row.id, user.id)
        log.info('applied waitlist storage grant', { userId: user.id, storageMb: target })
        return true
    }

    async grantTo(signupId: string, user: User): Promise<void> {
        const row = await this.waitlist.findById(signupId)
        if (!row) throw new ValidationError('not_found', 'no such signup', [signupId])
        await this.waitlist.markClaimed(row.id, user.id)

        const grantMb = Math.ceil(Number(row.granted_bytes ?? 0) / BYTES_PER_MB)
        const overrides = await this.access.getUserOverrides(user.id)
        const planLimits = await this.access.limitsFor(user)
        const planMb = planLimits.storage_mb
        await this.access.saveUserOverrides(user.id, {
            permissions: overrides.permissions,
            limits: { ...overrides.limits, storage_mb: planMb === null ? null : Math.max(planMb, grantMb) },
        })
    }
}
