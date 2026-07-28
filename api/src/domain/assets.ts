import type { AssetKind } from '../contracts/index.js'

export const ALLOWED_UPLOAD_MIME: readonly string[] = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/ktx2',
    'audio/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'application/json',
    'application/xml',
    'text/plain',
    'text/csv',
    'application/x-font-bmfont',
]

export const CHILD_KINDS: readonly AssetKind[] = ['normal-map', 'physics']

export const isAllowedMime = (mime: string): boolean =>
    ALLOWED_UPLOAD_MIME.includes(mime.trim().toLowerCase())

export const inferKind = (mime: string): AssetKind => {
    const value = mime.trim().toLowerCase()
    if (value.startsWith('image/')) return 'texture'
    if (value.startsWith('audio/')) return 'audio'
    if (value === 'application/json') return 'json'
    return 'text'
}

export const extensionOf = (name: string): string => {
    const dot = name.lastIndexOf('.')
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

export const resolveKind = (mime: string, requested: AssetKind | undefined, hasParent: boolean): AssetKind => {
    if (hasParent && requested) return requested
    return inferKind(mime)
}
