export const SIGNING_KEYS = [

    'partner_api',
    'realm_upload',
    'realm_transfer',
] as const

export type SigningKeyName = typeof SIGNING_KEYS[number]

export const SIGNING_KEY_LABELS: Record<SigningKeyName, string> = {
    partner_api: 'Partner API',
    realm_upload: 'Realm upload',
    realm_transfer: 'Realm transfer',
}

export const SIGNING_ALGORITHM = 'RS256'

export const SIGNING_MAX_TTL_SECONDS = 86400

export type SigningKey = {
    name: SigningKeyName
    label: string

    kid: string
    algorithm: string

    publicKey: string

    createdAt: string

    retiredKids: string[]
}

export type SignedToken = {
    token: string
    kid: string
    expiresAt: string
}

export type SignOptions = {
    expiresInSeconds?: number
    audience?: string
    subject?: string
}
