import { apiFetch } from 'helpers/api'
import {
    FrameTemplate,
    FrameTemplateDraft,
    Design,
    DesignDraft,
    DesignSourceInfo,
    DesignSourceItem,
    VideoTemplate,
    VideoTemplateDraft,
} from 'types'

class DesignService {
    private static instance: DesignService
    private constructor() {}

    static getInstance(): DesignService {
        if (!DesignService.instance) DesignService.instance = new DesignService()
        return DesignService.instance
    }

    async listFrames(): Promise<FrameTemplate[]> {
        return apiFetch<FrameTemplate[]>('/api/studio/frames')
    }

    async createFrame(draft: FrameTemplateDraft): Promise<FrameTemplate> {
        return apiFetch<FrameTemplate>('/api/studio/frames', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateFrame(id: string, patch: Partial<FrameTemplateDraft>): Promise<FrameTemplate> {
        return apiFetch<FrameTemplate>(`/api/studio/frames/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async removeFrame(id: string): Promise<void> {
        await apiFetch<void>(`/api/studio/frames/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async listVideos(): Promise<VideoTemplate[]> {
        return apiFetch<VideoTemplate[]>('/api/studio/videos')
    }

    async createVideo(draft: VideoTemplateDraft): Promise<VideoTemplate> {
        return apiFetch<VideoTemplate>('/api/studio/videos', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateVideo(id: string, patch: Partial<VideoTemplateDraft>): Promise<VideoTemplate> {
        return apiFetch<VideoTemplate>(`/api/studio/videos/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async removeVideo(id: string): Promise<void> {
        await apiFetch<void>(`/api/studio/videos/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async listRenders(): Promise<Design[]> {
        return apiFetch<Design[]>('/api/studio/designs')
    }

    async createRender(draft: DesignDraft): Promise<Design> {
        return apiFetch<Design>('/api/studio/designs', { method: 'POST', body: JSON.stringify(draft) })
    }

    async updateRender(id: string, patch: Partial<DesignDraft>): Promise<Design> {
        return apiFetch<Design>(`/api/studio/designs/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async removeRender(id: string): Promise<void> {
        await apiFetch<void>(`/api/studio/designs/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    async listSources(): Promise<DesignSourceInfo[]> {
        return apiFetch<DesignSourceInfo[]>('/api/studio/sources')
    }

    async listSourceItems(sourceId: string): Promise<DesignSourceItem[]> {
        return apiFetch<DesignSourceItem[]>(`/api/studio/sources/${encodeURIComponent(sourceId)}/items`)
    }

    async resolveSource(sourceId: string, itemId: string): Promise<Record<string, string>> {
        return apiFetch<Record<string, string>>(
            `/api/studio/sources/${encodeURIComponent(sourceId)}/items/${encodeURIComponent(itemId)}`
        )
    }

    async saveRenderFile(blob: Blob, filename: string): Promise<{ id: string }> {
        const formData = new FormData()
        formData.append('assetType', 'design_export')
        formData.append('file', blob, filename)
        return apiFetch<{ id: string }>('/api/files', { method: 'POST', body: formData, headers: {} })
    }
}

export default DesignService
