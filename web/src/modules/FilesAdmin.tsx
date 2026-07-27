import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { MODAL, useModalOpen } from 'modals'
import {
    FILE_SOURCE_TYPE_LABELS,
    FILE_TYPES,
    FILE_TYPE_LABELS,
    FileSource,
    FileType,
    FileTypeBindings,
} from 'types'

const UNBOUND = '__unbound__'

const sourceLabel = (sources: FileSource[], id: string): string =>
    sources.find((source) => source.id === id)?.name ?? ''

const SourceBinding: React.FC<{
    options: Array<{ key: string; label: string }>
    value: string
    disabled: boolean
    onChange: (next: string | null) => void
}> = ({ options, value, disabled, onChange }) => {
    const select = useTc<HTMLElement & { value: string }>({
        items: options,
        onChange: (next: string) => onChange(next && next !== UNBOUND ? next : null),
    })
    useEffect(() => {
        const el = select.current
        if (!el) return
        const frame = requestAnimationFrame(() => {
            el.value = value || UNBOUND
        })
        return () => cancelAnimationFrame(frame)
    }, [value, options.length, select])
    return <tc-extended-select ref={select} disabled={disabled || undefined}></tc-extended-select>
}

const FilesAdmin: React.FC = () => {
    const { t } = useStrings()
    const f = t.files

    const fileSources = useStore((state) => state.fileSources)
    const fileSourcesLoaded = useStore((state) => state.fileSourcesLoaded)
    const fileBindings = useStore((state) => state.fileBindings)
    const fetchFileSources = useStore((state) => state.fetchFileSources)
    const fetchFileBindings = useStore((state) => state.fetchFileBindings)
    const deleteFileSource = useStore((state) => state.deleteFileSource)
    const saveFileBindings = useStore((state) => state.saveFileBindings)

    const canWrite = useCan('file.source.write')

    const openSource = useModalOpen<FileSource | null, FileSource | null>(MODAL.FILE_SOURCE)

    const [bindingDraft, setBindingDraft] = useState<Partial<FileTypeBindings>>({})

    useEffect(() => {
        void fetchFileSources()
        void fetchFileBindings()
    }, [fetchFileSources, fetchFileBindings])

    useEffect(() => {
        if (fileBindings) setBindingDraft({ ...fileBindings })
    }, [fileBindings])

    const sourceItems = useMemo(() => {
        const counts = new Map<string, number>()
        if (fileBindings) {
            for (const fileType of FILE_TYPES) {
                const sourceId = fileBindings[fileType]
                if (sourceId) counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1)
            }
        }
        return fileSources.map((source) => ({ ...source, used: counts.get(source.id) ?? 0 }))
    }, [fileSources, fileBindings])

    const summarize = (source: FileSource): string => {
        if (source.type === 'disk') return source.config.basePath || f.defaultBasePath
        return [source.config.bucket, source.config.region, source.config.endpoint].filter(Boolean).join(' · ')
    }

    const sourceRow = (source: FileSource & { used: number }): string => {
        const used = source.used
        return (
            `<li class="tc-data-list__row" data-id="${escapeHtml(source.id)}">` +
            `<div class="tc-data-list__text">` +
            `<span class="tc-data-list__primary">${escapeHtml(source.name)}` +
            `<tc-badge variant="${source.type === 's3' ? 'info' : 'secondary'}">${escapeHtml(FILE_SOURCE_TYPE_LABELS[source.type])}</tc-badge>` +
            `</span>` +
            `<span class="tc-data-list__secondary">${escapeHtml(summarize(source))}</span>` +
            `</div>` +
            `<span class="tc-data-list__trailing">${escapeHtml(used === 0 ? f.unused : f.usedBy(used))}</span>` +
            (canWrite
                ? `<span class="table-actions">` +
                  `<tc-icon-button icon="Pencil" variant="secondary" size="small" outline data-action="edit" label="${escapeHtml(f.edit)}" title="${escapeHtml(f.edit)}"></tc-icon-button>` +
                  `<tc-icon-button icon="Trash2" variant="danger" size="small" outline data-action="delete" label="${escapeHtml(f.delete)}" title="${escapeHtml(f.delete)}"></tc-icon-button>` +
                  `</span>`
                : '') +
            `</li>`
        )
    }

    const sourceList = useTc<HTMLElement>({
        items: sourceItems,
        renderRow: sourceRow,
        onAction: (detail: { action: string; id: string }) => {
            const source = fileSources.find((entry) => entry.id === detail.id)
            if (!source) return
            if (detail.action === 'edit') openSource(source)
            if (detail.action === 'delete' && window.confirm(f.deletePrompt(source.name))) {
                void deleteFileSource(source.id)
            }
        },
    })

    const sourceOptions = [
        { key: UNBOUND, label: f.unbound },
        ...fileSources.map((source) => ({ key: source.id, label: source.name })),
    ]

    const hasSources = fileSources.length > 0

    const unassignedCount = FILE_TYPES.filter((fileType) => !bindingDraft[fileType]).length

    const bindingsChanged = fileBindings
        ? FILE_TYPES.some((fileType) => (bindingDraft[fileType] ?? null) !== (fileBindings[fileType] ?? null))
        : false

    return (
        <div className="module module-files">
            <tc-section-card title={f.title} icon="Database">
                {canWrite && (
                    <tc-button slot="action" variant="primary" size="sm" onClick={() => openSource(null)}>
                        {f.create}
                    </tc-button>
                )}
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{f.intro}</tc-text>

                    {fileSourcesLoaded && !hasSources && (
                        <tc-empty-state
                            icon="Database"
                            heading={f.emptyHeading}
                            description={f.emptyDescription}
                        ></tc-empty-state>
                    )}

                    {hasSources && <tc-data-list ref={sourceList}></tc-data-list>}
                </tc-stack>
            </tc-section-card>

            <tc-section-card title={f.bindingsTitle} icon="FolderTree" className="module-files__bindings">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{f.bindingsIntro}</tc-text>

                    {!hasSources && fileSourcesLoaded && <tc-alert variant="info">{f.bindingsNoSources}</tc-alert>}

                    {hasSources && unassignedCount > 0 && (
                        <tc-alert variant="warning">{f.unassignedWarning(unassignedCount)}</tc-alert>
                    )}

                    <div className="module-files__types">
                        {FILE_TYPES.map((fileType: FileType) => {
                            const value = bindingDraft[fileType] ?? ''
                            const changed = fileBindings
                                ? (bindingDraft[fileType] ?? null) !== (fileBindings[fileType] ?? null)
                                : false
                            return (
                                <div key={fileType} className="module-files__type">
                                    <div className="module-files__type-head">
                                        <tc-label>{FILE_TYPE_LABELS[fileType]}</tc-label>
                                        {changed && <tc-badge variant="warning">{f.unsaved}</tc-badge>}
                                    </div>
                                    <SourceBinding
                                        options={sourceOptions}
                                        value={value}
                                        disabled={!canWrite || !hasSources}
                                        onChange={(next) => setBindingDraft({ ...bindingDraft, [fileType]: next })}
                                    />
                                    <tc-status-dot
                                        status={value ? 'online' : 'away'}
                                        size="small"
                                        label={value ? sourceLabel(fileSources, value) : f.unassigned}
                                    ></tc-status-dot>
                                </div>
                            )
                        })}
                    </div>

                    {canWrite && hasSources && (
                        <div className="module-files__footer">
                            <tc-button
                                variant="primary"
                                disabled={!bindingsChanged || undefined}
                                onClick={() => void saveFileBindings(bindingDraft)}
                            >
                                {f.save}
                            </tc-button>
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default FilesAdmin
