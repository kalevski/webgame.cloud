import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen, SheetFooter } from './registry'

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
            <div className="app-sheet-form">
                <p>{t.modal.deleteAccountBody}</p>
                <div className="app-sheet-field">
                    <tc-label>{t.modal.deleteAccountHint(CONFIRM_WORD)}</tc-label>
                    <tc-form-input ref={confirmInput} placeholder={CONFIRM_WORD}></tc-form-input>
                </div>
            </div>
            <SheetFooter>
                <tc-button
                    variant="danger"
                    disabled={value !== CONFIRM_WORD || undefined}
                    onClick={() => closeModal(true)}
                >
                    {t.modal.confirmDeleteAccount}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ConfirmDeleteAccountModal
