import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { useProjectPermissions } from 'hooks/useProjectCan'
import { PROJECT_PERMISSION_HINTS, PROJECT_PERMISSION_LABELS, ProjectPermission } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const InviteMemberModal: React.FC = () => {
    const closeModal = useModalClose()
    const projectId = useModalInput<string>(MODAL.INVITE_MEMBER)
    const sendInvite = useStore((state) => state.sendInvite)
    const held = useProjectPermissions()
    const { t } = useStrings()
    const m = t.members

    const [email, setEmail] = useState('')
    const [permissions, setPermissions] = useState<ProjectPermission[]>([])
    const [saving, setSaving] = useState(false)

    const emailInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setEmail(String(value ?? '')),
    })
    const permissionSelect = useTc<ValueElement>(
        {
            items: held.map((permission) => ({
                key: permission,
                label: PROJECT_PERMISSION_LABELS[permission],
                description: PROJECT_PERMISSION_HINTS[permission],
            })),
            values: permissions,
        },
        {
            'tc-change': (event: Event) =>
                setPermissions(
                    ((event as CustomEvent<{ value: string[] }>).detail?.value ?? []) as ProjectPermission[]
                ),
        }
    )

    const submit = async () => {
        if (!projectId) return
        setSaving(true)
        try {
            const sent = await sendInvite(projectId, { email: email.trim(), permissions })
            if (sent) closeModal(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <tc-form-input ref={emailInput} type="email" label={m.inviteEmailLabel} required />
            <tc-label>{m.invitePermissionsLabel}</tc-label>
            <tc-extended-select
                ref={permissionSelect}
                multiple
                placeholder={m.readOnlyLabel}
                search-placeholder={m.permissionSearch}
                max-height="220"
            ></tc-extended-select>
            <tc-alert variant="info">{m.inviteReadOnlyHint}</tc-alert>
            <tc-button
                slot="footer"
                variant="primary"
                disabled={saving || email.trim().length === 0 || undefined}
                onClick={submit}
            >
                {m.invite}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default InviteMemberModal
