type Gtag = (command: string, ...args: unknown[]) => void

const getGtag = (): Gtag | null => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    return typeof gtag === 'function' ? gtag : null
}

const DEBUG = import.meta.env.VITE_GA_DEBUG === 'true'
const ENABLED = import.meta.env.PROD || DEBUG

const REDACTED: Array<[RegExp, string]> = [
    [/^\/projects\/[^/]+/, '/projects/:id'],
]

export const normalizePath = (path: string): string => {
    for (const [pattern, replacement] of REDACTED) {
        if (pattern.test(path)) return path.replace(pattern, replacement)
    }
    return path
}

const seenThisPage = new Set<string>()

export const trackPageView = (path: string): void => {
    seenThisPage.clear()
    const gtag = getGtag()
    if (!gtag || !ENABLED) return
    gtag('set', {
        page_location: window.location.origin + normalizePath(path),
        page_title: document.title,
    })
    gtag('event', 'page_view')
}

export const AUTH_METHOD_KEY = 'starter:auth-method'

export type TrackParams = Record<string, string | number | boolean | undefined>

export const trackEvent = (name: string, params: TrackParams = {}): void => {
    const gtag = getGtag()
    if (!gtag || !ENABLED) return
    const clean: TrackParams = {}
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) clean[key] = value
    }
    gtag('event', name, clean)
}

const PATH_WORD = /^[a-z][a-z-]{0,19}$/

export const normalizeEndpoint = (path: string): string =>
    path
        .split('?')[0]
        .split('/')
        .map((segment, index) => (index === 0 || PATH_WORD.test(segment) ? segment : ':id'))
        .join('/')

export const trackOnce = (key: string, name: string, params: TrackParams = {}): void => {
    if (seenThisPage.has(key)) return
    seenThisPage.add(key)
    trackEvent(name, params)
}

export type AnalyticsIdentity = {
    userId: string
    roleSlot: 'owner' | 'member'
    isPaid: boolean

    signupCohort: string
}

export const setAnalyticsUser = (identity: AnalyticsIdentity | null): void => {
    const gtag = getGtag()
    if (!gtag || !ENABLED) return
    gtag('set', { user_id: identity?.userId ?? null })
    gtag('set', 'user_properties', {
        role_slot: identity?.roleSlot ?? null,
        is_paid: identity ? (identity.isPaid ? 'yes' : 'no') : null,
        signup_cohort: identity?.signupCohort ?? null,
    })
}

export const initAnalytics = (): void => {
    if (DEBUG) getGtag()?.('set', { debug_mode: true })

    const src = import.meta.env.VITE_ANALYTICS_SRC as string | undefined
    if (!src) return
    const script = document.createElement('script')
    script.defer = true
    script.src = src
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined
    const domain = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined
    if (websiteId) script.dataset.websiteId = websiteId
    if (domain) script.dataset.domain = domain
    document.head.appendChild(script)
}
