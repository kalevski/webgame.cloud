import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { selectedKeys, toKeyList } from 'helpers/select'
import { useTc } from '@toolcase/web-components/react'
import { ApiKeyIssued, PERMISSIONS, Permission } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

export type ApiKeyModalInput = { serviceAccountId: string }

const ApiKeyModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.API_KEY)
    const input = useModalInput<ApiKeyModalInput>(MODAL.API_KEY)
    const { t } = useStrings()
    const k = t.apiKeys

    const createApiKey = useStore((state) => state.createApiKey)
    const createServiceKey = useStore((state) => state.createServiceKey)

    const [hasName, setHasName] = useState(false)
    const [scopes, setScopes] = useState<string[]>([])
    const [issued, setIssued] = useState<ApiKeyIssued | null>(null)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    const name = useRef('')
    const expiresAt = useRef('')
    const nameRef = useRef<ValueElement | null>(null)

    const scopeItems = useMemo(
        () => (PERMISSIONS as readonly Permission[]).map((permission) => ({
            key: permission,
            label: permission,
        })),
        []
    )

    const scopeSelect = useTc<HTMLElement>(
        { items: scopeItems },
        {
            'tc-change': (event: Event) => {
                setScopes(selectedKeys(event))
            },
        }
    )

    const datePicker = useTc<ValueElement>({
        onChange: (value: unknown) => {
            expiresAt.current = String(value ?? '')
        },
    })

    useEffect(() => {
        if (!isOpen) return
        name.current = ''
        setHasName(false)
        setScopes([])
        setIssued(null)
        setCopied(false)
        expiresAt.current = ''

        const frame = requestAnimationFrame(() => {
            if (nameRef.current) nameRef.current.value = ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen])

    const valid = hasName

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const draft = {
                name: name.current.trim(),
                scopes,
                expiresAt: expiresAt.current ? new Date(expiresAt.current).toISOString() : null,
            }
            const result = input?.serviceAccountId
                ? await createServiceKey(input.serviceAccountId, draft)
                : await createApiKey(draft)
            if (result) setIssued(result)
        } finally {
            setSaving(false)
        }
    }

    const copy = () => {
        if (!issued) return
        void navigator.clipboard?.writeText(issued.token)
        setCopied(true)
    }

    return (
        <div className="modal-api-key">
            {issued ? (
                <tc-stack direction="column" gap="0.85rem">
                    <tc-alert variant="warning">{k.tokenHint}</tc-alert>
                    <tc-panel bordered className="modal-api-key__token">
                        <code>{issued.token}</code>
                    </tc-panel>
                    <div className="modal-api-key__actions">
                        <tc-button variant="secondary" outline onClick={copy}>
                            {copied ? k.copied : k.copy}
                        </tc-button>
                        <tc-button variant="primary" onClick={() => closeModal({ keyId: issued.key.id })}>
                            {k.done}
                        </tc-button>
                    </div>
                </tc-stack>
            ) : (
                <tc-stack direction="column" gap="0.85rem">
                    <tc-form-input
                        ref={nameRef}
                        type="text"
                        label={k.nameLabel}
                        placeholder={k.namePlaceholder}
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            name.current = String((event.target as ValueElement).value ?? '')
                            setHasName(name.current.trim().length > 0)
                        }}
                    ></tc-form-input>

                    <div>
                        <tc-label>{k.scopesLabel}</tc-label>
                        <tc-extended-select
                            ref={scopeSelect}
                            multiple
                            value={toKeyList(scopes)}
                            placeholder={t.common.selectMultiple}
                            search-placeholder={t.common.search}
                            no-results-text={t.common.noResults}
                        ></tc-extended-select>
                        <tc-helper-text>{k.scopesHint}</tc-helper-text>
                    </div>

                    <div>
                        <tc-label>{k.expiresLabel}</tc-label>
                        <tc-date-picker ref={datePicker}></tc-date-picker>
                        <tc-helper-text>{k.expiresHint}</tc-helper-text>
                    </div>

                    <div className="modal-api-key__actions">
                        <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                            {t.modal.cancel}
                        </tc-button>
                        <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                            {k.create}
                        </tc-button>
                    </div>
                </tc-stack>
            )}
        </div>
    )
}

export default ApiKeyModal
