const PREFIX = 'starter'

export const readFromStorage = <T>(key: string, fallback: T): T => {
    try {
        const raw = window.localStorage.getItem(`${PREFIX}:${key}`)
        if (raw === null) return fallback
        return JSON.parse(raw) as T
    } catch {
        return fallback
    }
}

export const writeToStorage = <T>(key: string, value: T): void => {
    try {
        window.localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
    } catch {
    }
}

export const removeFromStorage = (key: string): void => {
    try {
        window.localStorage.removeItem(`${PREFIX}:${key}`)
    } catch {
    }
}
