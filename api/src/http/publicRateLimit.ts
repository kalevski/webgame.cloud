import type { FastifyReply, FastifyRequest } from 'fastify'
import { encodeErrorCause } from '../contracts/index.js'

const RATE = 20
const BURST = 100
const REFILL_MS = 1000

type Bucket = {
    tokens: number
    at: number
}

const buckets = new Map<string, Bucket>()

export const publicRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const now = Date.now()
    const key = request.ip

    if (buckets.size > 50_000) buckets.clear()

    const bucket = buckets.get(key) ?? { tokens: BURST, at: now }
    const refill = ((now - bucket.at) / REFILL_MS) * RATE
    bucket.tokens = Math.min(BURST, bucket.tokens + refill)
    bucket.at = now

    if (bucket.tokens < 1) {
        buckets.set(key, bucket)
        reply.code(429).send({ error: encodeErrorCause('rate_limited') })
        return reply
    }

    bucket.tokens -= 1
    buckets.set(key, bucket)
}

type CacheEntry = {
    value: unknown
    at: number
}

const cache = new Map<string, CacheEntry>()

export const CACHE_TTL_MS = 30_000

export const cached = async <T>(key: string, load: () => Promise<T>): Promise<T> => {
    const now = Date.now()
    const hit = cache.get(key)
    if (hit && now - hit.at < CACHE_TTL_MS) return hit.value as T

    const value = await load()
    if (cache.size > 10_000) cache.clear()
    cache.set(key, { value, at: now })
    return value
}
