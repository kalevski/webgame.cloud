import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { isRequiredText } from 'helpers/validation'
import { useStore } from 'state'
import { OWNER_ROLE_ID, UserRole } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

export type CreateServiceAccountResult = { name: string; role: UserRole }

const CreateServiceAccountModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.CREATE_SERVICE_ACCOUNT)
    const { t } = useStrings()
    const s = t.serviceAccounts

    const roles = useStore((state) => state.roles)
    const accessPolicy = useStore((state) => state.accessPolicy)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)
    const defaultRole = accessPolicy?.bindings.default ?? 'indie'

    const [name, setName] = useState('')
    const role = useRef<UserRole>(defaultRole)

    const nameInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const roleSelect = useTc<ValueElement>({
        items: roles.flatMap((entry) => (entry.id === OWNER_ROLE_ID ? [] : [{ key: entry.id, label: entry.name }])),
        onChange: (next: string) => {
            role.current = next as UserRole
        },
    })

    useEffect(() => {
        if (!isOpen) return
        if (!accessPolicy) void fetchAccessPolicy()
    }, [isOpen, accessPolicy, fetchAccessPolicy])

    useEffect(() => {
        if (!isOpen) return
        setName('')
        role.current = defaultRole
        if (nameInput.current) nameInput.current.value = ''
        const el = roleSelect.current
        const frame = requestAnimationFrame(() => {
            if (el) el.value = defaultRole
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, defaultRole, roles.length, nameInput, roleSelect])

    const valid = isRequiredText(name, 80)

    const handleConfirm = () => {
        if (!valid) return
        closeModal({ name: name.trim(), role: role.current } satisfies CreateServiceAccountResult)
    }

    return (
        <>
            <p>{s.intro}</p>
            <tc-form-input
                ref={nameInput}
                type="text"
                label={s.nameLabel}
                placeholder={s.namePlaceholder}
                required
            ></tc-form-input>
            <tc-label>{s.roleLabel}</tc-label>
            <tc-extended-select ref={roleSelect} placeholder={s.roleLabel}></tc-extended-select>
            <tc-helper-text>{s.roleHint}</tc-helper-text>
            <tc-button slot="footer" variant="primary" disabled={!valid || undefined} onClick={handleConfirm}>
                {s.create}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default CreateServiceAccountModal
