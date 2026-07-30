import React, { useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTcEvents, detailValue } from '@toolcase/web-components/react'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { LEGAL_DOCUMENTS, LegalDocumentKey, LegalDocumentMeta } from 'configs/legal'

type RowProps = {
    document: LegalDocumentMeta
    accepted: boolean
    onToggleAccept: (next: boolean) => void
}

const ConsentRow: React.FC<RowProps> = ({ document, accepted, onToggleAccept }) => {
    const { t } = useStrings()
    const c = t.consent
    const copy = c.documents[document.key]

    const check = useTcEvents({
        'tc-change': (event: Event) => onToggleAccept(!!detailValue<boolean>(event as CustomEvent)),
    })

    return (
        <section
            className="consent-row"
            data-state={accepted ? 'accepted' : 'idle'}
            aria-labelledby={`consent-doc-${document.key}`}
        >
            <div className="consent-row__head">
                <div className="consent-row__identity">
                    <h2 className="consent-row__title" id={`consent-doc-${document.key}`}>
                        {copy.title}
                    </h2>
                    <p className="consent-row__summary">{copy.summary}</p>
                </div>

                <div className="consent-row__meta">
                    <span className="consent-row__effective">{c.effective(document.updated)}</span>
                    <a
                        className="consent-row__read"
                        href={document.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={c.readAria(copy.title)}
                    >
                        {c.read}
                    </a>
                </div>
            </div>

            <tc-check
                ref={check}
                className="consent-row__accept"
                label={c.agreeOne}
                title={c.agreeFor(copy.title)}
                checked={accepted || undefined}
            ></tc-check>
        </section>
    )
}

const ConsentGate: React.FC = () => {
    const { t } = useStrings()
    const c = t.consent
    const acceptConsent = useStore((state) => state.acceptConsent)

    const [busy, setBusy] = useState(false)
    const [accepted, setAccepted] = useState<LegalDocumentKey[]>([])

    const total = LEGAL_DOCUMENTS.length
    const complete = accepted.length === total

    const toggleAccept = (key: LegalDocumentKey, next: boolean) => {
        setAccepted((current) => (next ? [...new Set([...current, key])] : current.filter((entry) => entry !== key)))
    }

    const handleAccept = async () => {
        if (busy || !complete) return
        setBusy(true)
        try {
            const done = await acceptConsent()

            if (done) trackEvent(EVENT.CONSENT_ACCEPT, {})
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="module module-consent">
            <article className="consent-sheet" data-complete={complete ? 'true' : undefined}>
                <span className="consent-sheet__mark consent-sheet__mark--tl" aria-hidden="true" />
                <span className="consent-sheet__mark consent-sheet__mark--br" aria-hidden="true" />

                <header className="consent-sheet__head">
                    <p className="consent-sheet__eyebrow">{c.eyebrow}</p>
                    <p className="consent-sheet__count">{c.sheetCount(total)}</p>
                </header>

                <h1 className="consent-sheet__title">{c.title}</h1>
                <p className="consent-sheet__body">{c.body}</p>

                <div className="consent-sheet__list">
                    {LEGAL_DOCUMENTS.map((document) => (
                        <ConsentRow
                            key={document.key}
                            document={document}
                            accepted={accepted.includes(document.key)}
                            onToggleAccept={(next) => toggleAccept(document.key, next)}
                        />
                    ))}
                </div>

                <footer className="consent-sheet__foot">
                    <p className="consent-sheet__counter" aria-live="polite">
                        {c.counter(accepted.length, total)}
                    </p>

                    <tc-button
                        variant="primary"
                        className="consent-sheet__accept"
                        loading={busy || undefined}
                        disabled={busy || !complete || undefined}
                        onClick={handleAccept}
                    >
                        {c.accept}
                    </tc-button>
                </footer>
            </article>
        </div>
    )
}

export default ConsentGate
