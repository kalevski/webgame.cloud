import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { isRequiredText } from 'helpers/validation'
import { MODAL } from './keys'
import { useModalClose, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

export type CreateTicketResult = {
    subject: string
    body: string
}

const CreateTicketModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.CREATE_TICKET)
    const { t } = useStrings()
    const k = t.tickets

    const [subject, setSubject] = useState('')
    const [bodyFilled, setBodyFilled] = useState(false)
    const body = useRef('')
    const bodyEl = useRef<ValueElement | null>(null)

    const subjectInput = useTc<ValueElement>({
        defaultValue: '',
        onChange: (value: unknown) => setSubject(String(value ?? '')),
    })

    useEffect(() => {
        if (!isOpen) return
        setSubject('')
        setBodyFilled(false)
        body.current = ''
        if (subjectInput.current) subjectInput.current.value = ''
        if (bodyEl.current) bodyEl.current.value = ''
    }, [isOpen, subjectInput])

    const valid = isRequiredText(subject, 200) && bodyFilled

    const handleConfirm = () => {
        if (!valid) return
        closeModal({ subject: subject.trim(), body: body.current.trim() } satisfies CreateTicketResult)
    }

    return (
        <>
            <tc-stack direction="column" gap="0.85rem">
                <tc-form-input
                    ref={subjectInput}
                    type="text"
                    label={k.subjectLabel}
                    placeholder={k.subjectPlaceholder}
                ></tc-form-input>
                <tc-textarea
                    ref={bodyEl}
                    label={k.bodyLabel}
                    placeholder={k.bodyPlaceholder}
                    rows="6"
                    onInput={(event: React.FormEvent<ValueElement>) => {
                        const next = String((event.target as ValueElement).value ?? '')
                        body.current = next
                        setBodyFilled(isRequiredText(next, 10000))
                    }}
                ></tc-textarea>
            </tc-stack>
            <tc-button slot="footer" variant="primary" disabled={!valid || undefined} onClick={handleConfirm}>
                {k.submit}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default CreateTicketModal
