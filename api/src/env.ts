import { env } from '@toolcase/node'

const normalizeOrigin = (value: string): string => {
    const trimmed = value.replace(/\/+$/, '')
    return trimmed && !/^https?:\/\//.test(trimmed) ? `https://${trimmed}` : trimmed
}

export const PORT = env('PORT', 6000, 'number')

export const CORS_ORIGIN = normalizeOrigin(env('CORS_ORIGIN', ''))

export const GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', '')
export const GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', '')

export const GOOGLE_SSO = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET)

export const DISCORD_CLIENT_ID = env('DISCORD_CLIENT_ID', '')
export const DISCORD_CLIENT_SECRET = env('DISCORD_CLIENT_SECRET', '')

export const DISCORD_SSO = Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET)

export const ANY_SSO = GOOGLE_SSO || DISCORD_SSO

export const DEV_LOGIN = env('DEV_LOGIN', '') === 'true' && !ANY_SSO

export const WEB_URL = normalizeOrigin(env('WEB_URL', '') || env('CORS_ORIGIN', ''))

export const API_URL = normalizeOrigin(env('API_URL', ''))

export const WORKSPACE_NAME = env('WORKSPACE_NAME', 'WebGame Cloud')

export const BUILD_SHA = env('BUILD_SHA', 'dev')

export const LOG_LEVEL = env('LOG_LEVEL', 'info')

export const DEBUG_SCOPES = env('DEBUG', '')

export const SIGNING_KEYS_DIR = env('SIGNING_KEYS_DIR', './keys')

export const SIGNING_ISSUER = env('SIGNING_ISSUER', '') || API_URL || WORKSPACE_NAME

export const SIGNING_TTL_SECONDS = env('SIGNING_TTL_SECONDS', 300, 'number')

export const DATABASE = {
    host: env('DATABASE_HOST', 'localhost'),
    port: env('DATABASE_PORT', 5432, 'number'),
    user: env('DATABASE_USER', '') || undefined,
    password: env('DATABASE_PASS', '') || undefined,
    database: env('DATABASE_NAME', 'starter'),
}
