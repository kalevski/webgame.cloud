import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { EMAIL_PLACEHOLDERS, EmailTemplate, type EmailPlaceholder } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

const EmailTemplateModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.EMAIL_TEMPLATE)
    const editing = useModalInput<EmailTemplate | null>(MODAL.EMAIL_TEMPLATE)
    const { t } = useStrings()
    const e = t.email

    const saveEmailTemplate = useStore((state) => state.saveEmailTemplate)
    const deleteEmailTemplate = useStore((state) => state.deleteEmailTemplate)

    const [name, setName] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [active, setActive] = useState(true)
    const [saving, setSaving] = useState(false)

    const description = useRef('')
    const nameRef = useRef<ValueElement | null>(null)
    const descriptionRef = useRef<ValueElement | null>(null)
    const subjectRef = useRef<ValueElement | null>(null)
    const bodyRef = useRef<ValueElement | null>(null)

    useEffect(() => {
        if (!isOpen) return
        setName(editing?.name ?? '')
        setSubject(editing?.subject ?? '')
        setBody(editing?.body ?? '')
        setActive(editing?.active ?? true)
        description.current = editing?.description ?? ''

        const frame = requestAnimationFrame(() => {
            if (nameRef.current) nameRef.current.value = editing?.name ?? ''
            if (descriptionRef.current) descriptionRef.current.value = editing?.description ?? ''
            if (subjectRef.current) subjectRef.current.value = editing?.subject ?? ''
            if (bodyRef.current) bodyRef.current.value = editing?.body ?? ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, editing])

    const valid = name.trim().length > 0 && subject.trim().length > 0 && body.trim().length > 0

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const saved = await saveEmailTemplate(editing?.key ?? null, {
                name: name.trim(),
                description: description.current.trim(),
                subject: subject.trim(),
                body,
                active,
            })
            if (saved) closeModal({ key: saved.key })
        } finally {
            setSaving(false)
        }
    }

    const remove = async () => {
        if (!editing) return
        if (!window.confirm(e.templateDeletePrompt(editing.name))) return
        if (await deleteEmailTemplate(editing.key)) closeModal(null)
    }

    const sample: Record<EmailPlaceholder, string> = {
        workspace: 'WebGame Cloud',
        recipientName: 'Ada Lovelace',
        recipientEmail: 'ada@example.com',
        actorName: 'Ada Lovelace',
        actorEmail: 'ada@example.com',
        date: new Date().toLocaleDateString('en-GB'),
    }

    const preview = EMAIL_PLACEHOLDERS.reduce(
        (rendered, name) => rendered.replace(new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g'), sample[name]),
        body
    )

    return (
        <>
            <div className="modal-email-template">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-form-input
                        ref={nameRef}
                        type="text"
                        label={e.templateNameLabel}
                        onInput={(event) =>
                            setName(String((event.target as ValueElement).value ?? ''))
                        }
                    ></tc-form-input>

                    <tc-form-input
                        ref={descriptionRef}
                        type="text"
                        label={e.templateDescriptionLabel}
                        onInput={(event) => {
                            description.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-form-input>

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
                        rows="8"
                        onInput={(event) =>
                            setBody(String((event.target as ValueElement).value ?? ''))
                        }
                    ></tc-textarea>

                    <div className="modal-email-template__preview">
                        <tc-label>{e.templatePreview}</tc-label>
                        <pre className="modal-email-template__preview-body">{preview}</pre>
                    </div>

                    <tc-switch
                        checked={active || undefined}
                        label={e.templateActiveLabel}
                        onClick={() => setActive((current) => !current)}
                    ></tc-switch>

                </tc-stack>
            </div>
            <SheetFooter>
                {editing && (
                    <tc-button variant="danger" outline onClick={remove}>{e.templateDelete}</tc-button>
                )}
                <span className="modal-email-template__spacer" />
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>{t.modal.cancel}</tc-button>
                <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                    {e.save}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default EmailTemplateModal
