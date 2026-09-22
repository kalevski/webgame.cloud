import { env } from '@toolcase/node'

const normalizeOrigin = (value: string): string => {
    const trimmed = value.replace(/\/+$/, '')
    return trimmed && !/^https?:\/\//.test(trimmed) ? `https://${trimmed}` : trimmed
}

export const APP_ENV = env('APP_ENV', 'development')

export const IS_PRODUCTION = APP_ENV === 'production'

export const PORT = env('PORT', 6000, 'number')

export const CONTROL_PORT = env('CONTROL_PORT', 6010, 'number')

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

const WEBHOOK_PRIVATE_SETTING = env('WEBHOOK_ALLOW_PRIVATE', '')

export const WEBHOOK_ALLOW_PRIVATE = WEBHOOK_PRIVATE_SETTING === ''
    ? DEV_LOGIN
    : WEBHOOK_PRIVATE_SETTING === 'true'

export const SIGNING_KEYS_DIR = env('SIGNING_KEYS_DIR', './keys')

export const SIGNING_ISSUER = env('SIGNING_ISSUER', '') || API_URL || WORKSPACE_NAME

export const SIGNING_TTL_SECONDS = env('SIGNING_TTL_SECONDS', 300, 'number')

export const DATABASE_SSLMODE = env('DATABASE_SSLMODE', 'disable')

const sslOption = (mode: string): false | { rejectUnauthorized: boolean } => {
    if (mode === 'disable' || mode === 'allow' || mode === 'prefer') return false
    if (mode === 'no-verify' || mode === 'require') return { rejectUnauthorized: false }
    return { rejectUnauthorized: true }
}

export const DATABASE_POOL_MAX = env('DATABASE_POOL_MAX', 10, 'number')

export const DATABASE_STATEMENT_TIMEOUT_MS = env('DATABASE_STATEMENT_TIMEOUT_MS', 15_000, 'number')

export const DATABASE_SLOW_MS = env('DATABASE_SLOW_MS', 1_000, 'number')

export const DATABASE = {
    host: env('DATABASE_HOST', 'localhost'),
    port: env('DATABASE_PORT', 5432, 'number'),
    user: env('DATABASE_USER', '') || undefined,
    password: env('DATABASE_PASS', '') || undefined,
    database: env('DATABASE_NAME', 'starter'),
    ssl: sslOption(DATABASE_SSLMODE),
    max: DATABASE_POOL_MAX,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: DATABASE_STATEMENT_TIMEOUT_MS,
}
