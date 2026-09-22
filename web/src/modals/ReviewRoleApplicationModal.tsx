import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { RoleApplication } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

const ReviewRoleApplicationModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.REVIEW_ROLE_APPLICATION)
    const application = useModalInput<RoleApplication | null>(MODAL.REVIEW_ROLE_APPLICATION)
    const { t } = useStrings()
    const r = t.roleApplications

    const decideRoleApplication = useStore((state) => state.decideRoleApplication)

    const note = useRef('')
    const noteEl = useRef<ValueElement | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        note.current = ''
        if (noteEl.current) noteEl.current.value = ''
    }, [isOpen, application])

    const decide = async (approve: boolean) => {
        if (!application || busy) return
        setBusy(true)
        try {
            if (await decideRoleApplication(application.id, approve, note.current.trim())) closeModal(approve)
        } finally {
            setBusy(false)
        }
    }

    if (!application) return null

    return (
        <>
            <tc-stack direction="vertical" gap="0.85rem">
                <tc-text>{r.reviewTitle(application.userName || application.userEmail, application.roleName)}</tc-text>

                {application.message && <tc-alert variant="info">{application.message}</tc-alert>}

                <tc-textarea
                    ref={noteEl}
                    label={r.noteLabel}
                    placeholder={r.notePlaceholder}
                    rows="3"
                    onInput={(event) => {
                        note.current = String((event.target as ValueElement).value ?? '')
                    }}
                ></tc-textarea>
            </tc-stack>

            <SheetFooter>

                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {r.cancel}
                </tc-button>
                <tc-button variant="danger" outline disabled={busy || undefined} onClick={() => decide(false)}>
                    {r.reject}
                </tc-button>
                <tc-button variant="primary" disabled={busy || undefined} onClick={() => decide(true)}>
                    {r.approve}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default ReviewRoleApplicationModal
