import React, { useMemo } from 'react'
import { useTc } from '@toolcase/web-components/react'
import { TcIcon } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { FORMAT_KINDS, KIND_ICONS, formatsFor } from 'configs/kinds'
import { UPLOAD_FORMATS } from 'types'

export type UploadOption = {
    key: string
    label: string
}

type Props = {
    onFiles: (files: File[]) => void
    categories: UploadOption[]
    tags: UploadOption[]
    categoryId: string
    tagIds: string[]
    onCategoryChange: (categoryId: string) => void
    onTagsChange: (tags: string[]) => void
}

type ValueElement = HTMLElement & { value?: unknown; values?: string[] }

const SUPPORTED = UPLOAD_FORMATS.map((format) => ({
    label: format.extension.toUpperCase(),
    mime: format.mime,
    extension: `.${format.extension}`,
}))

const valuesFrom = (event: Event): string[] => {
    const detail = (event as CustomEvent<{ value: string | string[] }>).detail?.value
    if (Array.isArray(detail)) return detail
    if (typeof detail === 'string' && detail) return detail.split(',')
    return []
}

const UploadDropzone: React.FC<Props> = ({
    onFiles,
    categories,
    tags,
    categoryId,
    tagIds,
    onCategoryChange,
    onTagsChange,
}) => {
    const { t } = useStrings()
    const u = t.uploadZone

    const dropzone = useTc<HTMLElement>({ supported: SUPPORTED, onFiles })

    const categoryItems = useMemo(
        () => [{ key: '', label: u.noCategory }, ...categories],
        [categories, u.noCategory]
    )

    const categorySelect = useTc<ValueElement>({
        items: categoryItems,
        value: categoryId,
        onChange: (value: unknown) => onCategoryChange(String(value ?? '')),
    })

    const tagSelect = useTc<ValueElement>(
        { items: tags, values: tagIds },
        { 'tc-change': (event: Event) => onTagsChange(valuesFrom(event)) }
    )

    const categoryName = categories.find((option) => option.key === categoryId)?.label ?? u.noCategory

    return (
        <section className="upload-zone">
            <tc-file-dropzone ref={dropzone}></tc-file-dropzone>

            <ul className="upload-zone__manifest" aria-label={u.manifestLabel}>
                {FORMAT_KINDS.flatMap((kind) => {
                    const formats = formatsFor(kind)
                    if (formats.length === 0) return []
                    return [
                        <li key={kind} className={`upload-zone__kind upload-zone__kind--${kind}`}>
                            <span className="upload-zone__kind-head">
                                <TcIcon name={KIND_ICONS[kind]} size={14} decorative />
                                <span className="upload-zone__kind-name">{u.kinds[kind]}</span>
                                <span className="upload-zone__kind-count">{formats.length}</span>
                            </span>
                            <span className="upload-zone__kind-formats">
                                {formats.map((format) => (
                                    <tc-badge key={format.extension} variant="secondary">
                                        .{format.extension}
                                    </tc-badge>
                                ))}
                            </span>
                        </li>,
                    ]
                })}
            </ul>

            <div className="upload-zone__assign" title={u.assignSummary(categoryName, tagIds)}>
                <p className="upload-zone__assign-title">{u.assignTitle}</p>

                <div className="upload-zone__assign-field">
                    <tc-extended-select
                        ref={categorySelect}
                        aria-label={u.categoryLabel}
                        placeholder={u.noCategory}
                        search-placeholder={u.categorySearch}
                        max-height="220"
                    ></tc-extended-select>
                </div>

                <div className="upload-zone__assign-field">
                    <tc-extended-select
                        ref={tagSelect}
                        multiple
                        aria-label={u.tagsLabel}
                        placeholder={u.tagsPlaceholder}
                        search-placeholder={u.tagSearch}
                        max-height="220"
                    ></tc-extended-select>
                </div>
            </div>
        </section>
    )
}

export default UploadDropzone
