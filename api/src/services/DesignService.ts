import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type {
    FrameTemplate,
    FrameTemplateDraft,
    DesignField,
    DesignLayer,
    Design,
    DesignDraft,
    DesignEntry,
    User,
    VideoFrameDraft,
    VideoTemplate,
    VideoTemplateDraft,
} from '../contracts/index.js'
import {
    DESIGN_DURATION_BOUNDS,
    DESIGN_FIELD_LIMIT,
    DESIGN_FRAME_LIMIT,
    DESIGN_LAYER_LIMIT,
    designLayerDefaults,
    designTotalMs,
} from '../contracts/index.js'
import { FrameTemplateRepository } from '../repositories/designs/FrameTemplateRepository.js'
import { DesignRepository } from '../repositories/designs/DesignRepository.js'
import { VideoTemplateRepository, type VideoFrameInput } from '../repositories/designs/VideoTemplateRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import type { FrameTemplateRow, DesignRow, VideoTemplateRow } from '../schema/designs.js'

const normaliseLayers = (layers: DesignLayer[] | undefined): DesignLayer[] =>
    (layers ?? []).slice(0, DESIGN_LAYER_LIMIT).map((layer) => ({
        ...designLayerDefaults(layer.kind),
        ...layer,
        id: layer.id || randomUUID(),
    }))

const normaliseFields = (fields: DesignField[] | undefined): DesignField[] => {
    const seen = new Set<string>()
    return (fields ?? []).slice(0, DESIGN_FIELD_LIMIT).flatMap((field) => {
        const key = field.key.trim()
        if (!key || seen.has(key)) return []
        seen.add(key)
        return [{
            key,
            label: field.label.trim() || key,
            kind: field.kind,
            sample: field.sample ?? '',
            source: field.source ?? '',
            sourceField: field.sourceField ?? '',
        }]
    })
}

const toFrameTemplate = (row: FrameTemplateRow): FrameTemplate => ({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    format: row.format,
    background: row.background,
    layers: normaliseLayers(row.layers),
    fields: normaliseFields(row.fields),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

const toVideoTemplate = (row: VideoTemplateRow): VideoTemplate => {
    const frames = row.frames ?? []
    return {
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        description: row.description,
        format: row.format,
        frames,
        totalMs: designTotalMs(frames),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    }
}

const toDesign = (row: DesignRow): Design => ({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    kind: row.kind,
    frameTemplateId: row.frame_template_id,
    videoTemplateId: row.video_template_id,
    templateName: row.template_name,
    entries: row.entries ?? [],
    fileId: row.file_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
})

const clampDuration = (value: number | undefined): number => {
    const raw = value ?? DESIGN_DURATION_BOUNDS.default
    return Math.min(DESIGN_DURATION_BOUNDS.max, Math.max(DESIGN_DURATION_BOUNDS.min, Math.round(raw)))
}

@injectable()
export class DesignService {
    constructor(
        @inject(FrameTemplateRepository) private frames: FrameTemplateRepository,
        @inject(VideoTemplateRepository) private videos: VideoTemplateRepository,
        @inject(DesignRepository) private renders: DesignRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    async listFrames(ownerId: string): Promise<FrameTemplate[]> {
        const rows = await this.frames.listForOwner(ownerId)
        return rows.map(toFrameTemplate)
    }

    async getFrame(id: string): Promise<FrameTemplate | null> {
        const row = await this.frames.findById(id)
        return row ? toFrameTemplate(row) : null
    }

    async createFrame(user: User, draft: FrameTemplateDraft): Promise<FrameTemplate> {
        if (!draft.name.trim()) throw new ValidationError('design_name_required', 'a template needs a name')
        await this.access.assertWithinLimit(user, 'design_templates')

        const row = await this.frames.create(user.id, {
            name: draft.name.trim(),
            description: draft.description?.trim() ?? '',
            format: draft.format ?? 'story',
            background: draft.background ?? '#ffffff',
            layers: normaliseLayers(draft.layers),
            fields: normaliseFields(draft.fields),
        })
        return toFrameTemplate(row)
    }

    async updateFrame(id: string, current: FrameTemplate, draft: Partial<FrameTemplateDraft>): Promise<FrameTemplate> {
        const name = (draft.name ?? current.name).trim()
        if (!name) throw new ValidationError('design_name_required', 'a template needs a name')

        const row = await this.frames.updateFields(id, {
            name,
            description: (draft.description ?? current.description).trim(),
            format: draft.format ?? current.format,
            background: draft.background ?? current.background,
            layers: draft.layers !== undefined ? normaliseLayers(draft.layers) : current.layers,
            fields: draft.fields !== undefined ? normaliseFields(draft.fields) : current.fields,
        })
        if (!row) throw new NotFoundError('frame_template_not_found', `frame template ${id} not found`, [id])
        return toFrameTemplate(row)
    }

    async removeFrame(id: string): Promise<void> {
        const usage = await this.frames.countUsage(id)
        if (usage > 0) {
            throw new ConflictError(
                'frame_template_in_use',
                `frame template ${id} is used by ${usage} video frame(s)`,
                [String(usage)]
            )
        }
        const removed = await this.frames.remove(id)
        if (!removed) throw new NotFoundError('frame_template_not_found', `frame template ${id} not found`, [id])
    }

    async listVideos(ownerId: string): Promise<VideoTemplate[]> {
        const rows = await this.videos.listForOwner(ownerId)
        return rows.map(toVideoTemplate)
    }

    async getVideo(id: string): Promise<VideoTemplate | null> {
        const row = await this.videos.findById(id)
        return row ? toVideoTemplate(row) : null
    }

    private async resolveFrames(
        ownerId: string,
        format: string,
        drafts: VideoFrameDraft[] | undefined
    ): Promise<VideoFrameInput[]> {
        const wanted = (drafts ?? []).slice(0, DESIGN_FRAME_LIMIT)
        if (wanted.length === 0) return []

        const owned = await this.frames.listForOwner(ownerId)
        const byId = new Map(owned.map((row) => [row.id, row]))

        return wanted.map((draft) => {
            const frame = byId.get(draft.frameTemplateId)
            if (!frame) {
                throw new NotFoundError(
                    'frame_template_not_found',
                    `frame template ${draft.frameTemplateId} not found`,
                    [draft.frameTemplateId]
                )
            }
            if (frame.format !== format) {
                throw new ValidationError(
                    'design_format_mismatch',
                    `frame ${frame.name} is ${frame.format}, video is ${format}`,
                    [frame.name, frame.format, format]
                )
            }
            return {
                frameTemplateId: draft.frameTemplateId,
                durationMs: clampDuration(draft.durationMs),
                transition: draft.transition ?? 'fade',
                values: draft.values ?? {},
            }
        })
    }

    async createVideo(user: User, draft: VideoTemplateDraft): Promise<VideoTemplate> {
        if (!draft.name.trim()) throw new ValidationError('design_name_required', 'a template needs a name')
        await this.access.assertWithinLimit(user, 'design_templates')

        const format = draft.format ?? 'story'
        const frames = await this.resolveFrames(user.id, format, draft.frames)
        const row = await this.videos.create(
            user.id,
            { name: draft.name.trim(), description: draft.description?.trim() ?? '', format },
            frames
        )
        return toVideoTemplate(row)
    }

    async updateVideo(
        id: string,
        current: VideoTemplate,
        draft: Partial<VideoTemplateDraft>
    ): Promise<VideoTemplate> {
        const name = (draft.name ?? current.name).trim()
        if (!name) throw new ValidationError('design_name_required', 'a template needs a name')

        const format = draft.format ?? current.format
        const frames = await this.resolveFrames(
            current.ownerId,
            format,
            draft.frames ?? current.frames.map((frame) => ({
                frameTemplateId: frame.frameTemplateId,
                durationMs: frame.durationMs,
                transition: frame.transition,
                values: frame.values,
            }))
        )
        const row = await this.videos.updateFields(
            id,
            { name, description: (draft.description ?? current.description).trim(), format },
            frames
        )
        if (!row) throw new NotFoundError('video_template_not_found', `video template ${id} not found`, [id])
        return toVideoTemplate(row)
    }

    async listRenders(ownerId: string): Promise<Design[]> {
        const rows = await this.renders.listForOwner(ownerId)
        return rows.map(toDesign)
    }

    async getRender(id: string): Promise<Design | null> {
        const row = await this.renders.findById(id)
        return row ? toDesign(row) : null
    }

    private async seedEntries(
        ownerId: string,
        draft: DesignDraft
    ): Promise<{ kind: 'frame' | 'video'; entries: DesignEntry[] }> {
        if (draft.videoTemplateId) {
            const video = await this.getVideo(draft.videoTemplateId)
            if (!video || video.ownerId !== ownerId) {
                throw new NotFoundError('video_template_not_found', 'video template not found', [
                    draft.videoTemplateId,
                ])
            }
            return {
                kind: 'video',
                entries: video.frames.map((frame) => ({
                    frameTemplateId: frame.frameTemplateId,
                    frameName: frame.frameName,
                    values: { ...frame.values },
                })),
            }
        }

        if (!draft.frameTemplateId) {
            throw new ValidationError('design_frames_required', 'a render needs a template')
        }
        const frame = await this.getFrame(draft.frameTemplateId)
        if (!frame || frame.ownerId !== ownerId) {
            throw new NotFoundError('frame_template_not_found', 'frame template not found', [
                draft.frameTemplateId,
            ])
        }
        return {
            kind: 'frame',
            entries: [{ frameTemplateId: frame.id, frameName: frame.name, values: {} }],
        }
    }

    async createRender(user: User, draft: DesignDraft): Promise<Design> {
        if (!draft.name.trim()) throw new ValidationError('design_name_required', 'a render needs a name')
        await this.access.assertWithinLimit(user, 'designs')

        const seeded = await this.seedEntries(user.id, draft)
        const row = await this.renders.create(user.id, {
            name: draft.name.trim(),
            kind: seeded.kind,
            frameTemplateId: draft.frameTemplateId ?? null,
            videoTemplateId: draft.videoTemplateId ?? null,
            entries: seeded.entries,
        })
        return toDesign(row)
    }

    async updateRender(
        id: string,
        current: Design,
        draft: Partial<DesignDraft>
    ): Promise<Design> {
        const name = (draft.name ?? current.name).trim()
        if (!name) throw new ValidationError('design_name_required', 'a render needs a name')

        const entries = draft.entries
            ? draft.entries.map((entry, index) => ({
                frameTemplateId: entry.frameTemplateId,
                frameName: current.entries[index]?.frameName ?? '',
                values: entry.values ?? {},
            }))
            : current.entries

        const row = await this.renders.updateFields(id, {
            name,
            entries,
            fileId: draft.fileId !== undefined ? draft.fileId : current.fileId,
        })
        if (!row) throw new NotFoundError('design_not_found', `render ${id} not found`, [id])
        return toDesign(row)
    }

    async removeRender(id: string): Promise<void> {
        const removed = await this.renders.remove(id)
        if (!removed) throw new NotFoundError('design_not_found', `render ${id} not found`, [id])
    }

    async removeVideo(id: string): Promise<void> {
        const removed = await this.videos.remove(id)
        if (!removed) throw new NotFoundError('video_template_not_found', `video template ${id} not found`, [id])
    }
}
