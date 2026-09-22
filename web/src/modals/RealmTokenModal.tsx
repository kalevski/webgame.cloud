import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { Realm, RealmToken } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

const RealmTokenModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.REALM_TOKEN)
    const realm = useModalInput<Realm>(MODAL.REALM_TOKEN)
    const rotateRealmToken = useStore((state) => state.rotateRealmToken)
    const { t } = useStrings()
    const r = t.realms

    const [issued, setIssued] = useState<RealmToken | null>(null)
    const [copied, setCopied] = useState(false)
    const [rotating, setRotating] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setIssued(null)
        setCopied(false)
        setRotating(false)
    }, [isOpen])

    const rotate = async () => {
        if (!realm || rotating) return
        setRotating(true)
        try {
            const result = await rotateRealmToken(realm.id)
            if (result) setIssued(result)
        } finally {
            setRotating(false)
        }
    }

    const copy = () => {
        if (!issued) return
        void navigator.clipboard?.writeText(issued.token)
        setCopied(true)
    }

    return (
        <>
            <tc-stack direction="vertical" gap="0.85rem">
                {issued ? (
                    <>
                        <tc-alert variant="warning">{r.tokenHint}</tc-alert>
                        <tc-code-snippet code={issued.token} language="bash" title={issued.realm.name} />
                    </>
                ) : (
                    <tc-text>{r.rotateConfirm(realm?.name ?? '')}</tc-text>
                )}
            </tc-stack>
            <SheetFooter>
                <tc-button
                    variant={issued ? 'primary' : 'danger'}
                    disabled={rotating || undefined}
                    onClick={issued ? () => closeModal(true) : rotate}
                >
                    <span>{issued ? r.done : r.rotateToken}</span>
                </tc-button>
                <tc-button
                    variant="secondary"
                    outline
                    onClick={issued ? copy : () => closeModal(null)}
                >
                    <span>{issued ? (copied ? r.copied : r.copy) : t.modal.cancel}</span>
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default RealmTokenModal
