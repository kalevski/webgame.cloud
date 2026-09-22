import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { WEBHOOK_ALLOW_PRIVATE } from '../env.js'

const v4Parts = (address: string): number[] => address.split('.').map(Number)

const isPrivateV4 = (address: string): boolean => {
    const [a = 0, b = 0] = v4Parts(address)
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 192 && b === 0) return true
    if (a === 100 && b >= 64 && b <= 127) return true
    if (a === 198 && (b === 18 || b === 19)) return true
    if (a >= 224) return true
    return false
}

const isPrivateV6 = (address: string): boolean => {
    const value = address.toLowerCase().split('%')[0] ?? ''
    if (value === '::' || value === '::1') return true

    const mapped = value.startsWith('::ffff:') ? value.slice(7) : ''
    if (mapped && isIP(mapped) === 4) return isPrivateV4(mapped)

    const head = parseInt(value.split(':')[0] || '0', 16)
    if ((head & 0xfe00) === 0xfc00) return true
    if ((head & 0xffc0) === 0xfe80) return true
    return false
}

export const isPrivateAddress = (address: string): boolean =>
    isIP(address) === 6 ? isPrivateV6(address) : isPrivateV4(address)

export type WebhookTargetRejection = 'scheme' | 'unresolvable' | 'private'

export const rejectWebhookTarget = async (raw: string): Promise<WebhookTargetRejection | null> => {
    let url: URL
    try {
        url = new URL(raw)
    } catch {
        return 'scheme'
    }

    if (WEBHOOK_ALLOW_PRIVATE) {
        return url.protocol === 'http:' || url.protocol === 'https:' ? null : 'scheme'
    }

    if (url.protocol !== 'https:') return 'scheme'

    const host = url.hostname.replace(/^\[|\]$/g, '')
    if (isIP(host)) return isPrivateAddress(host) ? 'private' : null

    let resolved: Array<{ address: string }>
    try {
        resolved = await lookup(host, { all: true })
    } catch {
        return 'unresolvable'
    }

    if (resolved.length === 0) return 'unresolvable'
    return resolved.some((entry) => isPrivateAddress(entry.address)) ? 'private' : null
}
