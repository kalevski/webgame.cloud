import type { AnalyticsEvent } from 'configs/analytics'
import { STORAGE_PREFIX } from 'helpers/storage'

type Gtag = (command: string, ...args: unknown[]) => void

const getGtag = (): Gtag | null => {
    const gtag = (window as unknown as { gtag?: Gtag }).gtag
    return typeof gtag === 'function' ? gtag : null
}

const DEBUG = import.meta.env.VITE_GA_DEBUG === 'true'
const ENABLED = import.meta.env.PROD || DEBUG

const REDACTED: Array<[RegExp, string]> = [
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

export const AUTH_METHOD_KEY = `${STORAGE_PREFIX}:auth-method`

export type TrackParams = Record<string, string | number | boolean | undefined>

export const trackEvent = (name: AnalyticsEvent, params: TrackParams = {}): void => {
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

export const trackOnce = (key: string, name: AnalyticsEvent, params: TrackParams = {}): void => {
    if (seenThisPage.has(key)) return
    seenThisPage.add(key)
    trackEvent(name, params)
}

export const countBucket = (count: number): string => {
    if (count <= 0) return '0'
    if (count < 10) return '1_9'
    if (count < 50) return '10_49'
    if (count < 200) return '50_199'
    return '200_plus'
}

export const amountBucket = (cents: number): string => {
    if (cents <= 0) return 'none'
    const units = cents / 100
    if (units < 10) return 'under_10'
    if (units < 50) return '10_49'
    if (units < 200) return '50_199'
    if (units < 1000) return '200_999'
    return '1000_plus'
}

export const daysBucket = (days: number): string => {
    if (days < 1) return 'today'
    if (days < 7) return 'this_week'
    if (days < 30) return 'this_month'
    if (days < 365) return 'this_year'
    return 'older'
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
