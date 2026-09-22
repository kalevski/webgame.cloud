import React from 'react'
import useStrings from 'hooks/useStrings'
import { Project } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

const ConfirmDeleteProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const project = useModalInput<Project>(MODAL.CONFIRM_DELETE_PROJECT)
    const { t } = useStrings()
    const p = t.projects

    return (
        <>
            <p>{p.deleteConfirm(project?.name ?? '')}</p>
            <SheetFooter>
                <tc-button variant="danger" onClick={() => closeModal(project ?? null)}>
                    {p.delete}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ConfirmDeleteProjectModal
