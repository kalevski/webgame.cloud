import React from 'react'
import useStrings from 'hooks/useStrings'
import { Task } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

const ConfirmDeleteTaskModal: React.FC = () => {
    const closeModal = useModalClose()
    const task = useModalInput<Task>(MODAL.CONFIRM_DELETE_TASK)
    const { t } = useStrings()
    const p = t.projects

    return (
        <>
            <p>{p.deleteTaskConfirm(task?.title ?? '')}</p>
            <tc-button slot="footer" variant="danger" onClick={() => closeModal(task ?? null)}>
                {p.deleteTask}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ConfirmDeleteTaskModal
