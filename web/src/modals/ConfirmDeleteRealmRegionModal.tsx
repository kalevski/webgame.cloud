import React from 'react'
import useStrings from 'hooks/useStrings'
import { RealmRegion } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

const ConfirmDeleteRealmRegionModal: React.FC = () => {
    const closeModal = useModalClose()
    const region = useModalInput<RealmRegion>(MODAL.DELETE_REALM_REGION)
    const { t } = useStrings()
    const r = t.realms

    return (
        <>
            <p>{r.regionDeleteConfirm(region?.name ?? '')}</p>
            <tc-button slot="footer" variant="danger" onClick={() => closeModal(region ?? null)}>
                <span>{r.regionDelete}</span>
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                <span>{t.modal.cancel}</span>
            </tc-button>
        </>
    )
}

export default ConfirmDeleteRealmRegionModal
