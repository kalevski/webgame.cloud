import React, { useMemo, useState } from 'react'
import { useTc } from '@toolcase/web-components/react'

export const ALLOCATION_BLOCKS = 25

export type EarlyAccessCopy = {
    eyebrow: string
    eyebrowReserved: string
    title: string
    subtitle: string
    railCaption: string
    railTotal: string
    emailLabel: string
    emailPlaceholder: string
    emailInvalid: string
    cta: string
    ctaBusy: string
    consent: string
    benefitList: readonly string[]
    helper: string
    thanks: string
    thanksDetail: (email: string) => string
    failed: string
    statLabel: string
}

type Props = {
    copy: EarlyAccessCopy
    reservedCount: number
    onReserve: (email: string, optIn: boolean, honeypot: string) => Promise<boolean>
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EarlyAccessPanel: React.FC<Props> = ({ copy, reservedCount, onReserve }) => {
    const [email, setEmail] = useState('')
    const [honeypot, setHoneypot] = useState('')
    const [optIn, setOptIn] = useState(false)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [reserved, setReserved] = useState(false)

    const blocks = useMemo(() => Array.from({ length: ALLOCATION_BLOCKS }, (_, index) => index), [])

    const consent = useTc<HTMLElement>({
        onChange: (checked: boolean) => setOptIn(checked),
    })

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const address = email.trim()
        if (!EMAIL_PATTERN.test(address)) {
            setError(copy.emailInvalid)
            return
        }

        setError('')
        setBusy(true)
        const saved = await onReserve(address, optIn, honeypot)
        setBusy(false)

        if (saved) setReserved(true)
        else setError(copy.failed)
    }

    return (
        <section className="early-access" data-reserved={reserved || undefined}>
            <span className="early-access__mark early-access__mark--tl" aria-hidden="true"></span>
            <span className="early-access__mark early-access__mark--tr" aria-hidden="true"></span>
            <span className="early-access__mark early-access__mark--bl" aria-hidden="true"></span>
            <span className="early-access__mark early-access__mark--br" aria-hidden="true"></span>

            <header className="early-access__head">
                <p className="early-access__eyebrow">
                    <span className="early-access__pip" aria-hidden="true"></span>
                    {reserved ? copy.eyebrowReserved : copy.eyebrow}
                </p>
                <p className="early-access__quota">
                    <strong>{reserved ? '250' : '0'}</strong> / 250 MB
                </p>
            </header>

            <div className="early-access__body">
                <div className="early-access__offer">
                    <h2 className="early-access__title">{copy.title}</h2>
                    <p className="early-access__subtitle">{copy.subtitle}</p>

                    <ul className="early-access__benefits">
                        {copy.benefitList.map((benefit) => (
                            <li key={benefit} className="early-access__benefit">
                                <tc-icon name="Check" size="14"></tc-icon>
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>

                    {reservedCount > 0 && (
                        <p className="early-access__stat">
                            <strong>{reservedCount}</strong> {copy.statLabel}
                        </p>
                    )}
                </div>

                <div className="early-access__form">
                    {reserved ? (
                        <div className="early-access__done" role="status">
                            <tc-icon name="CheckCircle" size="22"></tc-icon>
                            <strong className="early-access__done-title">{copy.thanks}</strong>
                            <span className="early-access__done-detail">{copy.thanksDetail(email.trim())}</span>
                        </div>
                    ) : (
                        <form onSubmit={submit} noValidate>
                            <label className="early-access__label" htmlFor="early-access-email">
                                {copy.emailLabel}
                            </label>
                            <input
                                id="early-access-email"
                                className="early-access__input"
                                type="email"
                                name="email"
                                autoComplete="email"
                                required
                                value={email}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? 'early-access-error' : undefined}
                                placeholder={copy.emailPlaceholder}
                                onChange={(event) => {
                                    setEmail(event.target.value)
                                    setError('')
                                }}
                            />

                            {error && (
                                <p id="early-access-error" className="early-access__error" role="alert">
                                    {error}
                                </p>
                            )}

                            <input
                                type="text"
                                name="website"
                                tabIndex={-1}
                                autoComplete="off"
                                value={honeypot}
                                onChange={(event) => setHoneypot(event.target.value)}
                                className="early-access__trap"
                                aria-hidden="true"
                            />

                            <div className="early-access__consent">
                                <tc-switch ref={consent} label={copy.consent}></tc-switch>
                            </div>

                            <button type="submit" className="early-access__submit" disabled={busy}>
                                {busy ? copy.ctaBusy : copy.cta}
                                <tc-icon name="ArrowRight" size="16"></tc-icon>
                            </button>

                            <p className="early-access__helper">{copy.helper}</p>
                        </form>
                    )}
                </div>
            </div>

            <div
                className="early-access__rail"
                role="img"
                aria-label={`${copy.railTotal} — ${copy.railCaption}`}
            >
                {blocks.map((index) => (
                    <span
                        key={index}
                        className="early-access__block"
                        style={{ '--block-index': index } as React.CSSProperties}
                    ></span>
                ))}
            </div>

            <p className="early-access__rail-caption">{copy.railCaption}</p>
        </section>
    )
}

export default EarlyAccessPanel
