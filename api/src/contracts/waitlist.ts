export const WAITLIST_CONSENT_VERSION = 'waitlist-2026-07'

export const WAITLIST_GRANT_BYTES = 262_144_000

export type WaitlistSignupDraft = {
    email: string
    marketingOptIn?: boolean
    consentVersion?: string
    source?: string
    website?: string
}

export type WaitlistSignup = {
    id: string
    email: string
    marketingOptIn: boolean
    consentVersion: string
    source: string
    grantedBytes: number
    claimedAt: string | null
    createdAt: string
}

export type WaitlistStats = {
    total: number
    claimed: number
}
