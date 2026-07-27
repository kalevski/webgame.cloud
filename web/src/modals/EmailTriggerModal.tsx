import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { selectedKeys, toKeyList } from 'helpers/select'
import { useTc } from '@toolcase/web-components/react'
import { EMAIL_RECIPIENT_MODES, EmailRecipientMode } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

const EmailTriggerModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.EMAIL_TRIGGER)
    const { t } = useStrings()
    const e = t.email

    const templates = useStore((state) => state.emailTemplates)
    const actions = useStore((state) => state.emailActions)
    const recipients = useStore((state) => state.emailRecipients)
    const roles = useStore((state) => state.roles)
    const saveEmailTrigger = useStore((state) => state.saveEmailTrigger)

    const [action, setAction] = useState('')
    const [templateKey, setTemplateKey] = useState('')
    const [recipient, setRecipient] = useState<EmailRecipientMode>('actor')
    const [roleId, setRoleId] = useState('')
    const [userIds, setUserIds] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    const customEmail = useRef('')

    const recipientLabels: Record<EmailRecipientMode, string> = {
        actor: e.triggerRecipientActor,
        role: e.triggerRecipientRole,
        members: e.triggerRecipientMembers,
        custom: e.triggerRecipientCustom,
    }

    const actionSelect = useTc<ValueElement>({
        items: actions.map((entry) => ({ key: entry, label: entry })),
        onChange: (value: string) => setAction(value || ''),
    })

    const templateSelect = useTc<ValueElement>({
        items: templates.flatMap((template) =>
            template.active ? [{ key: template.key, label: template.name }] : []
        ),
        onChange: (value: string) => setTemplateKey(value || ''),
    })

    const recipientSelect = useTc<ValueElement>({
        items: EMAIL_RECIPIENT_MODES.map((mode) => ({ key: mode, label: recipientLabels[mode] })),
        onChange: (value: string) => setRecipient((value || 'actor') as EmailRecipientMode),
    })

    const roleSelect = useTc<ValueElement>({
        items: roles.map((role) => ({ key: role.id, label: role.name })),
        onChange: (value: string) => setRoleId(value || ''),
    })

    const memberItems = useMemo(
        () => recipients.map((entry) => ({
            key: entry.id,
            label: `${entry.name || entry.email} · ${entry.email}`,
        })),
        [recipients]
    )

    const memberSelect = useTc<HTMLElement>(
        { items: memberItems },
        {
            'tc-change': (event: Event) => {
                setUserIds(selectedKeys(event))
            },
        }
    )

    useEffect(() => {
        if (!isOpen) return
        setAction('')
        setTemplateKey('')
        setRecipient('actor')
        setRoleId('')
        setUserIds([])
        customEmail.current = ''

        const frame = requestAnimationFrame(() => {
            if (actionSelect.current) actionSelect.current.value = ''
            if (templateSelect.current) templateSelect.current.value = ''
            if (recipientSelect.current) recipientSelect.current.value = 'actor'
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, actionSelect, templateSelect, recipientSelect])

    const valid = action !== '' &&
        templateKey !== '' &&
        (recipient !== 'role' || roleId !== '') &&
        (recipient !== 'members' || userIds.length > 0) &&
        (recipient !== 'custom' || customEmail.current.trim() !== '')

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const saved = await saveEmailTrigger({
                action,
                templateKey,
                recipient,
                roleId: recipient === 'role' ? roleId : null,
                userIds: recipient === 'members' ? userIds : [],
                customEmail: recipient === 'custom' ? customEmail.current : '',
                active: true,
            })
            if (saved) closeModal({ action })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-email-trigger">
            <tc-stack direction="column" gap="0.85rem">
                <div className="modal-email-trigger__grid">
                    <div>
                        <tc-label>{e.triggerAction}</tc-label>
                        <tc-extended-select
                            ref={actionSelect}
                            search-placeholder={t.common.search}
                            no-results-text={t.common.noResults}
                        ></tc-extended-select>
                    </div>

                    <div>
                        <tc-label>{e.triggerTemplate}</tc-label>
                        <tc-extended-select ref={templateSelect}></tc-extended-select>
                    </div>
                </div>

                <div>
                    <tc-label>{e.triggerRecipient}</tc-label>
                    <tc-extended-select ref={recipientSelect}></tc-extended-select>
                </div>

                {recipient === 'role' && (
                    <div>
                        <tc-label>{e.triggerRoleLabel}</tc-label>
                        <tc-extended-select ref={roleSelect}></tc-extended-select>
                    </div>
                )}

                {recipient === 'members' && (
                    <div>
                        <tc-label>{e.triggerMembersLabel}</tc-label>
                        <tc-extended-select
                            ref={memberSelect}
                            multiple
                            value={toKeyList(userIds)}
                            placeholder={t.common.selectMultiple}
                            search-placeholder={t.common.search}
                            no-results-text={t.common.noResults}
                        ></tc-extended-select>
                    </div>
                )}

                {recipient === 'custom' && (
                    <tc-form-input
                        type="text"
                        label={e.triggerCustomEmail}
                        help={e.emailsHint}
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            customEmail.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-form-input>
                )}

                <div className="modal-email-trigger__actions">
                    <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                        {t.modal.cancel}
                    </tc-button>
                    <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                        {e.triggerAdd}
                    </tc-button>
                </div>
            </tc-stack>
        </div>
    )
}

export default EmailTriggerModal
