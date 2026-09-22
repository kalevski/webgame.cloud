const value = (key: string, fallback = ''): string => process.env[key]?.trim() || fallback

const CONTROL_PORT = value('CONTROL_PORT', '6010')

export const CONTROL_URL = value('CONTROL_URL', `http://127.0.0.1:${CONTROL_PORT}`)

type Envelope<T> = { status: string; data?: T; cause?: string }

export type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
    query?: Record<string, string | number | undefined>
}

export const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const url = new URL(path, CONTROL_URL)
    for (const [key, entry] of Object.entries(options.query ?? {})) {
        if (entry !== undefined && entry !== '') url.searchParams.set(key, String(entry))
    }

    let response: Response
    try {
        response = await fetch(url, {
            method: options.method ?? 'GET',
            headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
            body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
            signal: AbortSignal.timeout(15_000),
        })
    } catch {
        throw new Error(
            `cannot reach the api service at ${CONTROL_URL} — `
            + 'the control API listens on 127.0.0.1 inside the service process, '
            + 'so run this command inside the container (docker exec <container> webgame-api ...) '
            + 'or set CONTROL_URL'
        )
    }

    const envelope = await response.json().catch(() => null) as Envelope<T> | null
    if (!envelope || envelope.status !== 'OK' || envelope.data === undefined) {
        const cause = envelope?.cause ?? `http ${response.status}`
        throw new Error(`request failed: ${cause}`)
    }

    return envelope.data
}
