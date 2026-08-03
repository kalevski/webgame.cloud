import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { isRequiredText } from 'helpers/validation'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

export type PickTemplateInput = {
    kind: 'frame' | 'video'
    templates: Array<{ id: string; name: string; meta: string }>
    defaultName: string
}

export type PickTemplateResult = {
    templateId: string
    name: string
}

const PickTemplateModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.PICK_TEMPLATE)
    const input = useModalInput<PickTemplateInput>(MODAL.PICK_TEMPLATE)
    const { t } = useStrings()
    const k = t.studio

    const [templateId, setTemplateId] = useState('')
    const [name, setName] = useState('')

    useEffect(() => {
        if (!isOpen) return
        setTemplateId(input?.templates[0]?.id ?? '')
        setName(input?.defaultName ?? '')
    }, [isOpen, input])

    const valid = templateId !== '' && isRequiredText(name, 120)

    return (
        <>
            <tc-stack direction="column" gap="0.85rem">
                <tc-text variant="muted">{k.pickTemplateHint}</tc-text>

                <label className="studio-field studio-field--wide">
                    <tc-label>{k.pickTemplate}</tc-label>
                    <select
                        className="form-select"
                        value={templateId}
                        onChange={(event) => setTemplateId(event.target.value)}
                    >
                        {(input?.templates ?? []).map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name} — {template.meta}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="studio-field studio-field--wide">
                    <tc-label>{k.nameLabel}</tc-label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                    />
                </label>
            </tc-stack>

            <tc-button
                slot="footer"
                variant="primary"
                disabled={!valid || undefined}
                onClick={() => {
                    if (!valid) return
                    closeModal({ templateId, name: name.trim() } satisfies PickTemplateResult)
                }}
            >
                {k.newRender}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default PickTemplateModal
