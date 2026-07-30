export const LEGAL_DOCUMENT_KEYS = ['privacy', 'terms'] as const

export type LegalDocumentKey = (typeof LEGAL_DOCUMENT_KEYS)[number]

export type LegalDocumentMeta = {
    key: LegalDocumentKey
    path: string
    updated: string
}

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
    { key: 'privacy', path: '/privacy', updated: '2026-01-01' },
    { key: 'terms', path: '/terms', updated: '2026-01-01' },
]

export const legalDocument = (key: LegalDocumentKey): LegalDocumentMeta =>
    LEGAL_DOCUMENTS.find((entry) => entry.key === key) as LegalDocumentMeta
