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

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':')) return false
    return host.includes('.')
}
