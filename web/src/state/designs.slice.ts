import { StateCreator } from 'zustand'
import DesignService from 'services/DesignService'
import { STRINGS } from 'configs/strings'
import {
    FrameTemplate,
    FrameTemplateDraft,
    Design,
    DesignDraft,
    VideoTemplate,
    VideoTemplateDraft,
} from 'types'
import type { AppStore } from './index'

export type DesignsSlice = {
    frameTemplates: FrameTemplate[]
    frameTemplatesLoaded: boolean

    videoTemplates: VideoTemplate[]
    videoTemplatesLoaded: boolean

    fetchFrameTemplates: () => Promise<void>
    createFrameTemplate: (draft: FrameTemplateDraft) => Promise<FrameTemplate | null>
    updateFrameTemplate: (id: string, patch: Partial<FrameTemplateDraft>) => Promise<boolean>
    deleteFrameTemplate: (id: string) => Promise<boolean>

    designs: Design[]
    designsLoaded: boolean

    fetchDesigns: () => Promise<void>
    createDesign: (draft: DesignDraft) => Promise<Design | null>
    updateDesign: (id: string, patch: Partial<DesignDraft>) => Promise<boolean>
    deleteDesign: (id: string) => Promise<boolean>

    fetchVideoTemplates: () => Promise<void>
    createVideoTemplate: (draft: VideoTemplateDraft) => Promise<VideoTemplate | null>
    updateVideoTemplate: (id: string, patch: Partial<VideoTemplateDraft>) => Promise<boolean>
    deleteVideoTemplate: (id: string) => Promise<boolean>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createDesignsSlice: StateCreator<AppStore, [], [], DesignsSlice> = (set, get) => ({
    frameTemplates: [],
    frameTemplatesLoaded: false,
    videoTemplates: [],
    videoTemplatesLoaded: false,
    designs: [],
    designsLoaded: false,

    async fetchFrameTemplates() {
        try {
            set({ frameTemplates: await DesignService.getInstance().listFrames(), frameTemplatesLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createFrameTemplate(draft) {
        try {
            const created = await DesignService.getInstance().createFrame(draft)
            await get().fetchFrameTemplates()
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.studio.frameSaved, dismissible: true })
            return created
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return null
        }
    },

    async updateFrameTemplate(id, patch) {
        try {
            const updated = await DesignService.getInstance().updateFrame(id, patch)
            set({
                frameTemplates: get().frameTemplates.map((frame) => (frame.id === id ? updated : frame)),
            })
            get().addAlert({ variant: 'success', message: STRINGS.studio.frameSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return false
        }
    },

    async deleteFrameTemplate(id) {
        try {
            await DesignService.getInstance().removeFrame(id)
            set({ frameTemplates: get().frameTemplates.filter((frame) => frame.id !== id) })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.studio.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return false
        }
    },

    async fetchDesigns() {
        try {
            set({ designs: await DesignService.getInstance().listRenders(), designsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createDesign(draft) {
        try {
            const created = await DesignService.getInstance().createRender(draft)
            await get().fetchDesigns()
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.studio.renderSaved, dismissible: true })
            return created
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return null
        }
    },

    async updateDesign(id, patch) {
        try {
            const updated = await DesignService.getInstance().updateRender(id, patch)
            set({ designs: get().designs.map((render) => (render.id === id ? updated : render)) })
            get().addAlert({ variant: 'success', message: STRINGS.studio.renderSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return false
        }
    },

    async deleteDesign(id) {
        try {
            await DesignService.getInstance().removeRender(id)
            set({ designs: get().designs.filter((render) => render.id !== id) })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.studio.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return false
        }
    },

    async fetchVideoTemplates() {
        try {
            set({ videoTemplates: await DesignService.getInstance().listVideos(), videoTemplatesLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createVideoTemplate(draft) {
        try {
            const created = await DesignService.getInstance().createVideo(draft)
            await get().fetchVideoTemplates()
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.studio.videoSaved, dismissible: true })
            return created
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return null
        }
    },

    async updateVideoTemplate(id, patch) {
        try {
            const updated = await DesignService.getInstance().updateVideo(id, patch)
            set({ videoTemplates: get().videoTemplates.map((video) => (video.id === id ? updated : video)) })
            get().addAlert({ variant: 'success', message: STRINGS.studio.videoSaved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return false
        }
    },

    async deleteVideoTemplate(id) {
        try {
            await DesignService.getInstance().removeVideo(id)
            set({ videoTemplates: get().videoTemplates.filter((video) => video.id !== id) })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.studio.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.studio.saveFailed)
            return false
        }
    },
})
