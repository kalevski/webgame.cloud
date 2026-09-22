import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { SigningKey } from 'types'
import { formatDateTime } from 'helpers/dates'

const SigningKeysAdmin: React.FC = () => {
    const { t } = useStrings()
    const s = t.signingKeys

    const signingKeys = useStore((state) => state.signingKeys)
    const signingKeysLoaded = useStore((state) => state.signingKeysLoaded)
    const fetchSigningKeys = useStore((state) => state.fetchSigningKeys)
    const rotateSigningKey = useStore((state) => state.rotateSigningKey)

    const canRotate = useCan('signing.key.rotate')

    const showPublicKey = useModalOpen<void, SigningKey>(MODAL.SIGNING_PUBLIC_KEY)

    const confirmRotate = useModalOpen<SigningKey, SigningKey>(
        MODAL.CONFIRM_ROTATE_SIGNING_KEY,
        async (confirmed) => {
            if (confirmed) await rotateSigningKey(confirmed.name)
        }
    )

    useEffect(() => {
        void fetchSigningKeys()
    }, [fetchSigningKeys])

    return (
        <div className="module module-signing-keys">
            <tc-section-card title={s.title}>
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{s.intro}</tc-text>

                    {signingKeysLoaded && signingKeys.length === 0 && (
                        <tc-empty-state icon="key-round">{s.empty}</tc-empty-state>
                    )}

                    {signingKeys.map((entry) => (
                        <div className="module-signing-keys__key" key={entry.name}>
                            <div className="module-signing-keys__head">
                                <strong>{entry.label}</strong>
                                <div className="module-signing-keys__actions">
                                    <tc-button
                                        variant="secondary"
                                        size="sm"
                                        outline
                                        onClick={() => showPublicKey(entry)}
                                    >
                                        {s.showPublicKey}
                                    </tc-button>
                                    {canRotate && (
                                        <tc-button
                                            variant="secondary"
                                            size="sm"
                                            outline
                                            onClick={() => confirmRotate(entry)}
                                        >
                                            {s.rotate}
                                        </tc-button>
                                    )}
                                </div>
                            </div>

                            <tc-text variant="muted" size="small">
                                {`${s.kidLabel}: ${entry.kid} · ${s.algorithmLabel}: ${entry.algorithm} · ${s.createdLabel}: ${formatDateTime(entry.createdAt)}`}
                            </tc-text>

                            {entry.retiredKids.length > 0 && (
                                <tc-text variant="muted" size="small">
                                    {`${s.retired(entry.retiredKids.length)} — ${s.retiredHint}`}
                                </tc-text>
                            )}
                        </div>
                    ))}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default SigningKeysAdmin
