import React, { useEffect, useMemo, useRef, useState } from 'react'
import { TcButton, TcExtendedSelect, TcSkeleton } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import {
    COMMON_LANGUAGES,
    Project,
    TranslationDoc,
    TranslationGroup,
    TranslationTerm,
    TRANSLATION_LIMITS,
} from 'types'

type Props = {
    project: Project
}

type Strings = ReturnType<typeof useStrings>['t']['tools']

const newId = (): string => crypto.randomUUID()

const withGroup = (doc: TranslationDoc, groupId: string, patch: (group: TranslationGroup) => TranslationGroup): TranslationDoc => ({
    ...doc,
    groups: doc.groups.map((group) => (group.id === groupId ? patch(group) : group)),
})

const groupCoverage = (group: TranslationGroup, languages: string[]): number => {
    if (group.terms.length === 0 || languages.length === 0) return 0
    let filled = 0
    for (const term of group.terms) {
        for (const lang of languages) {
            if ((term.values[lang] ?? '').trim()) filled += 1
        }
    }
    return Math.round((filled / (group.terms.length * languages.length)) * 100)
}

const docCoverage = (doc: TranslationDoc): number => {
    let filled = 0
    let cells = 0
    for (const group of doc.groups) {
        cells += group.terms.length * doc.languages.length
        for (const term of group.terms) {
            for (const lang of doc.languages) {
                if ((term.values[lang] ?? '').trim()) filled += 1
            }
        }
    }
    return cells === 0 ? 0 : Math.round((filled / cells) * 100)
}

const languageCoverage = (group: TranslationGroup, lang: string): number => {
    if (group.terms.length === 0) return 0
    let filled = 0
    for (const term of group.terms) {
        if ((term.values[lang] ?? '').trim()) filled += 1
    }
    return Math.round((filled / group.terms.length) * 100)
}

const focusNextCell = (input: HTMLInputElement, lang: string) => {
    const matrix = input.closest('.translations__matrix')
    if (!matrix) return
    const cells = Array.from(matrix.querySelectorAll<HTMLInputElement>(`input[data-lang="${lang}"]`))
    const index = cells.indexOf(input)
    const after = cells.slice(index + 1)
    const next = after.find((cell) => !cell.value.trim()) ?? after[0]
    if (next) {
        next.focus()
        next.select()
    } else {
        matrix.querySelector<HTMLInputElement>('.translations__add-term input')?.focus()
    }
}

const filledFor = (group: TranslationGroup, lang: string): number => {
    let filled = 0
    for (const term of group.terms) {
        if ((term.values[lang] ?? '').trim()) filled += 1
    }
    return filled
}

const isMissing = (term: TranslationTerm, languages: string[]): boolean =>
    languages.some((lang) => !(term.values[lang] ?? '').trim())

type MatrixRowProps = {
    term: TranslationTerm
    languages: string[]
    readonly: boolean
    strings: Strings
    onRename: (termId: string, name: string) => void
    onValue: (termId: string, lang: string, value: string) => void
    onDelete: (termId: string) => void
}

const MatrixRow: React.FC<MatrixRowProps> = ({ term, languages, readonly, strings, onRename, onValue, onDelete }) => {
    const complete = languages.length > 0 && languages.every((lang) => (term.values[lang] ?? '').trim())
    return (
        <div className={`translations__row${complete ? ' translations__row--complete' : ''}`}>
            <div className="translations__cell translations__cell--term">
                <input
                    defaultValue={term.term}
                    aria-label={term.term}
                    disabled={readonly}
                    spellCheck={false}
                    onBlur={(event) => {
                        const next = event.target.value.trim()
                        if (next && next !== term.term) onRename(term.id, next)
                        else event.target.value = term.term
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
                    }}
                />
                {!readonly && (
                    <button
                        type="button"
                        className="translations__remove"
                        aria-label={strings.deleteTerm}
                        title={strings.deleteTerm}
                        onClick={() => onDelete(term.id)}
                    >
                        ×
                    </button>
                )}
            </div>
            {languages.map((lang) => (
                <div
                    key={`${term.id}:${lang}`}
                    className={`translations__cell${(term.values[lang] ?? '').trim() ? '' : ' translations__cell--empty'}`}
                >
                    <input
                        data-lang={lang}
                        aria-label={`${term.term} · ${lang}`}
                        defaultValue={term.values[lang] ?? ''}
                        placeholder={strings.cellPlaceholder}
                        disabled={readonly}
                        spellCheck={false}
                        onBlur={(event) => {
                            if (event.target.value !== (term.values[lang] ?? '')) {
                                onValue(term.id, lang, event.target.value)
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                const input = event.target as HTMLInputElement
                                input.blur()
                                focusNextCell(input, lang)
                            }
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

const TranslationsTool: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const s = t.tools

    const doc = useStore((state) => state.translationsDoc)
    const saved = useStore((state) => state.translationsSaved)
    const loaded = useStore((state) => state.translationsLoaded)
    const saving = useStore((state) => state.translationsSaving)
    const fetchTranslations = useStore((state) => state.fetchTranslations)
    const updateDoc = useStore((state) => state.updateTranslationsDoc)
    const discardTranslations = useStore((state) => state.discardTranslations)
    const saveTranslations = useStore((state) => state.saveTranslations)
    const canWrite = useProjectCan('config.write')

    const [selectedGroupId, setSelectedGroupId] = useState('')
    const [filter, setFilter] = useState('')
    const [missingOnly, setMissingOnly] = useState(false)
    const [revision, setRevision] = useState(0)

    useEffect(() => {
        void fetchTranslations(project.id)
        setRevision((current) => current + 1)
    }, [project.id, fetchTranslations])

    const group = doc.groups.find((entry) => entry.id === selectedGroupId) ?? doc.groups[0]
    const dirty = useMemo(() => JSON.stringify(doc) !== JSON.stringify(saved), [doc, saved])
    const coverage = useMemo(() => docCoverage(doc), [doc])

    useEffect(() => {
        if (!dirty || !canWrite) return
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return
            event.preventDefault()
            void saveTranslations(project.id)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [dirty, canWrite, project.id, saveTranslations])

    useEffect(() => {
        if (!dirty) return
        const onLeave = (event: BeforeUnloadEvent) => event.preventDefault()
        window.addEventListener('beforeunload', onLeave)
        return () => window.removeEventListener('beforeunload', onLeave)
    }, [dirty])

    const missingCount = useMemo(
        () => (group ? group.terms.filter((term) => isMissing(term, doc.languages)).length : 0),
        [group, doc.languages]
    )

    const visibleTerms = useMemo(() => {
        if (!group) return []
        const query = filter.trim().toLowerCase()
        return group.terms.filter((term) => {
            if (missingOnly && !isMissing(term, doc.languages)) return false
            if (!query) return true
            if (term.term.toLowerCase().includes(query)) return true
            return doc.languages.some((lang) => (term.values[lang] ?? '').toLowerCase().includes(query))
        })
    }, [group, filter, missingOnly, doc.languages])

    const languageOptions = useMemo(() => {
        const used = new Set(doc.languages)
        return COMMON_LANGUAGES.flatMap((option) =>
            used.has(option.code)
                ? []
                : [{ key: option.code, name: option.label, description: option.code }]
        )
    }, [doc.languages])

    const addGroup = (name: string) => {
        const trimmed = name.trim()
        if (!trimmed || doc.groups.length >= TRANSLATION_LIMITS.groups) return
        if (doc.groups.some((entry) => entry.name.toLowerCase() === trimmed.toLowerCase())) return
        const created: TranslationGroup = { id: newId(), name: trimmed, terms: [] }
        updateDoc({ ...doc, groups: [...doc.groups, created] })
        setSelectedGroupId(created.id)
    }

    const deleteGroup = (groupId: string) => {
        updateDoc({ ...doc, groups: doc.groups.filter((entry) => entry.id !== groupId) })
    }

    const renameGroup = (groupId: string, name: string) => {
        const trimmed = name.trim()
        if (!trimmed) return
        updateDoc(withGroup(doc, groupId, (entry) => ({ ...entry, name: trimmed })))
    }

    const addLanguage = (code: string) => {
        if (!code || doc.languages.includes(code) || doc.languages.length >= TRANSLATION_LIMITS.languages) return
        updateDoc({ ...doc, languages: [...doc.languages, code] })
    }

    const removeLanguage = (code: string) => {
        updateDoc({ ...doc, languages: doc.languages.filter((entry) => entry !== code) })
    }

    const addTerm = (word: string) => {
        if (!group) return
        const trimmed = word.trim()
        if (!trimmed || group.terms.length >= TRANSLATION_LIMITS.termsPerGroup) return
        if (group.terms.some((entry) => entry.term.toLowerCase() === trimmed.toLowerCase())) return
        updateDoc(withGroup(doc, group.id, (entry) => ({
            ...entry,
            terms: [...entry.terms, { id: newId(), term: trimmed, values: {} }],
        })))
    }

    const renameTerm = (termId: string, name: string) => {
        if (!group) return
        updateDoc(withGroup(doc, group.id, (entry) => ({
            ...entry,
            terms: entry.terms.map((term) => (term.id === termId ? { ...term, term: name } : term)),
        })))
    }

    const deleteTerm = (termId: string) => {
        if (!group) return
        updateDoc(withGroup(doc, group.id, (entry) => ({
            ...entry,
            terms: entry.terms.filter((term) => term.id !== termId),
        })))
        setRevision((current) => current + 1)
    }

    const setValue = (termId: string, lang: string, value: string) => {
        if (!group) return
        updateDoc(withGroup(doc, group.id, (entry) => ({
            ...entry,
            terms: entry.terms.map((term) =>
                term.id === termId ? { ...term, values: { ...term.values, [lang]: value } } : term
            ),
        })))
    }

    const discard = () => {
        discardTranslations()
        setRevision((current) => current + 1)
    }

    if (!loaded) {
        return (
            <div className="console-stack">
                <TcSkeleton variant="rect" height={52} />
                <TcSkeleton variant="rect" height={220} />
            </div>
        )
    }

    return (
        <div className="translations">
            <div className="translations__toolbar">
                <span className="translations__coverage" title={s.coverage(coverage)}>
                    <span className="translations__coverage-value">{coverage}%</span>
                    <span className="translations__coverage-label">{s.coverageLabel}</span>
                    <span className="translations__coverage-track">
                        <span className="translations__coverage-fill" style={{ width: `${coverage}%` }} />
                    </span>
                </span>

                <div className="translations__languages">
                    {doc.languages.map((code) => (
                        <span key={code} className="translations__lang-chip" title={s.removeLanguage(code)}>
                            {code}
                            {canWrite && (
                                <button
                                    type="button"
                                    aria-label={s.removeLanguage(code)}
                                    onClick={() => removeLanguage(code)}
                                >
                                    ×
                                </button>
                            )}
                        </span>
                    ))}
                    {canWrite && languageOptions.length > 0 && (
                        <TcExtendedSelect
                            className="translations__lang-add"
                            items={languageOptions}
                            value=""
                            placeholder={s.addLanguageLabel}
                            searchPlaceholder={s.languageSearch}
                            onChange={addLanguage}
                        />
                    )}
                </div>

                {canWrite && (
                    <div className="translations__actions">
                        <span className="translations__shortcut">{s.translationsSaveHint}</span>
                        {dirty && <span className="translations__unsaved">{s.unsavedChanges}</span>}
                        {dirty && (
                            <TcButton variant="secondary" outline size="small" onClick={discard}>
                                {s.discardTranslations}
                            </TcButton>
                        )}
                        <TcButton
                            variant="primary"
                            size="small"
                            disabled={!dirty || saving}
                            onClick={() => void saveTranslations(project.id)}
                        >
                            {s.saveTranslations}
                        </TcButton>
                    </div>
                )}
            </div>

            {!canWrite && <p className="translations__readonly">{s.translationsReadonly}</p>}

            <div className="translations__body">
                <aside className="translations__rail">
                    <p className="translations__rail-title">{s.groupsTitle}</p>
                    <ul className="translations__groups">
                        {doc.groups.map((entry) => (
                            <li key={entry.id}>
                                <button
                                    type="button"
                                    className={`translations__group${entry.id === group?.id ? ' translations__group--active' : ''}`}
                                    onClick={() => setSelectedGroupId(entry.id)}
                                >
                                    <span className="translations__group-name">{entry.name}</span>
                                    <span className="translations__group-meta">
                                        {s.termCount(entry.terms.length)}
                                        {doc.languages.length > 0 && entry.terms.length > 0 && (
                                            <span className="translations__group-pct">
                                                {groupCoverage(entry, doc.languages)}%
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {canWrite && (
                        <input
                            className="translations__add-group"
                            aria-label={s.addGroupPlaceholder}
                            placeholder={s.addGroupPlaceholder}
                            spellCheck={false}
                            onKeyDown={(event) => {
                                if (event.key !== 'Enter') return
                                const input = event.target as HTMLInputElement
                                addGroup(input.value)
                                input.value = ''
                            }}
                        />
                    )}
                    {doc.groups.length === 0 && (
                        <p className="translations__rail-empty">{s.translationsEmptyGroups}</p>
                    )}
                </aside>

                <section className="translations__matrix" key={`${group?.id ?? 'none'}:${revision}`}>
                    {group && (
                        <div className="translations__matrix-head">
                            <input
                                className="translations__group-title"
                                aria-label={s.groupsTitle}
                                defaultValue={group.name}
                                disabled={!canWrite}
                                spellCheck={false}
                                onBlur={(event) => {
                                    const next = event.target.value.trim()
                                    if (next && next !== group.name) renameGroup(group.id, next)
                                    else event.target.value = group.name
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
                                }}
                            />
                            <input
                                className="translations__filter"
                                aria-label={s.translationsFilter}
                                placeholder={s.translationsFilter}
                                spellCheck={false}
                                onChange={(event) => setFilter(event.target.value)}
                            />
                            <button
                                type="button"
                                className={`translations__toggle${missingOnly ? ' translations__toggle--on' : ''}`}
                                aria-pressed={missingOnly}
                                title={
                                    missingCount > 0
                                        ? s.translationsMissingCount(missingCount)
                                        : s.translationsAllFilled
                                }
                                onClick={() => setMissingOnly((current) => !current)}
                            >
                                {s.translationsMissingOnly}
                                <span className="translations__toggle-count">{missingCount}</span>
                            </button>
                            {canWrite && (
                                <button
                                    type="button"
                                    className="translations__remove translations__remove--group"
                                    aria-label={s.deleteGroup}
                                    title={s.deleteGroup}
                                    onClick={() => deleteGroup(group.id)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    )}

                    {group && doc.languages.length === 0 && (
                        <div className="translations__empty translations__empty--action">
                            <p>{s.translationsEmptyLanguages}</p>
                            {canWrite && (
                                <TcExtendedSelect
                                    className="translations__lang-add"
                                    items={languageOptions}
                                    value=""
                                    placeholder={s.translationsAddLanguageHere}
                                    searchPlaceholder={s.languageSearch}
                                    onChange={addLanguage}
                                />
                            )}
                        </div>
                    )}

                    {group && doc.languages.length > 0 && (
                        <div
                            className="translations__grid"
                            style={{ '--translations-cols': doc.languages.length } as React.CSSProperties}
                        >
                            <div className="translations__row translations__row--head">
                                <div className="translations__cell translations__cell--term">
                                    <span>{s.termWord}</span>
                                </div>
                                {doc.languages.map((lang) => (
                                    <div key={lang} className="translations__cell translations__cell--head">
                                        <span className="translations__lang-head">
                                            <span className="translations__lang-code">{lang}</span>
                                            <span className="translations__lang-count">
                                                {s.translationsLangFilled(
                                                    filledFor(group, lang),
                                                    group.terms.length
                                                )}
                                            </span>
                                        </span>
                                        <span className="translations__lang-track">
                                            <span
                                                className="translations__lang-fill"
                                                style={{ width: `${languageCoverage(group, lang)}%` }}
                                            />
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {visibleTerms.map((term) => (
                                <MatrixRow
                                    key={term.id}
                                    term={term}
                                    languages={doc.languages}
                                    readonly={!canWrite}
                                    strings={s}
                                    onRename={renameTerm}
                                    onValue={setValue}
                                    onDelete={deleteTerm}
                                />
                            ))}

                            {group.terms.length === 0 && (
                                <p className="translations__empty">{s.translationsEmptyTerms}</p>
                            )}
                            {group.terms.length > 0 && visibleTerms.length === 0 && (
                                <p className="translations__empty">
                                    {missingOnly && missingCount === 0
                                        ? s.translationsAllFilled
                                        : s.translationsNoMatches}
                                </p>
                            )}

                            {canWrite && (
                                <div className="translations__add-term">
                                    <input
                                        aria-label={s.addTermPlaceholder}
                                        placeholder={s.addTermPlaceholder}
                                        spellCheck={false}
                                        onKeyDown={(event) => {
                                            if (event.key !== 'Enter') return
                                            const input = event.target as HTMLInputElement
                                            addTerm(input.value)
                                            input.value = ''
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}

export default TranslationsTool
