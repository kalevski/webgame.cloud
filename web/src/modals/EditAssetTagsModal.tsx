import React, { useEffect, useRef } from 'react'
import useStrings from 'hooks/useStrings'
import { detailValue, useTc } from '@toolcase/web-components/react'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { defaultValue?: unknown }

export type EditAssetTagsInput = {
    assetId: string
    name: string
    tags: readonly string[]
    recommendations: readonly string[]
}

const NO_TAGS: string[] = []

const EditAssetTagsModal: React.FC = () => {
    const { t } = useStrings()
    const a = t.assets
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.EDIT_ASSET_TAGS)
    const input = useModalInput<EditAssetTagsInput>(MODAL.EDIT_ASSET_TAGS)

    const tags = useRef<string[]>(NO_TAGS)
    const syncedAssetId = useRef('')

    const tagInput = useTc<ValueElement>(
        { recommendations: input?.recommendations ?? NO_TAGS },
        {
            'tc-change': (event: Event) => {
                tags.current = detailValue<string[]>(event as CustomEvent) ?? NO_TAGS
            },
        }
    )

    useEffect(() => {
        if (!isOpen || !input) return
        if (syncedAssetId.current === input.assetId) return
        syncedAssetId.current = input.assetId
        const next = [...input.tags]
        tags.current = next
        const element = tagInput.current
        if (element) element.defaultValue = next
    }, [isOpen, input, tagInput])

    useEffect(() => {
        if (!isOpen) syncedAssetId.current = ''
    }, [isOpen])

    return (
        <>
            <tc-tag-input
                ref={tagInput}
                label={a.tagsLabel}
                help={a.tagsHint}
                allow-create
            ></tc-tag-input>

            <tc-button
                slot="footer"
                variant="primary"
                onClick={() => closeModal({ assetId: input?.assetId ?? '', tags: tags.current })}
            >
                {a.save}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default EditAssetTagsModal
