import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { selectedKeys, toKeyList } from 'helpers/select'
import { useTc } from '@toolcase/web-components/react'
import { WebhookEndpoint } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen, SheetFooter } from './registry'

type ValueElement = HTMLElement & { value?: string }

const WebhookModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.WEBHOOK)
    const editing = useModalInput<WebhookEndpoint | null>(MODAL.WEBHOOK)
    const { t } = useStrings()
    const w = t.webhooks

    const events = useStore((state) => state.webhookEvents)
    const fetchWebhookEvents = useStore((state) => state.fetchWebhookEvents)
    const saveWebhook = useStore((state) => state.saveWebhook)

    const [hasUrl, setHasUrl] = useState(false)
    const [selected, setSelected] = useState<string[]>([])
    const [active, setActive] = useState(true)
    const [saving, setSaving] = useState(false)

    const url = useRef('')
    const description = useRef('')
    const secret = useRef('')
    const urlRef = useRef<ValueElement | null>(null)
    const descriptionRef = useRef<ValueElement | null>(null)

    const eventItems = useMemo(
        () => events.map((event) => ({ key: event, label: event })),
        [events]
    )

    const eventSelect = useTc<HTMLElement>(
        { items: eventItems },
        {
            'tc-change': (event: Event) => {
                setSelected(selectedKeys(event))
            },
        }
    )

    useEffect(() => {
        if (!isOpen) return
        void fetchWebhookEvents()

        url.current = editing?.url ?? ''
        setHasUrl(Boolean(editing?.url))
        setSelected(editing?.events ?? [])
        setActive(editing?.active ?? true)
        description.current = editing?.description ?? ''
        secret.current = ''

        const frame = requestAnimationFrame(() => {
            if (urlRef.current) urlRef.current.value = editing?.url ?? ''
            if (descriptionRef.current) descriptionRef.current.value = editing?.description ?? ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, editing, fetchWebhookEvents])

    const valid = hasUrl

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const saved = await saveWebhook(editing?.id ?? null, {
                url: url.current.trim(),
                description: description.current.trim(),
                events: selected,
                active,
                ...(secret.current.trim() ? { secret: secret.current.trim() } : {}),
            })
            if (saved) closeModal({ endpointId: saved.id })
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="modal-webhook">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-form-input
                        ref={urlRef}
                        type="text"
                        label={w.urlLabel}
                        placeholder={w.urlPlaceholder}
                        onInput={(event) => {
                            url.current = String((event.target as ValueElement).value ?? '')
                            setHasUrl(url.current.trim().length > 0)
                        }}
                    ></tc-form-input>

                    <tc-form-input
                        ref={descriptionRef}
                        type="text"
                        label={w.descriptionLabel}
                        onInput={(event) => {
                            description.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-form-input>

                    <div>
                        <tc-label>{w.eventsLabel}</tc-label>
                        <tc-extended-select
                            ref={eventSelect}
                            multiple
                            value={toKeyList(selected)}
                            placeholder={t.common.selectMultiple}
                            search-placeholder={t.common.search}
                            no-results-text={t.common.noResults}
                        ></tc-extended-select>
                        <tc-helper-text>{w.eventsHint}</tc-helper-text>
                    </div>

                    <tc-form-input
                        type="password"
                        label={w.secretLabel}
                        help={editing?.secretSet ? w.secretSet : w.secretHint}
                        onInput={(event) => {
                            secret.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-form-input>

                    <tc-switch
                        checked={active || undefined}
                        label={w.activeLabel}
                        onClick={() => setActive((current) => !current)}
                    ></tc-switch>

                </tc-stack>
            </div>
            <SheetFooter>
                <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                    {t.modal.cancel}
                </tc-button>
                <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                    {t.modal.save}
                </tc-button>
            </SheetFooter>
        </>
    )
}

export default WebhookModal
