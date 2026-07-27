import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const CONFIRM_WORD = 'DELETE'

const ConfirmDeleteAccountModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.DELETE_ACCOUNT)
    const { t } = useStrings()
    const [value, setValue] = useState('')

    const confirmInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (next: unknown) => setValue(String(next ?? '')),
    })

    useEffect(() => {
        if (!isOpen) return
        setValue('')
        if (confirmInput.current) confirmInput.current.value = ''
    }, [isOpen, confirmInput])

    return (
        <>
            <p>{t.modal.deleteAccountBody}</p>
            <tc-label>{t.modal.deleteAccountHint(CONFIRM_WORD)}</tc-label>
            <tc-form-input ref={confirmInput} placeholder={CONFIRM_WORD}></tc-form-input>
            <tc-button
                slot="footer"
                variant="danger"
                disabled={value !== CONFIRM_WORD || undefined}
                onClick={() => closeModal(true)}
            >
                {t.modal.confirmDeleteAccount}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ConfirmDeleteAccountModal
