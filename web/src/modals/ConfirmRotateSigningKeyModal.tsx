import React from 'react'
import useStrings from 'hooks/useStrings'
import { SigningKey } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

const ConfirmRotateSigningKeyModal: React.FC = () => {
    const closeModal = useModalClose()
    const key = useModalInput<SigningKey>(MODAL.CONFIRM_ROTATE_SIGNING_KEY)
    const { t } = useStrings()
    const s = t.signingKeys

    return (
        <>
            <p>{s.rotatePrompt(key?.label ?? '')}</p>
            <SheetFooter>
                <tc-button variant="danger" onClick={() => closeModal(key ?? null)}>
                    {s.rotateConfirm}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ConfirmRotateSigningKeyModal
