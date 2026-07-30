import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { detailValue, useTc } from '@toolcase/web-components/react'
import FilterBar, { FilterRow } from 'components/FilterBar'
import { MODAL, useModalOpen } from 'modals'
import { EditAssetInput } from 'modals/EditAssetModal'
import { DeleteAssetInput } from 'modals/ConfirmDeleteAssetModal'
import { AssetChildrenInput } from 'modals/AssetChildrenModal'
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

const PAGE_SIZE = 25

const ALL = '__all__'
const NONE = '__none__'

const FileList: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const a = t.assets

    const assets = useStore((state) => state.assets)
    const assetsLoaded = useStore((state) => state.assetsLoaded)
    const queue = useStore((state) => state.queue)
    const dirty = useStore((state) => state.dirty)
    const rejected = useStore((state) => state.rejected)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const fetchAssets = useStore((state) => state.fetchAssets)
    const fetchCategoriesAndTags = useStore((state) => state.fetchCategoriesAndTags)
    const enqueueUploads = useStore((state) => state.enqueueUploads)
    const stageEdit = useStore((state) => state.stageEdit)
    const discardEdits = useStore((state) => state.discardEdits)
    const saveEdits = useStore((state) => state.saveEdits)
    const deleteAsset = useStore((state) => state.deleteAsset)

    const canWrite = useProjectCan('file.write')
    const dropzone = useRef<HTMLElement & { supported?: unknown }>(null)

    const [category, setCategory] = useState<string>(ALL)
    const [tagFilter, setTagFilter] = useState<string[]>([])
    const [page, setPage] = useState(1)

    useEffect(() => {
        void fetchAssets(project.id)
        void fetchCategoriesAndTags(project.id)
    }, [project.id, fetchAssets, fetchCategoriesAndTags])

    useEffect(() => {
        const element = dropzone.current
        if (!element) return
        element.supported = SUPPORTED
        const listener = (raw: Event) => {
            const files = (raw as CustomEvent<{ files: File[] }>).detail?.files ?? []
            if (files.length > 0) void enqueueUploads(project.id, files, categoriesAndTags?.categories[0]?.id)
        }
        element.addEventListener('tc-files', listener)
        return () => element.removeEventListener('tc-files', listener)
    })

    const pendingDelete = useRef<string | null>(null)

    const openEditor = useModalOpen<boolean, EditAssetInput>(MODAL.EDIT_ASSET)

    const openChildren = useModalOpen<void, AssetChildrenInput>(MODAL.ASSET_CHILDREN)

    const openDeleteModal = useModalOpen<boolean, DeleteAssetInput>(MODAL.DELETE_ASSET, (confirmed) => {
        const assetId = pendingDelete.current
        pendingDelete.current = null
        if (confirmed && assetId) void deleteAsset(project.id, assetId)
    })

    const openDelete = (input: DeleteAssetInput) => {
        pendingDelete.current = input.assetId
        openDeleteModal(input)
    }

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

    const categories = categoriesAndTags?.categories ?? []
    const tagPool = useMemo(() => (categoriesAndTags?.tags ?? []).map((tag) => tag.name), [categoriesAndTags])

    const tagFilterInput = useTc<HTMLElement>(
        { value: tagFilter, recommendations: tagPool },
        {
            'tc-change': (event: Event) => {
                setTagFilter(detailValue<string[]>(event as CustomEvent) ?? [])
                setPage(1)
            },
        }
    )

    const tally = useMemo(() => {
        const byCategory = new Map<string, number>()
        const children = new Map<string, number>()
        let uncategorized = 0
        for (const asset of assets) {
            if (asset.categoryId) byCategory.set(asset.categoryId, (byCategory.get(asset.categoryId) ?? 0) + 1)
            else uncategorized += 1
            if (asset.parentAssetId) {
                children.set(asset.parentAssetId, (children.get(asset.parentAssetId) ?? 0) + 1)
            }
        }
        return { byCategory, children, uncategorized }
    }, [assets])

    const withDraft = (asset: AssetFile): AssetFile => {
        const patch = dirty[asset.id]
        if (!patch) return asset
        return {
            ...asset,
            name: patch.name ?? asset.name,
            tags: patch.tags ?? asset.tags,
        }
    }

    const filtered = useMemo(
        () =>
            assets.filter((asset) => {
                if (category === NONE && asset.categoryId) return false
                if (category !== ALL && category !== NONE && asset.categoryId !== category) return false
                const tags = dirty[asset.id]?.tags ?? asset.tags
                return tagFilter.every((tag) => tags.includes(tag))
            }),
        [assets, category, tagFilter, dirty]
    )

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const pagination = useTc<HTMLElement>(
        {},
        {
            'tc-page-change': (event: Event) => {
                const next = (event as CustomEvent<{ page: number }>).detail?.page
                if (next) setPage(next)
            },
        }
    )

    const tags = useMemo(
        () =>
            (categoriesAndTags?.tags ?? []).map((tag): TcFileTag => ({
                id: tag.name,
                label: tag.name,
            })),
        [categoriesAndTags]
    )

    const chips = [
        { id: ALL, label: a.filterCategoryAll, count: assets.length },
        { id: NONE, label: a.uncategorized, count: tally.uncategorized },
        ...categories.map((entry) => ({
            id: entry.id,
            label: entry.name,
            count: tally.byCategory.get(entry.id) ?? 0,
        })),
    ]

    const menuFor = (asset: AssetFile, childCount: number): TcActionItem[] => {
        if (!canWrite) return []
        if (asset.uploadStatus !== 'ready') {
            return childCount > 0 ? [{ key: 'children', label: a.childrenOpen(childCount), icon: 'link' }] : []
        }
        return [
            ...(childCount > 0 ? [{ key: 'children', label: a.childrenOpen(childCount), icon: 'link' }] : []),
            ...tagPool.map((tag) => ({
                key: `tag:${tag}`,
                label: asset.tags.includes(tag) ? a.menuRemoveTag(tag) : a.menuAddTag(tag),
                icon: asset.tags.includes(tag) ? 'x' : 'plus',
            })),
            ...categories
                .filter((entry) => entry.id !== asset.categoryId)
                .map((entry) => ({ key: `cat:${entry.id}`, label: a.menuMoveTo(entry.name), icon: 'folder' })),
            ...(asset.categoryId ? [{ key: 'cat:none', label: a.menuUncategorize, icon: 'folder' }] : []),
            { key: 'edit', label: a.edit, icon: 'pencil' },
            { key: 'delete', label: a.delete, icon: 'trash' },
        ]
    }

    const runMenu = (asset: AssetFile, key: string) => {
        if (key === 'children') {
            openChildren({ projectId: project.id, assetId: asset.id })
            return
        }
        if (key === 'edit') {
            openEditor({ projectId: project.id, assetId: asset.id })
            return
        }
        if (key === 'delete') {
            openDelete({ projectId: project.id, assetId: asset.id })
            return
        }
        if (key.startsWith('tag:')) {
            const tag = key.slice(4)
            const next = asset.tags.includes(tag)
                ? asset.tags.filter((entry) => entry !== tag)
                : [...asset.tags, tag]
            stageEdit({ id: asset.id, tags: next })
            return
        }
        if (key.startsWith('cat:')) {
            const id = key.slice(4)
            stageEdit({ id: asset.id, categoryId: id === 'none' ? null : id })
        }
    }

    const filterRows: FilterRow[] = [
        {
            key: 'category',
            legend: a.filterCategoryLabel,
            chips,
            value: category,
            onChange: (id) => {
                setCategory(id ?? ALL)
                setPage(1)
            },
        },
        {
            key: 'tags',
            legend: a.filterTagLabel,
            control: (
                <tc-tag-input
                    ref={tagFilterInput}
                    placeholder={a.filterTagPlaceholder}
                />
            ),
        },
    ]

    const filtersActive = category !== ALL || tagFilter.length > 0

    const clearFilters = () => {
        setCategory(ALL)
        setTagFilter([])
        setPage(1)
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

            {!isEmpty && (
                <FilterBar
                    rows={filterRows}
                    total={assets.length}
                    matches={filtered.length}
                    unit={assets.length === 1 ? a.fileWord : a.filesWord}
                    active={filtersActive}
                    onClear={clearFilters}
                />
            )}

            {!isEmpty && (
                <div className="asset-list">
                    {visible.map((asset) => {
                        const displayed = withDraft(asset)
                        const childCount = tally.children.get(asset.id) ?? 0
                        return (
                            <TcFile
                                key={asset.id}
                                name={displayed.name}
                                extension={displayed.extension}
                                format={displayed.mime}
                                size={displayed.sizeBytes}
                                items={childCount}
                                tags={tags}
                                tagIds={displayed.tags}
                                menuItems={menuFor(displayed, childCount)}
                                readonly={!canWrite || undefined}
                                loading={(displayed.uploadStatus === 'processing') || undefined}
                                onNameChange={(name) => {
                                    const next = name.trim()
                                    if (next && next !== asset.name) stageEdit({ id: asset.id, name: next })
                                }}
                                onTagsChange={(tagIds) => stageEdit({ id: asset.id, tags: tagIds })}
                                onMenuItemClick={(key) => runMenu(displayed, key)}
                            />
                        )
                    })}

                    {filtered.length === 0 && (
                        <div className="console-empty">
                            <p className="console-empty__title">{a.noMatches}</p>
                            <p className="console-empty__body">{a.noMatchesBody}</p>
                            <tc-button variant="secondary" outline onClick={clearFilters}>
                                {a.filterClear}
                            </tc-button>
                        </div>
                    )}

                    {pageCount > 1 && (
                        <div className="asset-list__foot">
                            <span className="asset-list__count">
                                {a.filterPage(currentPage, pageCount)}
                            </span>
                            <tc-pagination
                                ref={pagination}
                                current={currentPage}
                                total={pageCount}
                                align="end"
                                size="sm"
                            ></tc-pagination>
                        </div>
                    )}
                </div>
            )}

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
