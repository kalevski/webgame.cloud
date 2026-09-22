import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { selectedKeys, toKeyList } from 'helpers/select'
import { useTc } from '@toolcase/web-components/react'
import { EMAIL_AUDIENCES, EmailAudience, OWNER_ROLE_ID } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen, SheetFooter } from './registry'
import { EMAIL_PLACEHOLDERS } from 'types'

type ValueElement = HTMLElement & { value?: string }

const BUILT_IN_PLACEHOLDERS: string[] = [...EMAIL_PLACEHOLDERS]

const EmailComposeModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.EMAIL_COMPOSE)
    const { t } = useStrings()
    const e = t.email

    const templates = useStore((state) => state.emailTemplates)
    const roles = useStore((state) => state.roles)
    const recipients = useStore((state) => state.emailRecipients)
    const composeEmail = useStore((state) => state.composeEmail)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)
    const fetchEmailRecipients = useStore((state) => state.fetchEmailRecipients)

    const [audience, setAudience] = useState<EmailAudience>('self')
    const [templateKey, setTemplateKey] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [roleId, setRoleId] = useState('')
    const [userIds, setUserIds] = useState<string[]>([])
    const [saving, setSaving] = useState(false)

    const variables = useRef<Record<string, string>>({})
    const emails = useRef('')
    const scheduledAt = useRef('')
    const subjectRef = useRef<ValueElement | null>(null)
    const bodyRef = useRef<ValueElement | null>(null)

    const audienceLabels: Record<EmailAudience, string> = {
        self: e.audienceSelf,
        custom: e.audienceCustom,
        all_users: e.audienceAllUsers,
        role: e.audienceRole,
        members: e.audienceMembers,
    }

    const audienceSelect = useTc<ValueElement>({
        items: EMAIL_AUDIENCES.map((entry) => ({ key: entry, label: audienceLabels[entry] })),
        onChange: (value: string) => setAudience((value || 'self') as EmailAudience),
    })

    const templateSelect = useTc<ValueElement>({
        items: [
            { key: '', label: e.templateNone },
            ...templates.flatMap((template) =>
                template.active ? [{ key: template.key, label: template.name }] : []
            ),
        ],
        onChange: (value: string) => {
            setTemplateKey(value || '')
            const template = templates.find((entry) => entry.key === value)
            if (template) {
                setSubject(template.subject)
                setBody(template.body)
                if (subjectRef.current) subjectRef.current.value = template.subject
                if (bodyRef.current) bodyRef.current.value = template.body
            }
        },
    })

    const roleSelect = useTc<ValueElement>({
        items: roles.flatMap((role) =>
            role.id === OWNER_ROLE_ID ? [] : [{ key: role.id, label: role.name }]
        ),
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

    const schedulePicker = useTc<ValueElement>({
        onChange: (value: unknown) => {
            scheduledAt.current = String(value ?? '')
        },
    })

    useEffect(() => {
        if (!isOpen) return
        void fetchAccessPolicy()
        void fetchEmailRecipients()
        setAudience('self')
        setTemplateKey('')
        setSubject('')
        setBody('')
        setRoleId('')
        setUserIds([])
        variables.current = {}
        emails.current = ''
        scheduledAt.current = ''

        const frame = requestAnimationFrame(() => {
            if (audienceSelect.current) audienceSelect.current.value = 'self'
            if (templateSelect.current) templateSelect.current.value = ''
            if (subjectRef.current) subjectRef.current.value = ''
            if (bodyRef.current) bodyRef.current.value = ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, fetchAccessPolicy, fetchEmailRecipients, audienceSelect, templateSelect])

    const placeholders = Array.from(
        new Set(
            [...`${subject} ${body}`.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)].map((match) => match[1])
        )
    ).filter((name) => !BUILT_IN_PLACEHOLDERS.includes(name))

    const valid = (templateKey !== '' || (subject.trim() !== '' && body.trim() !== '')) &&
        (audience !== 'role' || roleId !== '') &&
        (audience !== 'members' || userIds.length > 0) &&
        (audience !== 'custom' || emails.current.trim() !== '')

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const queued = await composeEmail({
                audience,
                ...(audience === 'role' ? { roleId } : {}),
                ...(audience === 'custom'
                    ? { emails: emails.current.split(',').map((value) => value.trim()).filter(Boolean) }
                    : {}),
                ...(audience === 'members' ? { userIds } : {}),
                ...(Object.keys(variables.current).length > 0 ? { variables: variables.current } : {}),
                ...(templateKey ? { templateKey } : {}),
                ...(subject.trim() ? { subject: subject.trim() } : {}),
                ...(body.trim() ? { body } : {}),
                ...(scheduledAt.current ? { scheduledAt: new Date(scheduledAt.current).toISOString() } : {}),
            })
            if (queued !== null) closeModal({ queued })
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="modal-email-compose">
                <tc-stack direction="vertical" gap="0.85rem">
                    <div className="modal-email-compose__grid">
                        <div>
                            <tc-label>{e.audienceLabel}</tc-label>
                            <tc-extended-select ref={audienceSelect}></tc-extended-select>
                        </div>

                        <div>
                            <tc-label>{e.templateLabel}</tc-label>
                            <tc-extended-select ref={templateSelect}></tc-extended-select>
                        </div>
                    </div>

                    {audience === 'role' && (
                        <div>
                            <tc-label>{e.roleLabel}</tc-label>
                            <tc-extended-select ref={roleSelect}></tc-extended-select>
                        </div>
                    )}

                    {audience === 'members' && (
                        <div>
                            <tc-label>{e.membersLabel}</tc-label>
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

                    {audience === 'custom' && (
                        <tc-form-input
                            type="text"
                            label={e.emailsLabel}
                            help={e.emailsHint}
                            onInput={(event) => {
                                emails.current = String((event.target as ValueElement).value ?? '')
                            }}
                        ></tc-form-input>
                    )}

                    <tc-form-input
                        ref={subjectRef}
                        type="text"
                        label={e.subjectLabel}
                        onInput={(event) =>
                            setSubject(String((event.target as ValueElement).value ?? ''))
                        }
                    ></tc-form-input>

                    <tc-textarea
                        ref={bodyRef}
                        label={e.bodyLabel}
                        help={e.bodyHint(EMAIL_PLACEHOLDERS.map((name) => `{{${name}}}`).join(', '))}
                        rows="6"
                        onInput={(event) =>
                            setBody(String((event.target as ValueElement).value ?? ''))
                        }
                    ></tc-textarea>

                    {placeholders.length > 0 && (
                        <tc-panel bordered className="modal-email-compose__variables">
                            <tc-stack direction="vertical" gap="0.6rem">
                                <tc-label>{e.variablesTitle}</tc-label>
                                <tc-helper-text>{e.variablesHint}</tc-helper-text>
                                {placeholders.map((name) => (
                                    <tc-form-input
                                        key={name}
                                        type="text"
                                        label={name}
                                        onInput={(event) => {
                                            variables.current = {
                                                ...variables.current,
                                                [name]: String((event.target as ValueElement).value ?? ''),
                                            }
                                        }}
                                    ></tc-form-input>
                                ))}
                            </tc-stack>
                        </tc-panel>
                    )}

                    <div>
                        <tc-label>{e.scheduleLabel}</tc-label>
                        <tc-date-picker ref={schedulePicker}></tc-date-picker>
                        <tc-helper-text>{e.scheduleHint}</tc-helper-text>
                    </div>

                </tc-stack>
            </div>
            <SheetFooter>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>{t.modal.cancel}</tc-button>
                <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                    {e.send}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default EmailComposeModal
