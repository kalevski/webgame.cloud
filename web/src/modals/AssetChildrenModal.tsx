import React from 'react'
import { TcFile } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useModalInput } from 'modals'
import { MODAL } from 'modals/keys'

export type AssetChildrenInput = {
    projectId: string
    assetId: string
}

const AssetChildrenModal: React.FC = () => {
    const { t } = useStrings()
    const a = t.assets

    const input = useModalInput<AssetChildrenInput>(MODAL.ASSET_CHILDREN)
    const assets = useStore((state) => state.assets)

    const parent = assets.find((entry) => entry.id === input?.assetId)
    const children = assets.filter((entry) => entry.parentAssetId === input?.assetId)

    return (
        <div className="asset-children">
            <tc-text variant="muted">{a.childrenIntro}</tc-text>

            {children.length === 0 ? (
                <tc-empty-state icon="link">{a.childrenEmpty}</tc-empty-state>
            ) : (
                <div className="asset-children__list">
                    {children.map((child) => (
                        <TcFile
                            key={child.id}
                            name={child.name}
                            extension={child.extension}
                            format={child.mime}
                            size={child.sizeBytes}
                            readonly
                        />
                    ))}
                </div>
            )}

            {parent && <tc-helper-text icon="Info">{a.childrenDetachHint}</tc-helper-text>}
        </div>
    )
}

export default AssetChildrenModal
