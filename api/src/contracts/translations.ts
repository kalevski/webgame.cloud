export type TranslationTerm = {
    id: string
    term: string
    values: Record<string, string>
}

export type TranslationGroup = {
    id: string
    name: string
    terms: TranslationTerm[]
}

export type TranslationDoc = {
    languages: string[]
    groups: TranslationGroup[]
}

export type ProjectTranslations = {
    projectId: string
    doc: TranslationDoc
    updatedAt: string
}

export const EMPTY_TRANSLATION_DOC: TranslationDoc = { languages: [], groups: [] }

export const TRANSLATION_LIMITS = {
    languages: 16,
    groups: 64,
    termsPerGroup: 500,
    termLength: 200,
    valueLength: 2000,
    groupNameLength: 80,
} as const

export const LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(-[A-Z]{2})?$/

export type LanguageOption = {
    code: string
    label: string
}

export const COMMON_LANGUAGES: LanguageOption[] = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
    { code: 'fr', label: 'French' },
    { code: 'es', label: 'Spanish' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'pt-BR', label: 'Portuguese (Brazil)' },
    { code: 'nl', label: 'Dutch' },
    { code: 'pl', label: 'Polish' },
    { code: 'tr', label: 'Turkish' },
    { code: 'ru', label: 'Russian' },
    { code: 'uk', label: 'Ukrainian' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh-CN', label: 'Chinese (Simplified)' },
    { code: 'zh-TW', label: 'Chinese (Traditional)' },
    { code: 'ar', label: 'Arabic' },
    { code: 'hi', label: 'Hindi' },
    { code: 'id', label: 'Indonesian' },
    { code: 'vi', label: 'Vietnamese' },
    { code: 'th', label: 'Thai' },
    { code: 'sv', label: 'Swedish' },
    { code: 'da', label: 'Danish' },
    { code: 'nb', label: 'Norwegian' },
    { code: 'fi', label: 'Finnish' },
    { code: 'cs', label: 'Czech' },
    { code: 'sk', label: 'Slovak' },
    { code: 'hu', label: 'Hungarian' },
    { code: 'ro', label: 'Romanian' },
    { code: 'el', label: 'Greek' },
    { code: 'bg', label: 'Bulgarian' },
    { code: 'sr', label: 'Serbian' },
    { code: 'hr', label: 'Croatian' },
    { code: 'mk', label: 'Macedonian' },
    { code: 'sl', label: 'Slovenian' },
    { code: 'he', label: 'Hebrew' },
]
