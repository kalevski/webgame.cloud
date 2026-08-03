export const DESIGN_FORMATS = ['post', 'portrait', 'story', 'wide', 'pin'] as const

export type DesignFormat = typeof DESIGN_FORMATS[number]

export const DESIGN_FORMAT_SIZES: Record<DesignFormat, { width: number; height: number }> = {
    post: { width: 1080, height: 1080 },
    portrait: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
    wide: { width: 1920, height: 1080 },
    pin: { width: 1080, height: 1620 },
}

export const DESIGN_LAYER_KINDS = ['rect', 'ellipse', 'gradient', 'text', 'image'] as const

export type DesignLayerKind = typeof DESIGN_LAYER_KINDS[number]

export const DESIGN_FONTS = ['sans', 'serif', 'mono'] as const

export type DesignFont = typeof DESIGN_FONTS[number]

export const DESIGN_ALIGNMENTS = ['left', 'center', 'right'] as const

export type DesignAlignment = typeof DESIGN_ALIGNMENTS[number]

export const DESIGN_IMAGE_FITS = ['cover', 'contain'] as const

export type DesignImageFit = typeof DESIGN_IMAGE_FITS[number]

export const DESIGN_GRADIENT_DIRECTIONS = ['down', 'up', 'right', 'left'] as const

export type DesignGradientDirection = typeof DESIGN_GRADIENT_DIRECTIONS[number]

export const DESIGN_TRANSITIONS = [
    'cut',
    'fade',
    'slide',
    'slideUp',
    'wipe',
    'zoom',
    'iris',
    'blinds',
    'flip',
] as const

export type DesignTransition = typeof DESIGN_TRANSITIONS[number]

export const DESIGN_FIELD_KINDS = ['text', 'multiline', 'image'] as const

export type DesignFieldKind = typeof DESIGN_FIELD_KINDS[number]

export type DesignField = {
    key: string
    label: string
    kind: DesignFieldKind

    sample: string

    source: string
    sourceField: string
}

export const DESIGN_KINDS = ['frame', 'video'] as const

export type DesignKind = typeof DESIGN_KINDS[number]

export type DesignEntry = {
    frameTemplateId: string
    frameName: string

    values: Record<string, string>
}

export type Design = {
    id: string
    ownerId: string

    name: string
    kind: DesignKind

    frameTemplateId: string | null
    videoTemplateId: string | null
    templateName: string

    entries: DesignEntry[]

    fileId: string | null

    createdAt: string
    updatedAt: string
}

export type DesignDraft = {
    name: string
    kind?: DesignKind
    frameTemplateId?: string | null
    videoTemplateId?: string | null
    entries?: Array<{ frameTemplateId: string; values?: Record<string, string> }>
    fileId?: string | null
}

export type DesignSourceField = {
    key: string
    label: string
}

export type DesignSourceInfo = {
    id: string
    label: string
    itemLabel: string

    fields: DesignSourceField[]
}

export type DesignSourceItem = {
    id: string
    label: string
}

export type DesignLayer = {
    id: string
    kind: DesignLayerKind

    x: number
    y: number
    width: number
    height: number

    field: string

    text: string
    font: DesignFont
    fontSize: number
    fontWeight: number
    align: DesignAlignment
    lineHeight: number
    uppercase: boolean
    letterSpacing: number

    color: string
    opacity: number
    radius: number

    fit: DesignImageFit

    gradientTo: string
    gradientDirection: DesignGradientDirection

    css: string
}

export type FrameTemplate = {
    id: string
    ownerId: string

    name: string
    description: string
    format: DesignFormat
    background: string

    layers: DesignLayer[]
    fields: DesignField[]

    createdAt: string
    updatedAt: string
}

export type FrameTemplateDraft = {
    name: string
    description?: string
    format?: DesignFormat
    background?: string
    layers?: DesignLayer[]
    fields?: DesignField[]
}

export type VideoFrame = {
    id: string

    frameTemplateId: string
    frameName: string

    position: number
    durationMs: number
    transition: DesignTransition

    values: Record<string, string>
}

export type VideoFrameDraft = {
    frameTemplateId: string
    durationMs?: number
    transition?: DesignTransition
    values?: Record<string, string>
}

export type VideoTemplate = {
    id: string
    ownerId: string

    name: string
    description: string
    format: DesignFormat

    frames: VideoFrame[]

    totalMs: number
    createdAt: string
    updatedAt: string
}

export type VideoTemplateDraft = {
    name: string
    description?: string
    format?: DesignFormat
    frames?: VideoFrameDraft[]
}

export const DESIGN_LAYER_LIMIT = 40
export const DESIGN_FIELD_LIMIT = 20
export const DESIGN_FRAME_LIMIT = 30

export const DESIGN_DURATION_BOUNDS = { min: 500, max: 15_000, default: 3_000 } as const

export const designLayerDefaults = (kind: DesignLayerKind): Omit<DesignLayer, 'id'> => ({
    kind,
    x: 10,
    y: 10,
    width: 80,
    height: kind === 'text' ? 14 : 30,
    field: '',
    text: kind === 'text' ? 'Text' : '',
    font: 'sans',
    fontSize: 64,
    fontWeight: 600,
    align: 'left',
    lineHeight: 1.25,
    uppercase: false,
    letterSpacing: 0,
    color: kind === 'text' ? '#18181b' : '#7c3aed',
    opacity: 1,
    radius: 0,
    fit: 'cover',
    gradientTo: '#000000',
    gradientDirection: 'down',
    css: '',
})

export const designTotalMs = (frames: ReadonlyArray<{ durationMs: number }>): number =>
    frames.reduce((total, frame) => total + frame.durationMs, 0)
