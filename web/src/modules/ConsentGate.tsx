import React, { useState } from 'react'
import { Link } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTcEvents, detailValue } from '@toolcase/web-components/react'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'

const ConsentGate: React.FC = () => {
    const { t } = useStrings()
    const c = t.consent
    const acceptConsent = useStore((state) => state.acceptConsent)
    const [busy, setBusy] = useState(false)

    const [agreed, setAgreed] = useState(false)
    const agreeCheck = useTcEvents({
        'tc-change': (event: Event) => setAgreed(!!detailValue<boolean>(event as CustomEvent)),
    })

    const handleAccept = async () => {
        if (busy || !agreed) return
        setBusy(true)
        try {
            const accepted = await acceptConsent()

            if (accepted) trackEvent(EVENT.CONSENT_ACCEPT, {})
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="module module-consent">
            <tc-container breakpoint="sm">
                <tc-card className="consent-gate">
                    <tc-icon-badge className="consent-gate__badge" glyph="ShieldCheck" />

                    <tc-text as="span" className="consent-gate__eyebrow">
                        {c.eyebrow}
                    </tc-text>
                    <h2 className="consent-gate__title">{c.title}</h2>
                    <tc-text variant="muted" className="consent-gate__body">
                        {c.body}
                    </tc-text>

                    <tc-stack
                        className="consent-gate__links"
                        direction="horizontal"
                        gap="0.4rem"
                        align="center"
                        justify="center"
                    >
                        <Link to="/privacy">{c.privacyLink}</Link>
                        <span className="consent-gate__dot">·</span>
                        <Link to="/terms">{c.termsLink}</Link>
                    </tc-stack>

                    <tc-divider className="consent-gate__divider" />

                    <tc-check
                        ref={agreeCheck}
                        className="consent-gate__agree"
                        label={c.agree}
                        checked={agreed || undefined}
                    ></tc-check>

                    <tc-button
                        variant="primary"
                        className="consent-gate__accept"
                        loading={busy || undefined}
                        disabled={busy || !agreed || undefined}
                        onClick={handleAccept}
                    >
                        {c.accept}
                    </tc-button>
                </tc-card>
            </tc-container>
        </div>
    )
}

export default ConsentGate
