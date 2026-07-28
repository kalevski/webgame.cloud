import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { Project } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const ArchiveProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const project = useModalInput<Project>(MODAL.ARCHIVE_PROJECT)
    const archiveProject = useStore((state) => state.archiveProject)
    const { t } = useStrings()

    const [typed, setTyped] = useState('')
    const [saving, setSaving] = useState(false)

    const confirmInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setTyped(String(value ?? '')),
    })

    const archiving = !project?.archivedAt
    const confirmed = typed.trim() === project?.name

    const submit = async () => {
        if (!project) return
        setSaving(true)
        const done = await archiveProject(project.id, archiving)
        setSaving(false)
        if (done) closeModal(true)
    }

    return (
        <>
            <tc-alert variant="warning">{t.projects.archivedBanner}</tc-alert>
            <tc-form-input
                ref={confirmInput}
                hidden={!archiving || undefined}
                label={t.projects.typeToConfirm(project?.name ?? '')}
            />
            <tc-button
                slot="footer"
                variant="warning"
                disabled={(archiving && !confirmed) || saving || undefined}
                onClick={submit}
            >
                {archiving ? t.projects.archive : t.projects.unarchive}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ArchiveProjectModal
