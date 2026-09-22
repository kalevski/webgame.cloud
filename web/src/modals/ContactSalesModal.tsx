import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { Plan, SalesField } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

export type ContactSalesResult = { planId: string }

const ContactSalesModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.CONTACT_SALES)
    const plan = useModalInput<Plan>(MODAL.CONTACT_SALES)
    const { t } = useStrings()
    const b = t.billing

    const settings = useStore((state) => state.settings)
    const submitEnquiry = useStore((state) => state.submitEnquiry)

    const answers = useRef<Record<string, string>>({})
    const [filled, setFilled] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        answers.current = {}
        setFilled({})
    }, [isOpen, plan?.id])

    const fields = plan?.salesFields ?? []

    const setAnswer = (key: string, value: string) => {
        answers.current = { ...answers.current, [key]: value }
        setFilled(answers.current)
    }

    const missing = !plan || fields.some(
        (field) => field.required && !(filled[field.key] ?? '').trim()
    )

    const submit = async () => {
        if (!plan || missing || saving) return
        setSaving(true)
        try {
            const created = await submitEnquiry({ planId: plan.id, answers: answers.current })
            if (created) closeModal({ planId: plan.id })
        } finally {
            setSaving(false)
        }
    }

    const renderField = (field: SalesField) => {
        const label = field.required ? `${field.label} *` : field.label
        if (field.type === 'textarea') {
            return (
                <tc-textarea
                    key={field.key}
                    label={label}
                    rows="3"
                    placeholder={field.placeholder}
                    onInput={(event) =>
                        setAnswer(field.key, String((event.target as ValueElement).value ?? ''))
                    }
                ></tc-textarea>
            )
        }
        return (
            <tc-form-input
                key={field.key}
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                label={label}
                placeholder={field.placeholder}
                onInput={(event) =>
                    setAnswer(field.key, String((event.target as ValueElement).value ?? ''))
                }
            ></tc-form-input>
        )
    }

    return (
        <>
            <div className="modal-contact-sales">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{b.enquiryIntro}</tc-text>

                    {fields.length === 0
                        ? <tc-text variant="muted">{b.contactSalesHint}</tc-text>
                        : fields.map(renderField)}

                    {settings?.salesContact && (
                        <tc-text variant="muted">{b.enquiryContactHint(settings.salesContact)}</tc-text>
                    )}

                </tc-stack>
            </div>
            <SheetFooter>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {b.enquiryCancel}
                </tc-button>
                <tc-button
                    variant="primary"
                    disabled={missing || saving || undefined}
                    onClick={submit}
                >
                    {b.enquirySubmit}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ContactSalesModal
