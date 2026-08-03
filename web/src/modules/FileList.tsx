import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    TcAlert,
    TcFile,
    TcFileTag,
    TcGroup,
    TcProgressBar,
    TcSkeleton,
} from 'lib/tc'
import FloatingActionBar from 'components/FloatingActionBar'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { detailValue, useTc } from '@toolcase/web-components/react'
import FilterBar, { FilterRow } from 'components/FilterBar'
import UploadDropzone from 'components/UploadDropzone'
import { MODAL, useModalOpen } from 'modals'
import { DeleteAssetInput } from 'modals/ConfirmDeleteAssetModal'
import { AssetChildrenInput } from 'modals/AssetChildrenModal'
import { ASSET_KIND_TO_FORMAT_KIND, EXTENSIONLESS_KINDS, KIND_COLORS } from 'configs/kinds'
import { AssetFile, Project } from 'types'

type Props = {
    project: Project
}

const PAGE_SIZE = 25

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

    const [categoryFilter, setCategoryFilter] = useState<string[]>([])
    const [tagFilter, setTagFilter] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [uploadCategory, setUploadCategory] = useState('')
    const [uploadTags, setUploadTags] = useState<string[]>([])

    useEffect(() => {
        void fetchAssets(project.id)
        void fetchCategoriesAndTags(project.id)
    }, [project.id, fetchAssets, fetchCategoriesAndTags])

    const seededProject = useRef('')

    useEffect(() => {
        if (!categoriesAndTags || seededProject.current === project.id) return
        seededProject.current = project.id
        setUploadCategory(project.defaultCategoryId ?? categoriesAndTags.categories[0]?.id ?? '')
        setUploadTags([])
    }, [categoriesAndTags, project.id, project.defaultCategoryId])

    const pendingDelete = useRef<string | null>(null)

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

    const categories = useMemo(() => categoriesAndTags?.categories ?? [], [categoriesAndTags])
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
            categoryId: patch.categoryId !== undefined ? patch.categoryId : asset.categoryId,
        }
    }

    const filtered = useMemo(() => {
        const selected = new Set(categoryFilter)
        return assets.filter((asset) => {
            if (selected.size > 0 && !selected.has(asset.categoryId ?? NONE)) return false
            const tags = new Set(dirty[asset.id]?.tags ?? asset.tags)
            return tagFilter.every((tag) => tags.has(tag))
        })
    }, [assets, categoryFilter, tagFilter, dirty])

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
        { id: NONE, label: a.uncategorized, count: tally.uncategorized },
        ...categories.map((entry) => ({
            id: entry.id,
            label: entry.name,
            count: tally.byCategory.get(entry.id) ?? 0,
        })),
    ]

    const categoryItems = useMemo(
        () => [
            { key: NONE, label: a.uncategorized },
            ...categories.map((entry) => ({ key: entry.id, label: entry.name })),
        ],
        [categories, a.uncategorized]
    )

    const uploadCategoryOptions = useMemo(
        () => categories.map((entry) => ({ key: entry.id, label: entry.name })),
        [categories]
    )

    const uploadTagOptions = useMemo(() => tagPool.map((name) => ({ key: name, label: name })), [tagPool])

    const handleListClick = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement
        if (!target.closest('.tc-file-items')) return
        const row = target.closest<HTMLElement>('[data-asset-id]')
        const assetId = row?.dataset.assetId
        if (assetId) openChildren({ projectId: project.id, assetId })
    }

    const filterRows: FilterRow[] = [
        {
            key: 'category',
            legend: a.filterCategoryLabel,
            chips,
            values: categoryFilter,
            onChange: (ids: string[]) => {
                setCategoryFilter(ids)
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

    const filtersActive = categoryFilter.length > 0 || tagFilter.length > 0

    const clearFilters = () => {
        setCategoryFilter([])
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

            {canWrite && (
                <UploadDropzone
                    onFiles={(files) => {
                        if (files.length === 0) return
                        void enqueueUploads(project.id, files, {
                            categoryId: uploadCategory || undefined,
                            tags: uploadTags,
                        })
                    }}
                    categories={uploadCategoryOptions}
                    tags={uploadTagOptions}
                    categoryId={uploadCategory}
                    tagIds={uploadTags}
                    onCategoryChange={setUploadCategory}
                    onTagsChange={setUploadTags}
                />
            )}

            {isEmpty && (
                <div className="console-empty">
                    <p className="console-empty__title">{a.emptyTitle}</p>
                    <p className="console-empty__body">{a.emptyBody}</p>
                </div>
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
                <div className="asset-list" role="presentation" onClick={handleListClick}>
                    {visible.map((asset) => {
                        const displayed = withDraft(asset)
                        const childCount = tally.children.get(asset.id) ?? 0
                        return (
                            <div key={asset.id} className="asset-list__row" data-asset-id={asset.id}>
                                <TcFile
                                    style={{ '--bs-file-icon-color': KIND_COLORS[ASSET_KIND_TO_FORMAT_KIND[asset.kind]] } as React.CSSProperties}
                                    name={displayed.name}
                                    extension={EXTENSIONLESS_KINDS.includes(asset.kind) ? '' : displayed.extension}
                                    format={a.kindLabels[asset.kind]}
                                    size={displayed.sizeBytes}
                                    items={childCount}
                                    tags={tags}
                                    tagIds={displayed.tags}
                                    editableTags={canWrite || undefined}
                                    categories={categoryItems}
                                    category={displayed.categoryId ?? NONE}
                                    readonly={!canWrite || undefined}
                                    loading={(displayed.uploadStatus === 'processing') || undefined}
                                    actionIcon={canWrite && asset.uploadStatus === 'ready' ? 'Trash2' : undefined}
                                    actionLabel={canWrite && asset.uploadStatus === 'ready' ? a.delete : undefined}
                                    onNameChange={(name) => {
                                        const next = name.trim()
                                        if (next && next !== asset.name) stageEdit({ id: asset.id, name: next })
                                    }}
                                    onTagsChange={(tagIds) => stageEdit({ id: asset.id, tags: tagIds })}
                                    onCategoryChange={(key) => stageEdit({ id: asset.id, categoryId: key === NONE ? null : key })}
                                    onAction={() => openDelete({ projectId: project.id, assetId: asset.id })}
                                />
                            </div>
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
            <FloatingActionBar label={a.unsavedHint} visible={canWrite && Object.keys(dirty).length > 0}>
                <tc-button key="discard" variant="secondary" outline onClick={discardEdits}>
                    {a.discard}
                </tc-button>
                <tc-button key="save" variant="primary" onClick={() => void saveEdits(project.id)}>
                    {a.save}
                </tc-button>
            </FloatingActionBar>
        </>
    )
}

export default FileList
