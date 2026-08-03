import type { ProjectTranslations, TranslationDoc } from '../contracts/index.js'

export type TranslationRow = {
    id: string
    project_id: string
    doc: TranslationDoc
    created_at: Date
    updated_at: Date
    deleted_at: Date | null
}

export const toProjectTranslations = (row: TranslationRow): ProjectTranslations => ({
    projectId: row.project_id,
    doc: row.doc ?? { languages: [], groups: [] },
    updatedAt: row.updated_at.toISOString(),
})
