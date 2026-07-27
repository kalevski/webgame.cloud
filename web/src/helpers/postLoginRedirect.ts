import { readFromStorage, removeFromStorage, writeToStorage } from 'helpers/storage'

const KEY = 'post-login-redirect'

export const savePostLoginRedirect = (path: string): void => writeToStorage(KEY, path)

export const consumePostLoginRedirect = (): string | null => {
    const path = readFromStorage<string | null>(KEY, null)
    if (path) removeFromStorage(KEY)

    return path && path.startsWith('/') ? path : null
}
