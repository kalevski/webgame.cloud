import type { WorkerHealth } from './contracts/index.js'

const STALE_FACTOR = 3

type Beat = { lastTickAt: number | null; intervalMs: number }

const beats = new Map<string, Beat>()

export const registerWorker = (name: string, intervalMs: number): void => {
    beats.set(name, { lastTickAt: null, intervalMs })
}

export const recordHeartbeat = (name: string): void => {
    const beat = beats.get(name)
    if (beat) beat.lastTickAt = Date.now()
}

export const unregisterWorker = (name: string): void => {
    beats.delete(name)
}

export const workerHealth = (): WorkerHealth[] =>
    [...beats.entries()].map(([name, beat]) => ({
        name,
        lastTickAt: beat.lastTickAt === null ? null : new Date(beat.lastTickAt).toISOString(),
        healthy: beat.lastTickAt === null || Date.now() - beat.lastTickAt < beat.intervalMs * STALE_FACTOR,
    }))

export const STARTED_AT = new Date().toISOString()
