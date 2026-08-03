import { AssetKind, UploadFormat, UPLOAD_FORMATS } from 'types'

export type FormatKind = 'textures' | 'audio' | 'videos' | 'data' | 'plain' | 'fonts'

export const FORMAT_KINDS: FormatKind[] = ['textures', 'audio', 'videos', 'data', 'plain', 'fonts']

const KIND_EXTENSIONS: Record<FormatKind, string[]> = {
    textures: ['png', 'jpg', 'webp', 'ktx2'],
    audio: ['ogg', 'opus', 'mp3', 'wav', 'm4a'],
    videos: ['mp4', 'webm'],
    data: ['json', 'xml', 'csv'],
    plain: ['txt', 'md', 'html', 'css', 'js'],
    fonts: ['ttf', 'otf', 'fnt'],
}

export const KIND_ICONS: Record<FormatKind, string> = {
    textures: 'Image',
    audio: 'AudioLines',
    videos: 'Video',
    data: 'Braces',
    plain: 'FileText',
    fonts: 'Type',
}

export const KIND_COLORS: Record<FormatKind, string> = {
    textures: 'var(--kind-color-textures)',
    audio: 'var(--kind-color-audio)',
    videos: 'var(--kind-color-videos)',
    data: 'var(--kind-color-data)',
    plain: 'var(--kind-color-plain)',
    fonts: 'var(--kind-color-fonts)',
}

export const ASSET_KIND_TO_FORMAT_KIND: Record<AssetKind, FormatKind> = {
    'texture': 'textures',
    'normal-map': 'textures',
    'audio': 'audio',
    'video': 'videos',
    'data': 'data',
    'physics': 'data',
    'plain': 'plain',
    'font': 'fonts',
    'bitmap-font': 'fonts',
    'bitmap-font-page': 'textures',
}

export const EXTENSIONLESS_KINDS: readonly AssetKind[] = ['bitmap-font']

export const formatsFor = (kind: FormatKind): UploadFormat[] =>
    UPLOAD_FORMATS.filter((format) => KIND_EXTENSIONS[kind].includes(format.extension))
