import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { Project } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, SheetFooter } from './registry'

const LeaveProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const project = useModalInput<Project>(MODAL.LEAVE_PROJECT)
    const leaveProject = useStore((state) => state.leaveProject)
    const { t } = useStrings()
    const [saving, setSaving] = useState(false)

    const submit = async () => {
        if (!project) return
        setSaving(true)
        try {
            const done = await leaveProject(project.id)
            if (done) closeModal(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <p>{t.projects.leaveConfirm(project?.name ?? '')}</p>
            <SheetFooter>
                <tc-button variant="danger" disabled={saving || undefined} onClick={submit}>
                    {t.projects.leave}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default LeaveProjectModal
