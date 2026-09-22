export type Slot<T> = {
    value: T | null
    expiresAt: number
    inflight: Promise<T> | null
}

export const slot = <T>(): Slot<T> => ({ value: null, expiresAt: 0, inflight: null })

export const fromSlot = async <T>(target: Slot<T>, ttlMs: number, load: () => Promise<T>): Promise<T> => {
    if (target.value !== null && target.expiresAt > Date.now()) return target.value
    if (target.inflight) return target.inflight

    const inflight = load()
        .then((value) => {
            target.value = value
            target.expiresAt = Date.now() + ttlMs
            return value
        })
        .finally(() => {
            target.inflight = null
        })

    target.inflight = inflight
    return inflight
}

export const dropSlot = <T>(target: Slot<T>): void => {
    target.value = null
    target.expiresAt = 0
}

type Entry<T> = { value: T; expiresAt: number }

export class KeyedCache<T> {
    private entries = new Map<string, Entry<T>>()

    private inflight = new Map<string, Promise<T>>()

    constructor(private ttlMs: number, private max = 1000) {}

    async get(key: string, load: () => Promise<T>): Promise<T> {
        const entry = this.entries.get(key)
        if (entry && entry.expiresAt > Date.now()) return entry.value

        const pending = this.inflight.get(key)
        if (pending) return pending

        const loading = load()
            .then((value) => {
                if (this.entries.size >= this.max) this.entries.clear()
                this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs })
                return value
            })
            .finally(() => {
                this.inflight.delete(key)
            })

        this.inflight.set(key, loading)
        return loading
    }

    drop(key: string): void {
        this.entries.delete(key)
    }

    clear(): void {
        this.entries.clear()
    }

    get size(): number {
        return this.entries.size
    }
}

export class Throttle {
    private seen = new Map<string, number>()

    constructor(private intervalMs: number, private max = 10_000) {}

    due(key: string): boolean {
        const last = this.seen.get(key) ?? 0
        if (Date.now() - last < this.intervalMs) return false
        if (this.seen.size >= this.max) this.seen.clear()
        this.seen.set(key, Date.now())
        return true
    }

    forget(key: string): void {
        this.seen.delete(key)
    }
}
