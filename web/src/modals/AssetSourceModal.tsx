import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { detailValue, useTcEvents } from '@toolcase/web-components/react'
import { ASSET_SOURCE_TYPE_LABELS, ASSET_SOURCE_TYPES, AssetSource, AssetSourceType } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: string }

const AssetSourceModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.ASSET_SOURCE)
    const editing = useModalInput<AssetSource | null>(MODAL.ASSET_SOURCE)
    const { t } = useStrings()
    const f = t.files

    const saveAssetSource = useStore((state) => state.saveAssetSource)

    const [hasName, setHasName] = useState(false)
    const [type, setType] = useState<AssetSourceType>('disk')
    const [saving, setSaving] = useState(false)

    const name = useRef('')
    const basePath = useRef('')
    const bucket = useRef('')
    const region = useRef('')
    const endpoint = useRef('')
    const accessKeyId = useRef('')
    const secret = useRef('')

    const nameRef = useRef<ValueElement | null>(null)
    const basePathRef = useRef<ValueElement | null>(null)
    const bucketRef = useRef<ValueElement | null>(null)
    const regionRef = useRef<ValueElement | null>(null)
    const endpointRef = useRef<ValueElement | null>(null)
    const accessKeyIdRef = useRef<ValueElement | null>(null)

    const typeSelect = useTcEvents<ValueElement>({
        'tc-change': (event: Event) => {
            const next = detailValue<string>(event as CustomEvent) ?? 'disk'
            setType((ASSET_SOURCE_TYPES as readonly string[]).includes(next) ? (next as AssetSourceType) : 'disk')
        },
    })

    useEffect(() => {
        if (!isOpen) return

        name.current = editing?.name ?? ''
        setHasName(Boolean(editing?.name))
        setType(editing?.type ?? 'disk')
        basePath.current = editing?.config.basePath ?? ''
        bucket.current = editing?.config.bucket ?? ''
        region.current = editing?.config.region ?? ''
        endpoint.current = editing?.config.endpoint ?? ''
        accessKeyId.current = editing?.config.accessKeyId ?? ''
        secret.current = ''

        const frame = requestAnimationFrame(() => {
            if (nameRef.current) nameRef.current.value = editing?.name ?? ''
            if (basePathRef.current) basePathRef.current.value = editing?.config.basePath ?? ''
            if (bucketRef.current) bucketRef.current.value = editing?.config.bucket ?? ''
            if (regionRef.current) regionRef.current.value = editing?.config.region ?? ''
            if (endpointRef.current) endpointRef.current.value = editing?.config.endpoint ?? ''
            if (accessKeyIdRef.current) accessKeyIdRef.current.value = editing?.config.accessKeyId ?? ''
            if (typeSelect.current) typeSelect.current.value = editing?.type ?? 'disk'
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, editing, typeSelect])

    const valid = hasName

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const config = type === 'disk'
                ? { basePath: basePath.current.trim() || undefined }
                : {
                    bucket: bucket.current.trim(),
                    region: region.current.trim() || undefined,
                    endpoint: endpoint.current.trim() || undefined,
                    accessKeyId: accessKeyId.current.trim() || undefined,
                }
            const saved = await saveAssetSource(editing?.id ?? null, {
                name: name.current.trim(),
                type,
                config,
                ...(secret.current.trim() ? { secret: secret.current.trim() } : {}),
            })
            if (saved) closeModal(saved)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-file-source">
            <tc-stack direction="column" gap="0.85rem">
                <tc-form-input
                    ref={nameRef}
                    type="text"
                    label={f.nameLabel}
                    placeholder={f.namePlaceholder}
                    onInput={(event: React.FormEvent<ValueElement>) => {
                        name.current = String((event.target as ValueElement).value ?? '')
                        setHasName(name.current.trim().length > 0)
                    }}
                ></tc-form-input>

                <tc-select ref={typeSelect} label={f.typeLabel} value="disk" disabled={Boolean(editing) || undefined}>
                    {ASSET_SOURCE_TYPES.map((sourceType) => (
                        <tc-option key={sourceType} value={sourceType}>
                            {ASSET_SOURCE_TYPE_LABELS[sourceType]}
                        </tc-option>
                    ))}
                </tc-select>

                {type === 'disk' && (
                    <tc-form-input
                        ref={basePathRef}
                        type="text"
                        label={f.basePathLabel}
                        placeholder={f.basePathPlaceholder}
                        help={f.basePathHint}
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            basePath.current = String((event.target as ValueElement).value ?? '')
                        }}
                    ></tc-form-input>
                )}

                {type === 's3' && (
                    <>
                        <tc-form-input
                            ref={bucketRef}
                            type="text"
                            label={f.bucketLabel}
                            onInput={(event: React.FormEvent<ValueElement>) => {
                                bucket.current = String((event.target as ValueElement).value ?? '')
                            }}
                        ></tc-form-input>
                        <tc-form-input
                            ref={regionRef}
                            type="text"
                            label={f.regionLabel}
                            onInput={(event: React.FormEvent<ValueElement>) => {
                                region.current = String((event.target as ValueElement).value ?? '')
                            }}
                        ></tc-form-input>
                        <tc-form-input
                            ref={endpointRef}
                            type="text"
                            label={f.endpointLabel}
                            help={f.endpointHint}
                            onInput={(event: React.FormEvent<ValueElement>) => {
                                endpoint.current = String((event.target as ValueElement).value ?? '')
                            }}
                        ></tc-form-input>
                        <tc-form-input
                            ref={accessKeyIdRef}
                            type="text"
                            label={f.accessKeyIdLabel}
                            onInput={(event: React.FormEvent<ValueElement>) => {
                                accessKeyId.current = String((event.target as ValueElement).value ?? '')
                            }}
                        ></tc-form-input>
                        <tc-form-input
                            type="password"
                            label={f.secretLabel}
                            help={editing?.secretSet ? f.secretSet : f.secretHint}
                            onInput={(event: React.FormEvent<ValueElement>) => {
                                secret.current = String((event.target as ValueElement).value ?? '')
                            }}
                        ></tc-form-input>
                    </>
                )}

                <div className="modal-file-source__actions">
                    <tc-button variant="secondary" outline onClick={() => closeModal(null)}>
                        {t.modal.cancel}
                    </tc-button>
                    <tc-button variant="primary" disabled={!valid || saving || undefined} onClick={submit}>
                        {t.modal.save}
                    </tc-button>
                </div>
            </tc-stack>
        </div>
    )
}

export default AssetSourceModal
