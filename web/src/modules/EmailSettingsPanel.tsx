import React, { useEffect, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import Loading from 'components/Loading'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { EMAIL_PROVIDERS, EmailProvider } from 'types'

type ValueElement = HTMLElement & { value?: string }

const bind = (target: React.MutableRefObject<string>) =>
    (event: React.FormEvent<ValueElement>) => {
        target.current = String((event.target as ValueElement).value ?? '')
    }

const EmailSettingsPanel: React.FC = () => {
    const { t } = useStrings()
    const e = t.email
    const config = useStore((state) => state.emailConfig)
    const fetchEmailConfig = useStore((state) => state.fetchEmailConfig)
    const saveEmailConfig = useStore((state) => state.saveEmailConfig)
    const sendTestEmail = useStore((state) => state.sendTestEmail)

    const canWrite = useCan('email.config.write')

    const [provider, setProvider] = useState<EmailProvider>('log')
    const [secure, setSecure] = useState(false)

    const fromName = useRef('')
    const fromEmail = useRef('')
    const smtpHost = useRef('')
    const smtpPort = useRef('')
    const smtpUser = useRef('')
    const smtpPassword = useRef('')
    const mailchimpKey = useRef('')
    const batchSize = useRef('')

    const fromNameRef = useRef<ValueElement | null>(null)
    const fromEmailRef = useRef<ValueElement | null>(null)
    const smtpHostRef = useRef<ValueElement | null>(null)
    const smtpPortRef = useRef<ValueElement | null>(null)
    const smtpUserRef = useRef<ValueElement | null>(null)
    const batchSizeRef = useRef<ValueElement | null>(null)

    const providerLabels: Record<EmailProvider, string> = {
        log: e.providerLog,
        smtp: e.providerSmtp,
        mailchimp: e.providerMailchimp,
    }

    const providerSelect = useTc<ValueElement>({
        items: EMAIL_PROVIDERS.map((entry) => ({ key: entry, label: providerLabels[entry] })),
        onChange: (value: string) => setProvider((value || 'log') as EmailProvider),
    })

    useEffect(() => {
        void fetchEmailConfig()
    }, [fetchEmailConfig])

    useEffect(() => {
        if (!config) return
        setProvider(config.provider)
        setSecure(config.smtpSecure)
        fromName.current = config.fromName
        fromEmail.current = config.fromEmail
        smtpHost.current = config.smtpHost
        smtpPort.current = String(config.smtpPort)
        smtpUser.current = config.smtpUser
        batchSize.current = String(config.batchSize)

        const frame = requestAnimationFrame(() => {
            if (providerSelect.current) providerSelect.current.value = config.provider
            if (fromNameRef.current) fromNameRef.current.value = config.fromName
            if (fromEmailRef.current) fromEmailRef.current.value = config.fromEmail
            if (smtpHostRef.current) smtpHostRef.current.value = config.smtpHost
            if (smtpPortRef.current) smtpPortRef.current.value = String(config.smtpPort)
            if (smtpUserRef.current) smtpUserRef.current.value = config.smtpUser
            if (batchSizeRef.current) batchSizeRef.current.value = String(config.batchSize)
        })
        return () => cancelAnimationFrame(frame)
    }, [config, providerSelect])

    const header = useTc<HTMLElement>({
        actions: canWrite
            ? [
                { key: 'save', label: e.save, icon: 'Check', variant: 'primary' },
                { key: 'test', label: e.sendTest, icon: 'Send', variant: 'secondary' },
            ]
            : [],
        onExec: (key: string) => {
            if (key === 'save') save()
            if (key === 'test') void sendTestEmail()
        },
    })

    useEffect(() => {
        const content = header.current?.querySelector('.tc-action-header-content')
        if (content) content.textContent = e.settingsTitle
    })

    if (!config) return <Loading />

    const save = () => {
        void saveEmailConfig({
            provider,
            fromName: fromName.current,
            fromEmail: fromEmail.current,
            smtpHost: smtpHost.current,
            smtpPort: Number(smtpPort.current) || 587,
            smtpUser: smtpUser.current,
            smtpSecure: secure,
            batchSize: Number(batchSize.current) || 25,
            ...(smtpPassword.current ? { smtpPassword: smtpPassword.current } : {}),
            ...(mailchimpKey.current ? { mailchimpKey: mailchimpKey.current } : {}),
        })
    }

    return (
        <div className="module module-email-settings">
            <tc-action-header ref={header} className="module-email__action-header"></tc-action-header>

            <tc-section-card title={e.settingsTitle}>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{e.settingsIntro}</tc-text>

                    <div>
                        <tc-label>{e.providerLabel}</tc-label>
                        <tc-extended-select ref={providerSelect}></tc-extended-select>
                    </div>

                    <div className="module-email-settings__grid">
                        <tc-form-input ref={fromNameRef} type="text" label={e.fromNameLabel} onInput={bind(fromName)}></tc-form-input>
                        <tc-form-input ref={fromEmailRef} type="email" label={e.fromEmailLabel} onInput={bind(fromEmail)}></tc-form-input>
                    </div>

                    {provider === 'smtp' && (
                        <div className="module-email-settings__grid">
                            <tc-form-input ref={smtpHostRef} type="text" label={e.smtpHostLabel} onInput={bind(smtpHost)}></tc-form-input>
                            <tc-form-input ref={smtpPortRef} type="number" label={e.smtpPortLabel} onInput={bind(smtpPort)}></tc-form-input>
                            <tc-form-input ref={smtpUserRef} type="text" label={e.smtpUserLabel} onInput={bind(smtpUser)}></tc-form-input>
                            <tc-form-input
                                type="password"
                                label={e.smtpPasswordLabel}
                                help={config.smtpPasswordSet ? e.secretSet : undefined}
                                onInput={bind(smtpPassword)}
                            ></tc-form-input>
                        </div>
                    )}

                    {provider === 'smtp' && (
                        <tc-switch
                            checked={secure || undefined}
                            label={e.smtpSecureLabel}
                            onClick={() => setSecure((current) => !current)}
                        ></tc-switch>
                    )}

                    {provider === 'mailchimp' && (
                        <tc-form-input
                            type="password"
                            label={e.mailchimpKeyLabel}
                            help={config.mailchimpKeySet ? e.secretSet : undefined}
                            onInput={bind(mailchimpKey)}
                        ></tc-form-input>
                    )}

                    <tc-form-input
                        ref={batchSizeRef}
                        type="number"
                        label={e.batchSizeLabel}
                        help={e.batchSizeHint}
                        onInput={bind(batchSize)}
                    ></tc-form-input>

                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default EmailSettingsPanel
