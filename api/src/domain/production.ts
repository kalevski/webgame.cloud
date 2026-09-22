import {
    ANY_SSO,
    API_URL,
    DATABASE_SSLMODE,
    DEV_LOGIN,
    IS_PRODUCTION,
    WEBHOOK_ALLOW_PRIVATE,
    WEB_URL,
} from '../env.js'

export const productionConfigProblems = (): string[] => {
    const problems: string[] = []

    if (DEV_LOGIN) problems.push('DEV_LOGIN is true — the dev email login must never be reachable in production')
    if (!ANY_SSO) problems.push('no OAuth provider is configured — set GOOGLE_CLIENT_* or DISCORD_CLIENT_*')
    if (WEBHOOK_ALLOW_PRIVATE) problems.push('WEBHOOK_ALLOW_PRIVATE is true — outbound webhooks could reach private addresses')
    if (DATABASE_SSLMODE === 'disable') problems.push('DATABASE_SSLMODE is disable — set require or a verify-* mode')
    if (!WEB_URL) problems.push('WEB_URL is unset — emailed links and OAuth callbacks are built from it')
    if (!API_URL) problems.push('API_URL is unset — OAuth callbacks are built from it')

    return problems
}

export const assertProductionConfig = (): void => {
    if (!IS_PRODUCTION) return

    const problems = productionConfigProblems()
    if (problems.length === 0) return

    throw new Error(`refusing to boot with APP_ENV=production:\n  - ${problems.join('\n  - ')}`)
}
