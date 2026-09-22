import React from 'react'
import useStrings from 'hooks/useStrings'
import { Realm } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

const ConfirmDeleteRealmModal: React.FC = () => {
    const closeModal = useModalClose()
    const realm = useModalInput<Realm>(MODAL.DELETE_REALM)
    const { t } = useStrings()
    const r = t.realms

    return (
        <>
            <p>{r.deleteConfirm(realm?.name ?? '')}</p>
            <SheetFooter>
                <tc-button variant="danger" onClick={() => closeModal(realm ?? null)}>
                    {r.deleteTitle}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ConfirmDeleteRealmModal
