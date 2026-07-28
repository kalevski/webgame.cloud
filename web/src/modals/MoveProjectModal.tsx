import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const MoveProjectModal: React.FC = () => {
    const closeModal = useModalClose()
    const projectId = useModalInput<string>(MODAL.MOVE_PROJECT)
    const realms = useStore((state) => state.realms)
    const moveProjectToRealm = useStore((state) => state.moveProjectToRealm)
    const { t } = useStrings()

    const [realmId, setRealmId] = useState('')
    const [saving, setSaving] = useState(false)

    const picker = useTc<ValueElement>({
        options: realms
            .filter((realm) => realm.status !== 'offline')
            .map((realm) => ({
                key: realm.id,
                label: realm.name,
                description: `${realm.region || '—'} · ${realm.projectCount}${realm.exclusive ? ' · exclusive' : ''}`,
            })),
        onChange: (value: unknown) => setRealmId(String(value ?? '')),
    })

    const submit = async () => {
        if (!projectId || !realmId) return
        setSaving(true)
        const done = await moveProjectToRealm(projectId, realmId)
        setSaving(false)
        if (done) closeModal(true)
    }

    return (
        <>
            <tc-alert variant="warning">{t.realms.moveHint}</tc-alert>
            <tc-card-options ref={picker} />
            <tc-button slot="footer" variant="primary" disabled={!realmId || saving || undefined} onClick={submit}>
                {t.realms.moveTitle}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default MoveProjectModal
