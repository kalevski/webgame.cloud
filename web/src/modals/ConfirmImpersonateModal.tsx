import React from 'react'
import useStrings from 'hooks/useStrings'
import { User } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

const ConfirmImpersonateModal: React.FC = () => {
    const closeModal = useModalClose()
    const user = useModalInput<User>(MODAL.IMPERSONATE_USER)
    const { t } = useStrings()

    return (
        <>
            <p>{t.usersAdmin.loginAsConfirm(user?.name || user?.email || '')}</p>
            <tc-button slot="footer" variant="primary" onClick={() => closeModal(user ?? null)}>
                {t.usersAdmin.loginAsCta}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ConfirmImpersonateModal
