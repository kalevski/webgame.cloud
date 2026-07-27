import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

const ResolveReportModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.RESOLVE_REPORT)
    const reportId = useModalInput<string>(MODAL.RESOLVE_REPORT)
    const { t } = useStrings()
    const m = t.moderation
    const resolveReport = useStore((state) => state.resolveReport)

    const note = useRef('')
    const noteEl = useRef<ValueElement | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        note.current = ''
        if (noteEl.current) noteEl.current.value = ''
    }, [isOpen])

    const handleResolve = async () => {
        if (!reportId || busy) return
        setBusy(true)
        try {
            await resolveReport(reportId, note.current.trim())
            closeModal(true)
        } finally {
            setBusy(false)
        }
    }

    return (
        <>
            <tc-textarea
                ref={noteEl}
                label={m.resolvePrompt}
                rows="3"
                onInput={(event: React.FormEvent<ValueElement>) => {
                    note.current = String((event.target as ValueElement).value ?? '')
                }}
            ></tc-textarea>
            <tc-button slot="footer" variant="primary" disabled={!reportId || busy || undefined} onClick={handleResolve}>
                {m.resolve}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ResolveReportModal
