import React from 'react'
import useStrings from 'hooks/useStrings'
import { SigningKey } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

const ConfirmRotateSigningKeyModal: React.FC = () => {
    const closeModal = useModalClose()
    const key = useModalInput<SigningKey>(MODAL.CONFIRM_ROTATE_SIGNING_KEY)
    const { t } = useStrings()
    const s = t.signingKeys

    return (
        <>
            <p>{s.rotatePrompt(key?.label ?? '')}</p>
            <tc-button slot="footer" variant="danger" onClick={() => closeModal(key ?? null)}>
                {s.rotateConfirm}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ConfirmRotateSigningKeyModal
