import React from 'react'
import useStrings from 'hooks/useStrings'
import { RealmToken } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

const RealmTokenModal: React.FC = () => {
    const closeModal = useModalClose()
    const issued = useModalInput<RealmToken>(MODAL.REALM_TOKEN)
    const { t } = useStrings()

    return (
        <>
            <tc-alert variant="warning">{t.realms.tokenHint}</tc-alert>
            <tc-code-snippet code={issued?.token ?? ''} />
            <tc-button slot="footer" variant="primary" onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default RealmTokenModal
