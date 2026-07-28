import React, { useEffect, useRef } from 'react'
import {
    TcActionHeader,
    TcActionHeaderAction,
    TcActionItem,
    TcAlert,
    TcFile,
    TcFileTag,
    TcGroup,
    TcProgressBar,
    TcSkeleton,
} from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { MODAL, useModalOpen } from 'modals'
import { EditAssetTagsInput } from 'modals/EditAssetTagsModal'
import { AssetFile, Project } from 'types'

type Props = {
    project: Project
}

const SUPPORTED = [
    { extension: 'png', label: 'PNG' },
    { extension: 'jpg', label: 'JPEG' },
    { extension: 'webp', label: 'WebP' },
    { extension: 'ogg', label: 'OGG' },
    { extension: 'json', label: 'JSON' },
]

const FileList: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const a = t.assets

    const assets = useStore((state) => state.assets)
    const assetsLoaded = useStore((state) => state.assetsLoaded)
    const queue = useStore((state) => state.queue)
    const dirty = useStore((state) => state.dirty)
    const rejected = useStore((state) => state.rejected)
    const vocabularies = useStore((state) => state.vocabularies)
    const fetchAssets = useStore((state) => state.fetchAssets)
    const fetchVocabularies = useStore((state) => state.fetchVocabularies)
    const enqueueUploads = useStore((state) => state.enqueueUploads)
    const stageEdit = useStore((state) => state.stageEdit)
    const discardEdits = useStore((state) => state.discardEdits)
    const saveEdits = useStore((state) => state.saveEdits)
    const deleteAsset = useStore((state) => state.deleteAsset)

    const canWrite = useProjectCan('file.write')
    const dropzone = useRef<HTMLElement & { supported?: unknown }>(null)

    useEffect(() => {
        void fetchAssets(project.id)
        void fetchVocabularies(project.id)
    }, [project.id, fetchAssets, fetchVocabularies])

    useEffect(() => {
        const element = dropzone.current
        if (!element) return
        element.supported = SUPPORTED
        const listener = (raw: Event) => {
            const files = (raw as CustomEvent<{ files: File[] }>).detail?.files ?? []
            if (files.length > 0) void enqueueUploads(project.id, files, vocabularies?.categories[0]?.id)
        }
        element.addEventListener('tc-files', listener)
        return () => element.removeEventListener('tc-files', listener)
    })

    const openTagEditor = useModalOpen<{ assetId: string; tags: string[] }, EditAssetTagsInput>(
        MODAL.EDIT_ASSET_TAGS,
        (result) => {
            if (result) stageEdit({ id: result.assetId, tags: result.tags })
        }
    )

    const menuItems: TcActionItem[] = [
        { key: 'tags', label: a.editTags, icon: 'tag' },
        { key: 'delete', label: a.delete, icon: 'trash' },
    ]

    const headerActions: TcActionHeaderAction[] = canWrite && Object.keys(dirty).length > 0
        ? [
            { key: 'save', label: a.save, icon: 'save' },
            { key: 'discard', label: a.discard, icon: 'x' },
        ]
        : []

    const handleAction = (key: string) => {
        if (key === 'save') void saveEdits(project.id)
        if (key === 'discard') discardEdits()
    }

    const categories = vocabularies?.categories ?? []
    const grouped = new Map<string, AssetFile[]>()
    const uncategorized: AssetFile[] = []

    for (const asset of assets) {
        if (!asset.categoryId) {
            uncategorized.push(asset)
            continue
        }
        if (!grouped.has(asset.categoryId)) grouped.set(asset.categoryId, [])
        grouped.get(asset.categoryId)!.push(asset)
    }
    for (const category of categories) {
        if (!grouped.has(category.id)) grouped.set(category.id, [])
    }

    const groups = [
        { id: '', name: a.uncategorized, files: uncategorized },
        ...categories.map((category) => ({
            id: category.id,
            name: category.name,
            files: grouped.get(category.id) ?? [],
        })),
    ]

    const tags = (vocabularies?.tags ?? []).map((tag) => ({
        id: tag.name,
        name: tag.name,
        label: tag.name,
    })) as TcFileTag[]

    const withDraft = (asset: AssetFile): AssetFile => {
        const patch = dirty[asset.id]
        if (!patch) return asset
        return {
            ...asset,
            name: patch.name ?? asset.name,
            tags: patch.tags ?? asset.tags,
        }
    }

    if (!assetsLoaded) {
        return (
            <div className="console-stack">
                <TcSkeleton variant="rect" height={52} />
                <TcSkeleton variant="rect" height={52} />
                <TcSkeleton variant="rect" height={52} />
            </div>
        )
    }

    const isEmpty = assets.length === 0 && queue.length === 0

    return (
        <>
            {rejected.length > 0 && <TcAlert variant="danger">{a.rejected(rejected.join(', '))}</TcAlert>}

            {headerActions.length > 0 && <TcActionHeader actions={headerActions} onExec={handleAction} />}

            {isEmpty && (
                <div className="console-empty">
                    <p className="console-empty__title">{a.emptyTitle}</p>
                    <p className="console-empty__body">{a.emptyBody}</p>
                </div>
            )}

            {queue.length > 0 && (
                <TcGroup label={a.queueTitle} badge={`${queue.length}`} actionIcon="">
                    {queue.map((item) => (
                        <div key={item.id}>
                            <tc-queued-file
                                name={item.name}
                                size={item.size}
                            ></tc-queued-file>
                            <TcProgressBar
                                value={item.size > 0 ? Math.round((item.loaded / item.size) * 100) : 0}
                                variant="primary"
                                height={4}
                            />
                        </div>
                    ))}
                </TcGroup>
            )}

            <div className="console-stack">
            {!isEmpty && groups.map((group) => (
                <TcGroup
                    key={`${group.id || 'uncategorized'}:${group.files.length}`}
                    label={group.name}
                    badge={`${group.files.length}`}
                    defaultCollapsed={group.files.length === 0}
                    data-empty={group.files.length === 0 ? 'true' : undefined}
                    actionIcon=""
                >
                    {group.files.map((asset) => {
                        const displayed = withDraft(asset)
                        return (
                            <TcFile
                                key={asset.id}
                                name={displayed.name}
                                extension={displayed.extension}
                                format={displayed.mime}
                                size={displayed.sizeBytes}
                                tagIds={displayed.tags}
                                tags={tags}
                                loading={displayed.uploadStatus === 'processing'}
                                readonly={!canWrite || displayed.uploadStatus !== 'ready'}
                                menuItems={canWrite ? menuItems : undefined}
                                onNameChange={(name) => stageEdit({ id: asset.id, name })}
                                onTagsChange={(tagIds) => stageEdit({ id: asset.id, tags: tagIds })}
                                onMenuItemClick={(key) => {
                                    if (key === 'delete') void deleteAsset(project.id, asset.id)
                                    if (key === 'tags')
                                        openTagEditor({
                                            assetId: asset.id,
                                            name: displayed.name,
                                            tags: displayed.tags,
                                            recommendations: (vocabularies?.tags ?? []).map((tag) => tag.name),
                                        })
                                }}
                            />
                        )
                    })}
                </TcGroup>
            ))}
            </div>

            {canWrite && (
                <div className="upload-strip">
                    <tc-file-dropzone ref={dropzone}></tc-file-dropzone>
                    <p className="console-hint">
                        {a.defaultCategoryHint(categories[0]?.name ?? a.uncategorized)}
                    </p>
                </div>
            )}
        </>
    )
}

export default FileList
