import type { AssetKind } from '../contracts/index.js'
import { KIND_CHILDREN, UPLOAD_FORMATS } from '../contracts/index.js'

export const ALLOWED_UPLOAD_MIME: readonly string[] = UPLOAD_FORMATS.map((format) => format.mime)

export const CHILD_KINDS: readonly AssetKind[] = Object.values(KIND_CHILDREN).flat()

const DATA_MIME = new Set(['application/json', 'application/xml', 'text/csv'])

export const isAllowedMime = (mime: string): boolean =>
    ALLOWED_UPLOAD_MIME.includes(mime.trim().toLowerCase())

export const inferKind = (mime: string): AssetKind => {
    const value = mime.trim().toLowerCase()
    if (value.startsWith('image/')) return 'texture'
    if (value.startsWith('audio/')) return 'audio'
    if (value.startsWith('video/')) return 'video'
    if (value.startsWith('font/') || value === 'application/x-font-bmfont') return 'font'
    if (DATA_MIME.has(value)) return 'data'
    return 'plain'
}

export const childKindsOf = (parentKind: AssetKind): readonly AssetKind[] => KIND_CHILDREN[parentKind] ?? []

export const extensionOf = (name: string): string => {
    const dot = name.lastIndexOf('.')
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}
