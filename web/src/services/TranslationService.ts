import { apiFetch } from 'helpers/api'
import { ProjectTranslations, TranslationDoc } from 'types'

class TranslationService {
    private static instance: TranslationService
    private constructor() {}

    static getInstance(): TranslationService {
        if (!TranslationService.instance) TranslationService.instance = new TranslationService()
        return TranslationService.instance
    }

    async get(projectId: string): Promise<ProjectTranslations> {
        return apiFetch<ProjectTranslations>(`/api/projects/${encodeURIComponent(projectId)}/translations`)
    }

    async save(projectId: string, doc: TranslationDoc): Promise<ProjectTranslations> {
        return apiFetch<ProjectTranslations>(`/api/projects/${encodeURIComponent(projectId)}/translations`, {
            method: 'PUT',
            body: JSON.stringify({ doc }),
        })
    }
}

export default TranslationService
