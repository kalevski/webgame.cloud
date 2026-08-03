import { inject, injectable } from 'tsyringe'
import type { ProjectTranslations, TranslationDoc, TranslationGroup, TranslationTerm } from '../contracts/index.js'
import { EMPTY_TRANSLATION_DOC, LANGUAGE_CODE_PATTERN, TRANSLATION_LIMITS } from '../contracts/index.js'
import { ValidationError } from '../domain/errors.js'
import { TranslationRepository } from '../repositories/translations/TranslationRepository.js'
import { toProjectTranslations } from '../schema/translations.js'

const invalid = (detail: string): ValidationError =>
    new ValidationError('translations_invalid', detail, [detail])

@injectable()
export class TranslationService {
    constructor(@inject(TranslationRepository) private translations: TranslationRepository) {}

    async get(projectId: string): Promise<ProjectTranslations> {
        const row = await this.translations.findByProject(projectId)
        if (!row) {
            return { projectId, doc: EMPTY_TRANSLATION_DOC, updatedAt: new Date(0).toISOString() }
        }
        return toProjectTranslations(row)
    }

    async save(projectId: string, doc: TranslationDoc): Promise<ProjectTranslations> {
        const clean = this.sanitize(doc)
        const row = await this.translations.saveDoc(projectId, clean)
        return toProjectTranslations(row!)
    }

    private sanitize(doc: TranslationDoc): TranslationDoc {
        if (!doc || !Array.isArray(doc.languages) || !Array.isArray(doc.groups)) {
            throw invalid('doc_shape')
        }
        if (doc.languages.length > TRANSLATION_LIMITS.languages) throw invalid('too_many_languages')
        if (doc.groups.length > TRANSLATION_LIMITS.groups) throw invalid('too_many_groups')

        const languages: string[] = []
        for (const raw of doc.languages) {
            const code = String(raw).trim()
            if (!LANGUAGE_CODE_PATTERN.test(code)) throw invalid('language_code')
            if (!languages.includes(code)) languages.push(code)
        }

        const groupNames = new Set<string>()
        const groups: TranslationGroup[] = doc.groups.map((group) => {
            const name = String(group.name ?? '').trim()
            if (!name || name.length > TRANSLATION_LIMITS.groupNameLength) throw invalid('group_name')
            const nameKey = name.toLowerCase()
            if (groupNames.has(nameKey)) throw invalid('group_name_duplicate')
            groupNames.add(nameKey)

            if (!Array.isArray(group.terms)) throw invalid('doc_shape')
            if (group.terms.length > TRANSLATION_LIMITS.termsPerGroup) throw invalid('too_many_terms')

            const termKeys = new Set<string>()
            const terms: TranslationTerm[] = group.terms.map((term) => {
                const word = String(term.term ?? '').trim()
                if (!word || word.length > TRANSLATION_LIMITS.termLength) throw invalid('term')
                const termKey = word.toLowerCase()
                if (termKeys.has(termKey)) throw invalid('term_duplicate')
                termKeys.add(termKey)

                const values: Record<string, string> = {}
                for (const [lang, value] of Object.entries(term.values ?? {})) {
                    if (!languages.includes(lang)) continue
                    const text = String(value ?? '')
                    if (text.length > TRANSLATION_LIMITS.valueLength) throw invalid('value_length')
                    if (text.trim().length > 0) values[lang] = text
                }

                return { id: String(term.id ?? '').slice(0, 80) || word, term: word, values }
            })

            return { id: String(group.id ?? '').slice(0, 80) || nameKey, name, terms }
        })

        return { languages, groups }
    }
}
