import { StateCreator } from 'zustand'
import TranslationService from 'services/TranslationService'
import { STRINGS } from 'configs/strings'
import { EMPTY_TRANSLATION_DOC, TranslationDoc } from 'types'
import type { AppStore } from './index'

export type TranslationsSlice = {
    translationsDoc: TranslationDoc
    translationsSaved: TranslationDoc
    translationsLoaded: boolean
    translationsSaving: boolean

    fetchTranslations: (projectId: string) => Promise<void>
    updateTranslationsDoc: (doc: TranslationDoc) => void
    discardTranslations: () => void
    saveTranslations: (projectId: string) => Promise<boolean>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createTranslationsSlice: StateCreator<AppStore, [], [], TranslationsSlice> = (set, get) => ({
    translationsDoc: EMPTY_TRANSLATION_DOC,
    translationsSaved: EMPTY_TRANSLATION_DOC,
    translationsLoaded: false,
    translationsSaving: false,

    async fetchTranslations(projectId) {
        try {
            const loaded = await TranslationService.getInstance().get(projectId)
            set({ translationsDoc: loaded.doc, translationsSaved: loaded.doc, translationsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    updateTranslationsDoc(doc) {
        set({ translationsDoc: doc })
    },

    discardTranslations() {
        set({ translationsDoc: get().translationsSaved })
    },

    async saveTranslations(projectId) {
        set({ translationsSaving: true })
        try {
            const saved = await TranslationService.getInstance().save(projectId, get().translationsDoc)
            set({ translationsDoc: saved.doc, translationsSaved: saved.doc })
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        } finally {
            set({ translationsSaving: false })
        }
    },
})
