import React, { useEffect, useMemo, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { detailValue, useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { escapeHtml } from 'helpers/html'
import { formatBytes } from 'helpers/format'
import { AssetFile, AssetPatch } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

export type EditAssetInput = {
    projectId: string
    assetId: string
}

type ValueElement = HTMLElement & { value?: unknown; items?: unknown[] }

const tagsFrom = (event: Event): string[] => detailValue<string[]>(event as CustomEvent) ?? []

const EditAssetModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<EditAssetInput>(MODAL.EDIT_ASSET)
    const isOpen = useModalIsOpen(MODAL.EDIT_ASSET)
    const { t } = useStrings()
    const a = t.assets

    const assets = useStore((state) => state.assets)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const applyAssetPatches = useStore((state) => state.applyAssetPatches)

    const asset = assets.find((entry) => entry.id === input?.assetId) ?? null

    const [categoryId, setCategoryId] = useState<string>('')
    const [tags, setTags] = useState<string[]>([])
    const [children, setChildren] = useState<string[]>([])
    const [attachId, setAttachId] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen || !asset) return
        setCategoryId(asset.categoryId ?? '')
        setTags([...asset.tags])
        setChildren(assets.filter((entry) => entry.parentAssetId === asset.id).map((entry) => entry.id))
        setAttachId('')
    }, [isOpen, asset, assets])

    const attachable = useMemo(
        () =>
            assets.filter(
                (entry) =>
                    entry.id !== asset?.id &&
                    !children.includes(entry.id) &&
                    (entry.parentAssetId === null || entry.parentAssetId === undefined)
            ),
        [assets, asset, children]
    )

    const categorySelect = useTc<ValueElement>({
        items: [
            { key: '', label: a.uncategorized },
            ...(categoriesAndTags?.categories ?? []).map((category) => ({ key: category.id, label: category.name })),
        ],
        onChange: (value: unknown) => setCategoryId(String(value ?? '')),
    })

    const tagInput = useTc<ValueElement>(
        {
            value: tags,
            recommendations: (categoriesAndTags?.tags ?? []).map((tag) => tag.name),
        },
        { 'tc-change': (event: Event) => setTags(tagsFrom(event)) }
    )

    const attachSelect = useTc<ValueElement>({
        items: attachable.map((entry) => ({
            key: entry.id,
            label: entry.name,
            description: formatBytes(entry.sizeBytes),
        })),
        onChange: (value: unknown) => setAttachId(String(value ?? '')),
    })

    useEffect(() => {
        if (!isOpen) return
        const frame = requestAnimationFrame(() => {
            if (categorySelect.current) categorySelect.current.value = categoryId
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, categoryId, categorySelect])

    const childRows = useMemo(
        () =>
            children
                .map((childId) => {
                    const child = assets.find((entry) => entry.id === childId)
                    if (!child) return ''
                    return [
                        '<tr>',
                        `<td><strong>${escapeHtml(child.name)}</strong></td>`,
                        `<td>${escapeHtml(child.kind)}</td>`,
                        `<td style="text-align:right">${escapeHtml(formatBytes(child.sizeBytes))}</td>`,
                        `<td style="text-align:right"><span class="table-actions">` +
                            `<tc-icon-button icon="Unlink" variant="danger" size="small" outline data-action="detach" data-id="${escapeHtml(
                                child.id
                            )}" label="${escapeHtml(a.childRemove)}" title="${escapeHtml(a.childRemove)}"></tc-icon-button>` +
                            '</span></td>',
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [children, assets, a]
    )

    const childTable = useTc<ValueElement>({
        columns: [
            { key: 'name', label: a.childName, minWidth: '14rem' },
            { key: 'kind', label: a.childKind },
            { key: 'size', label: a.childSize, align: 'right' },
            { key: 'actions', label: '', align: 'right', minWidth: '3rem' },
        ],
        rows: childRows,
        total: children.length,
        offset: 0,
        limit: Math.max(children.length, 1),
    })

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-action="detach"]')
        if (!trigger) return
        const id = trigger.dataset.id ?? ''
        setChildren((current) => current.filter((entry) => entry !== id))
    }

    const attach = () => {
        if (!attachId) return
        setChildren((current) => [...current, attachId])
        setAttachId('')
        if (attachSelect.current) attachSelect.current.value = ''
    }

    const submit = async () => {
        if (!asset || !input) return
        setSaving(true)

        const before = assets.filter((entry) => entry.parentAssetId === asset.id).map((entry) => entry.id)
        const detached = before.filter((id) => !children.includes(id))
        const attached = children.filter((id) => !before.includes(id))

        const patches: AssetPatch[] = [
            { id: asset.id, categoryId: categoryId || null, tags },
            ...detached.map((id) => ({ id, parentAssetId: null })),
            ...attached.map((id) => ({ id, parentAssetId: asset.id })),
        ]

        const saved = await applyAssetPatches(input.projectId, patches)
        setSaving(false)
        if (saved) closeModal(true)
    }

    return (
        <>
        <div className="asset-editor" role="presentation" onClick={onClick}>
            {!asset && <tc-empty-state icon="file">{a.editMissing}</tc-empty-state>}

            <tc-label hidden={!asset || undefined}>{a.nameLabel}</tc-label>
            <p className="asset-editor__name" hidden={!asset || undefined}>
                <code>{asset?.name ?? ''}</code>
            </p>
            <tc-helper-text icon="Lock" hidden={!asset || undefined}>{a.nameReadonlyHint}</tc-helper-text>

            <tc-label hidden={!asset || undefined}>{a.categoryLabel}</tc-label>
            <tc-extended-select
                hidden={!asset || undefined}
                ref={categorySelect}
                placeholder={a.categoryPlaceholder}
                search-placeholder={a.categorySearch}
                max-height="220"
            ></tc-extended-select>

            <tc-tag-input hidden={!asset || undefined} ref={tagInput} label={a.tagsLabel} help={a.tagsSelectHint} max-height="220" />

            <tc-section-card title={a.childrenTitle} hidden={!asset || undefined}>
                <tc-stack direction="column" gap="0.6rem">
                    <tc-text variant="muted">{a.childrenIntro}</tc-text>

                    <div>
                        <tc-empty-state icon="link" hidden={children.length > 0 || undefined}>
                            {a.childrenEmpty}
                        </tc-empty-state>
                        <tc-advanced-table ref={childTable} hidden={children.length === 0 || undefined}></tc-advanced-table>
                    </div>

                    <div className="asset-editor__attach">
                        <tc-extended-select
                            ref={attachSelect}
                            placeholder={a.childAddPlaceholder}
                            search-placeholder={a.childAddSearch}
                            max-height="220"
                        ></tc-extended-select>
                        <tc-button variant="secondary" outline disabled={!attachId || undefined} onClick={attach}>
                            {a.childAdd}
                        </tc-button>
                    </div>
                </tc-stack>
            </tc-section-card>
        </div>

        <tc-button slot="footer" variant="primary" disabled={saving || !asset || undefined} onClick={submit}>
            {a.save}
        </tc-button>
        <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
            {t.modal.cancel}
        </tc-button>
        </>
    )
}

export default EditAssetModal
