import React, { useState } from 'react'
import { TcFile } from 'lib/tc'
import { useTc } from '@toolcase/web-components/react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useModalInput } from 'modals'
import { MODAL } from 'modals/keys'
import { useProjectCan } from 'hooks/useProjectCan'
import { EXTENSIONLESS_KINDS } from 'configs/kinds'

export type AssetChildrenInput = {
    projectId: string
    assetId: string
}

const PAGE_SIZE = 8

const AssetChildrenModal: React.FC = () => {
    const { t } = useStrings()
    const a = t.assets

    const input = useModalInput<AssetChildrenInput>(MODAL.ASSET_CHILDREN)
    const assets = useStore((state) => state.assets)
    const deleteAsset = useStore((state) => state.deleteAsset)
    const canWrite = useProjectCan('file.write')

    const [page, setPage] = useState(1)

    const children = assets.filter((entry) => entry.parentAssetId === input?.assetId)
    const pageCount = Math.max(1, Math.ceil(children.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    const visible = children.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const pagination = useTc<HTMLElement>(
        {},
        {
            'tc-page-change': (event: Event) => {
                const next = (event as CustomEvent<{ page: number }>).detail?.page
                if (next) setPage(next)
            },
        }
    )

    return (
        <div className="asset-children">
            <tc-text variant="muted">{a.childrenIntro}</tc-text>

            {children.length === 0 ? (
                <tc-empty-state icon="link">{a.childrenEmpty}</tc-empty-state>
            ) : (
                <div className="asset-children__list">
                    {visible.map((child) => (
                        <div key={child.id} className="asset-children__row">
                            <TcFile
                                name={child.name}
                                extension={EXTENSIONLESS_KINDS.includes(child.kind) ? '' : child.extension}
                                format={a.kindLabels[child.kind]}
                                size={child.sizeBytes}
                                readonly
                                actionIcon={canWrite ? 'Trash2' : undefined}
                                actionLabel={canWrite ? a.delete : undefined}
                                onAction={() => input && void deleteAsset(input.projectId, child.id)}
                            />
                        </div>
                    ))}

                    {pageCount > 1 && (
                        <div className="asset-children__foot">
                            <span className="asset-children__count">
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
        </div>
    )
}

export default AssetChildrenModal
