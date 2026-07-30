import { ApiError, parseErrorCause } from '@webgame-cloud/api/contracts'
import { EVENT } from 'configs/analytics'
import { STRINGS } from 'configs/strings'
import { normalizeEndpoint, trackEvent } from 'helpers/analytics'

const API_BASE = String(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export const apiUrl = (path: string): string => `${API_BASE}${path}`

type RestEnvelope<T> = { status: 'OK'; code: number; count?: number; data: T }
type RestErrorBody = { status: 'rejected'; cause: string }

const resolveErrorMessage = (cause: string): string => {
    const { code, params } = parseErrorCause(cause)
    const template = (STRINGS.errors as Record<string, string | ((...args: string[]) => string) | undefined>)[code]
    if (typeof template === 'function') return template(...params)
    if (typeof template === 'string') return template
    return STRINGS.errors.fallback
}

const unwrapError = (body: unknown, fallback: string): string => {
    if (typeof body !== 'object' || body === null) return fallback
    const rest = body as Partial<RestErrorBody> & Partial<ApiError>

    const cause = rest.cause ?? rest.error
    return cause ? resolveErrorMessage(cause) : fallback
}

let onUnexpectedForbidden: (() => void) | null = null

export const setForbiddenHandler = (handler: () => void): void => {
    onUnexpectedForbidden = handler
}

const RETRY_DELAYS_MS = [300, 900]

const SAFE_METHODS = new Set(['GET', 'HEAD'])

const sleep = (ms: number): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms) })

const fetchWithRetry = async (url: string, init: RequestInit): Promise<Response> => {
    const method = (init.method ?? 'GET').toUpperCase()

    const retries = SAFE_METHODS.has(method) ? RETRY_DELAYS_MS.length : 0

    for (let attempt = 0; ; attempt += 1) {
        try {
            return await fetch(url, init)
        } catch (error) {
            if (attempt >= retries) throw error

            await sleep(RETRY_DELAYS_MS[attempt]!)
        }
    }
}

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let response: Response
    try {
        response = await fetchWithRetry(`${API_BASE}${path}`, {
            headers: init?.body ? { 'content-type': 'application/json' } : undefined,

            credentials: API_BASE ? 'include' : 'same-origin',
            ...init,
        })
    } catch {
        trackEvent(EVENT.API_ERROR, {
            status: 0,
            endpoint: normalizeEndpoint(path),
            method: init?.method ?? 'GET',
        })
        throw new Error(STRINGS.network.unreachable)
    }
    if (!response.ok) {
        if (response.status === 403) onUnexpectedForbidden?.()

        trackEvent(EVENT.API_ERROR, {
            status: response.status,
            endpoint: normalizeEndpoint(path),
            method: init?.method ?? 'GET',
        })
        let message = `${init?.method ?? 'GET'} ${path} failed with ${response.status}`
        try {
            message = unwrapError(await response.json(), message)
        } catch {
        }
        throw new Error(message)
    }
    if (response.status === 204) return undefined as T

    const body = (await response.json()) as RestEnvelope<T> | T

    if (typeof body === 'object' && body !== null && 'status' in body && 'data' in body) {
        return (body as RestEnvelope<T>).data
    }
    return body as T
}
