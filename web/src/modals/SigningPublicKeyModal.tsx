import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { SigningKey } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

const SigningPublicKeyModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.SIGNING_PUBLIC_KEY)
    const key = useModalInput<SigningKey>(MODAL.SIGNING_PUBLIC_KEY)
    const { t } = useStrings()
    const s = t.signingKeys

    const [copied, setCopied] = useState(false)

    useEffect(() => {
        setCopied(false)
    }, [isOpen])

    const copy = () => {
        if (!key) return
        void navigator.clipboard?.writeText(key.publicKey)
        setCopied(true)
    }

    return (
        <>
            <div className="modal-signing-key">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted" size="small">
                        {key ? `${key.label} · ${s.kidLabel}: ${key.kid} · ${key.algorithm}` : ''}
                    </tc-text>

                    <pre className="modal-signing-key__pem">{key?.publicKey.trim() ?? ''}</pre>

                    <tc-text variant="muted" size="small">{s.publicKeyHint}</tc-text>
                </tc-stack>
            </div>

            <tc-button slot="footer" variant="secondary" outline onClick={copy}>
                {copied ? s.copied : s.copy}
            </tc-button>
            <tc-button slot="footer" variant="primary" onClick={() => closeModal(null)}>
                {s.close}
            </tc-button>
        </>
    )
}

export default SigningPublicKeyModal
