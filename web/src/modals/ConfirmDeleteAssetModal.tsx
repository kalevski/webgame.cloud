import React from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { formatBytes } from 'helpers/format'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

export type DeleteAssetInput = {
    projectId: string
    assetId: string
}

const ConfirmDeleteAssetModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<DeleteAssetInput>(MODAL.DELETE_ASSET)
    const { t } = useStrings()
    const a = t.assets

    const assets = useStore((state) => state.assets)
    const asset = assets.find((entry) => entry.id === input?.assetId) ?? null
    const children = asset ? assets.filter((entry) => entry.parentAssetId === asset.id) : []

    return (
        <>
            <tc-alert variant="danger" hidden={!asset || undefined}>
                {asset ? a.deleteConfirm(asset.name) : ''}
            </tc-alert>

            <tc-text variant="muted" hidden={!asset || undefined}>
                {asset ? a.deleteSize(formatBytes(asset.sizeBytes)) : ''}
            </tc-text>

            {children.length > 0 && <tc-alert variant="warning">{a.deleteChildrenWarning(children.length)}</tc-alert>}

            <SheetFooter>

                <tc-button variant="danger" disabled={!asset || undefined} onClick={() => closeModal(true)}>
                    {a.delete}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ConfirmDeleteAssetModal
