import type {
    DesignField,
    DesignFormat,
    DesignLayer,
    DesignEntry,
    DesignKind,
    VideoFrame,
} from '../contracts/index.js'

export type FrameTemplateRow = {
    id: string
    owner_id: string
    name: string
    description: string
    format: DesignFormat
    background: string
    layers: DesignLayer[]
    fields: DesignField[]
    created_at: Date
    updated_at: Date
}

export type VideoTemplateRow = {
    id: string
    owner_id: string
    name: string
    description: string
    format: DesignFormat
    frames: VideoFrame[]
    created_at: Date
    updated_at: Date
}

export type DesignRow = {
    id: string
    owner_id: string
    name: string
    kind: DesignKind
    frame_template_id: string | null
    video_template_id: string | null
    template_name: string
    entries: DesignEntry[]
    file_id: string | null
    created_at: Date
    updated_at: Date
}
