import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { useProjectPermissions } from 'hooks/useProjectCan'
import { PROJECT_PERMISSION_LABELS, ProjectMember, ProjectPermission } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const EditMemberPermissionsModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<{ projectId: string; member: ProjectMember }>(MODAL.EDIT_MEMBER_PERMISSIONS)
    const updateMemberPermissions = useStore((state) => state.updateMemberPermissions)
    const held = useProjectPermissions()
    const { t } = useStrings()

    const [permissions, setPermissions] = useState<ProjectPermission[]>(input?.member.permissions ?? [])
    const [saving, setSaving] = useState(false)

    const group = useTc<ValueElement>({
        options: held.map((permission) => ({ key: permission, label: PROJECT_PERMISSION_LABELS[permission] })),
        defaultValue: input?.member.permissions ?? [],
        onChange: (value: unknown) => setPermissions((value ?? []) as ProjectPermission[]),
    })

    const submit = async () => {
        if (!input) return
        setSaving(true)
        const saved = await updateMemberPermissions(input.projectId, input.member.id, permissions)
        setSaving(false)
        if (saved) closeModal(true)
    }

    return (
        <>
            <tc-checkbox-group ref={group} label={t.members.invitePermissionsLabel} />
            <tc-button slot="footer" variant="primary" disabled={saving || undefined} onClick={submit}>
                {t.projects.save}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default EditMemberPermissionsModal
