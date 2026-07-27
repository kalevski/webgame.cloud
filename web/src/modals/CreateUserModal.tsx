import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { isOptionalText, withinMaxLen } from 'helpers/validation'
import { useStore } from 'state'
import { UserRole } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

export type CreateUserResult = { email: string; name?: string; role: UserRole }

const CreateUserModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.CREATE_USER)
    const { t } = useStrings()
    const s = t.usersAdmin

    const roles = useStore((state) => state.roles)
    const accessPolicy = useStore((state) => state.accessPolicy)
    const defaultRole = accessPolicy?.bindings.default ?? 'member'

    const [email, setEmail] = useState('')
    const [name, setName] = useState('')

    const role = useRef<UserRole>(defaultRole)

    const emailInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (v: unknown) => setEmail(String(v ?? '')),
    })
    const nameInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (v: unknown) => setName(String(v ?? '')),
        validate: (v: unknown) => (!withinMaxLen(String(v ?? ''), 200) ? t.validation.tooLong(200) : ''),
    })
    const roleSelect = useTc<ValueElement>({
        items: roles.map((entry) => ({ key: entry.id, label: entry.name })),
        onChange: (next: string) => {
            role.current = next as UserRole
        },
    })

    useEffect(() => {
        if (!isOpen) return
        setEmail('')
        setName('')
        role.current = defaultRole
        if (emailInput.current) emailInput.current.value = ''
        if (nameInput.current) nameInput.current.value = ''
        const el = roleSelect.current
        const frame = requestAnimationFrame(() => {
            if (el) el.value = defaultRole
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, defaultRole, roles.length, emailInput, nameInput, roleSelect])

    const valid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
        withinMaxLen(email, 200) &&
        isOptionalText(name, 200)

    const handleConfirm = () => {
        if (!valid) return
        closeModal({
            email: email.trim(),
            name: name.trim() || undefined,
            role: role.current,
        } satisfies CreateUserResult)
    }

    return (
        <>
            <p>{s.createHint}</p>
            <tc-form-input
                ref={emailInput}
                type="email"
                label={s.createEmailLabel}
                placeholder={s.createEmailPlaceholder}
                required
            ></tc-form-input>
            <tc-form-input ref={nameInput} type="text" label={s.createNameLabel}></tc-form-input>
            <tc-label>{s.createRoleLabel}</tc-label>
            <tc-extended-select ref={roleSelect} placeholder={s.createRoleLabel}></tc-extended-select>
            <tc-button slot="footer" variant="primary" disabled={!valid || undefined} onClick={handleConfirm}>
                {s.createSubmit}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default CreateUserModal
