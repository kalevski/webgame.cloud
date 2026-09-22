export const STORAGE_PREFIX = 'starter'

export const readFromStorage = <T>(key: string, fallback: T): T => {
    try {
        const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${key}`)
        if (raw === null) return fallback
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

export const writeToStorage = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(value))
    } catch {
    }
}

export const removeFromStorage = (key: string): void => {
    try {
        window.localStorage.removeItem(`${STORAGE_PREFIX}:${key}`)
    } catch {
    }
}
