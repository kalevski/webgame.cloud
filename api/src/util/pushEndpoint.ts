import { isIP } from 'node:net'

export const isAllowedPushEndpoint = (endpoint: string): boolean => {
    let url: URL
    try {
        url = new URL(endpoint)
    } catch {
        return false
    }
    if (url.protocol !== 'https:' || url.username || url.password) return false
    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false

    const literal = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
    if (isIP(literal) !== 0) return false
    return host.includes('.')
}
