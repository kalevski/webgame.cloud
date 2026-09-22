import React from 'react'
import useStrings from 'hooks/useStrings'
import { ProjectMember } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

const RemoveMemberModal: React.FC = () => {
    const closeModal = useModalClose()
    const member = useModalInput<ProjectMember>(MODAL.REMOVE_MEMBER)
    const { t } = useStrings()

    return (
        <>
            <p>{t.members.removeConfirm(member?.name || member?.email || '')}</p>
            <SheetFooter>
                <tc-button variant="danger" onClick={() => closeModal(member ?? null)}>
                    {t.members.remove}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default RemoveMemberModal
