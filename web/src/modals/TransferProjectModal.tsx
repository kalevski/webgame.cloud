import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { Project } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const TransferProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const project = useModalInput<Project>(MODAL.TRANSFER_PROJECT)
    const members = useStore((state) => state.members)
    const transferProject = useStore((state) => state.transferProject)
    const { t } = useStrings()

    const [userId, setUserId] = useState('')
    const [typed, setTyped] = useState('')
    const [saving, setSaving] = useState(false)

    const picker = useTc<ValueElement>({
        items: members
            .filter((member) => !member.isOwner)
            .map((member) => ({ key: member.userId, label: member.name || member.email })),
        onChange: (value: unknown) => setUserId(String(value ?? '')),
    })
    const confirmInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setTyped(String(value ?? '')),
    })

    const confirmed = typed.trim() === project?.name

    const submit = async () => {
        if (!project || !userId) return
        setSaving(true)
        const done = await transferProject(project.id, userId)
        setSaving(false)
        if (done) closeModal(true)
    }

    return (
        <>
            <tc-alert variant="warning">{t.projects.transferHint}</tc-alert>
            <tc-label>{t.projects.ownerLabel}</tc-label>
            <tc-extended-select ref={picker} placeholder={t.projects.transferSearchHint} />
            <tc-form-input ref={confirmInput} label={t.projects.typeToConfirm(project?.name ?? '')} />
            <tc-button
                slot="footer"
                variant="danger"
                disabled={!confirmed || !userId || saving || undefined}
                onClick={submit}
            >
                {t.projects.transfer}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default TransferProjectModal
