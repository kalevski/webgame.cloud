type Entry<T> = {
    value: T | null
    expiresAt: number
    inflight: Promise<T> | null
}

const slots = new Map<string, Entry<unknown>>()

const entryFor = <T>(key: string): Entry<T> => {
    const existing = slots.get(key) as Entry<T> | undefined
    if (existing) return existing
    const created: Entry<T> = { value: null, expiresAt: 0, inflight: null }
    slots.set(key, created as Entry<unknown>)
    return created
}

export type SlotOptions = {
    ttlMs?: number

    force?: boolean
}

export const fromSlot = async <T>(
    key: string,
    load: () => Promise<T>,
    options: SlotOptions = {}
): Promise<T> => {
    const entry = entryFor<T>(key)
    const ttlMs = options.ttlMs ?? 0

    if (!options.force) {
        if (ttlMs > 0 && entry.value !== null && entry.expiresAt > Date.now()) return entry.value
        if (entry.inflight) return entry.inflight
    }

    const inflight = load()
        .then((value) => {
            entry.value = ttlMs > 0 ? value : null
            entry.expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0
            return value
        })
        .finally(() => {
            entry.inflight = null
        })

    entry.inflight = inflight
    return inflight
}

export const dropSlot = (key: string): void => {
    slots.delete(key)
}


