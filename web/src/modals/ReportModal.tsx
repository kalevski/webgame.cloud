import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { withinMaxLen } from 'helpers/validation'
import { ReportTargetKind } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

export type ReportInput = { targetKind: ReportTargetKind; targetId: string; targetLabel?: string }

const ReportModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.REPORT_CONTENT)
    const input = useModalInput<ReportInput>(MODAL.REPORT_CONTENT)
    const { t } = useStrings()
    const m = t.moderation
    const submitReport = useStore((state) => state.submitReport)

    const reason = useRef('')
    const reasonEl = useRef<ValueElement | null>(null)

    const categories = useRef<string[]>([])
    const [busy, setBusy] = useState(false)

    const categoryGroup = useTc<HTMLElement & { value?: string[] }>({
        options: m.reportCategories.map((entry) => ({ value: entry.key, label: entry.label })),
        onChange: (checked: string[]) => {
            categories.current = checked ?? []
        },
    })

    useEffect(() => {
        if (!isOpen) return
        reason.current = ''
        categories.current = []
        if (reasonEl.current) reasonEl.current.value = ''
        if (categoryGroup.current) categoryGroup.current.value = []
    }, [isOpen, categoryGroup])

    const composedReason = () => {
        const prefix = categories.current.length > 0 ? `[${categories.current.join(', ')}] ` : ''
        return `${prefix}${reason.current.trim()}`
    }

    const handleSubmit = async () => {
        if (!input || !withinMaxLen(composedReason(), 1000) || busy) return
        setBusy(true)
        try {
            const ok = await submitReport(input.targetKind, input.targetId, composedReason())
            if (ok) closeModal(true)
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <tc-stack direction="vertical" gap="0.6rem">
                {input?.targetLabel && <strong>{input.targetLabel}</strong>}
                <tc-checkbox-group
                    ref={categoryGroup}
                    label={m.reportCategoriesLabel}
                    inline
                ></tc-checkbox-group>
                <tc-textarea
                    ref={reasonEl}
                    label={m.reportReasonLabel}
                    placeholder={m.reportReasonPlaceholder}
                    rows="3"
                    onInput={(event) => {
                        reason.current = String((event.target as ValueElement).value ?? '')
                    }}
                ></tc-textarea>
            </tc-stack>
            <SheetFooter>
                <tc-button variant="danger" disabled={!input || busy || undefined} onClick={handleSubmit}>
                    {m.reportSubmit}
                </tc-button>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ReportModal
