import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useTc } from '@toolcase/web-components/react'
import { ENQUIRY_STATUSES, EnquiryActionDraft, EnquiryStatus, SalesEnquiry } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

type ActionKind = EnquiryActionDraft['kind']

const EnquiryActionModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.ENQUIRY_ACTION)
    const enquiry = useModalInput<SalesEnquiry>(MODAL.ENQUIRY_ACTION)
    const { t } = useStrings()
    const e = t.enquiries

    const applyEnquiryAction = useStore((state) => state.applyEnquiryAction)

    const [kind, setKind] = useState<ActionKind>('status')
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)

    const status = useRef<EnquiryStatus>('contacted')
    const amount = useRef('')
    const currency = useRef('')
    const noteRef = useRef<ValueElement | null>(null)
    const amountRef = useRef<ValueElement | null>(null)
    const currencyRef = useRef<ValueElement | null>(null)

    const kindSelect = useTc<ValueElement>({
        items: [
            { key: 'status', label: e.actionKindStatus },
            { key: 'note', label: e.actionKindNote },
            { key: 'invoice', label: e.actionKindInvoice },
        ],
        onChange: (value: string) => setKind((value || 'status') as ActionKind),
    })

    const statusSelect = useTc<ValueElement>({
        items: ENQUIRY_STATUSES.map((entry) => ({ key: entry, label: e.statusLabels[entry] })),
        onChange: (value: string) => {
            status.current = (value || 'contacted') as EnquiryStatus
        },
    })

    useEffect(() => {
        if (!isOpen) return
        setKind('status')
        status.current = 'contacted'
        setNote('')
        amount.current = ''
        currency.current = ''

        const frame = requestAnimationFrame(() => {
            if (kindSelect.current) kindSelect.current.value = 'status'
            if (statusSelect.current) statusSelect.current.value = 'contacted'
            if (noteRef.current) noteRef.current.value = ''
            if (amountRef.current) amountRef.current.value = ''
            if (currencyRef.current) currencyRef.current.value = ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, enquiry, kindSelect, statusSelect])

    const valid = Boolean(enquiry) && (kind !== 'note' || note.trim().length > 0)

    const submit = async () => {
        if (!enquiry || saving) return
        const draft: EnquiryActionDraft = {
            kind,
            note: note.trim() || undefined,
            ...(kind === 'status' ? { status: status.current } : {}),
            ...(kind === 'invoice' && amount.current ? { amountCents: Number(amount.current) || 0 } : {}),
            ...(kind === 'invoice' && currency.current ? { currency: currency.current.toUpperCase().slice(0, 3) } : {}),
        }
        setSaving(true)
        try {
            if (await applyEnquiryAction(enquiry.id, draft)) closeModal({ kind })
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="modal-enquiry-action">
                <tc-stack direction="vertical" gap="0.85rem">
                    {enquiry && (
                        <tc-text variant="muted">
                            {`${enquiry.userName || enquiry.userEmail} · ${enquiry.planName ?? '—'}`}
                        </tc-text>
                    )}

                    <div>
                        <tc-label>{e.actionKindLabel}</tc-label>
                        <tc-extended-select ref={kindSelect}></tc-extended-select>
                    </div>

                    {kind === 'status' && (
                        <div>
                            <tc-label>{e.actionStatusLabel}</tc-label>
                            <tc-extended-select ref={statusSelect}></tc-extended-select>
                        </div>
                    )}

                    {kind === 'invoice' && (
                        <div className="modal-enquiry-action__money">
                            <tc-form-input
                                ref={amountRef}
                                type="number"
                                label={e.actionAmountLabel}
                                help={e.actionAmountHint}
                                onInput={(event) => {
                                    amount.current = String((event.target as ValueElement).value ?? '')
                                }}
                            ></tc-form-input>

                            <tc-form-input
                                ref={currencyRef}
                                type="text"
                                label={e.actionCurrencyLabel}
                                onInput={(event) => {
                                    currency.current = String((event.target as ValueElement).value ?? '')
                                }}
                            ></tc-form-input>
                        </div>
                    )}

                    <tc-textarea
                        ref={noteRef}
                        label={e.actionNoteLabel}
                        rows="3"
                        onInput={(event) => {
                            setNote(String((event.target as ValueElement).value ?? ''))
                        }}
                    ></tc-textarea>

                </tc-stack>
            </div>
            <SheetFooter>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {e.actionCancel}
                </tc-button>
                <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                    {e.actionSubmit}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default EnquiryActionModal
