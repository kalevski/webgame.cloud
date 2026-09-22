import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

const RoleApplicationModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.ROLE_APPLICATION)
    const { t } = useStrings()
    const r = t.roleApplications

    const openRoles = useStore((state) => state.openRoles)
    const applyForRole = useStore((state) => state.applyForRole)

    const [roleId, setRoleId] = useState('')
    const [busy, setBusy] = useState(false)

    const message = useRef('')
    const messageEl = useRef<ValueElement | null>(null)

    const roleSelect = useTc<ValueElement>({
        items: openRoles.map((role) => ({ key: role.id, label: role.name })),
        onChange: (next: string) => setRoleId(next),
    })

    useEffect(() => {
        if (!isOpen) return
        const first = openRoles[0]?.id ?? ''
        setRoleId(first)
        message.current = ''

        const frame = requestAnimationFrame(() => {
            if (roleSelect.current) roleSelect.current.value = first
            if (messageEl.current) messageEl.current.value = ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, openRoles, roleSelect])

    const prompt = openRoles.find((role) => role.id === roleId)?.applicationPrompt ?? ''

    const submit = async () => {
        if (!roleId || busy) return
        setBusy(true)
        try {
            const created = await applyForRole({ roleId, message: message.current.trim() })
            if (created) closeModal(created)
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <tc-stack direction="vertical" gap="0.85rem">
                <div>
                    <tc-label>{r.roleLabel}</tc-label>
                    <tc-extended-select
                        ref={roleSelect}
                        search-placeholder={t.common.search}
                        no-results-text={t.common.noResults}
                    ></tc-extended-select>
                    {prompt && <tc-helper-text>{prompt}</tc-helper-text>}
                </div>

                <tc-textarea
                    ref={messageEl}
                    label={r.messageLabel}
                    placeholder={r.messagePlaceholder}
                    rows="4"
                    onInput={(event) => {
                        message.current = String((event.target as ValueElement).value ?? '')
                    }}
                ></tc-textarea>
            </tc-stack>

            <SheetFooter>

                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {r.cancel}
                </tc-button>
                <tc-button variant="primary" disabled={!roleId || busy || undefined} onClick={submit}>
                    {r.submit}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default RoleApplicationModal
