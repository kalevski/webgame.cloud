import React, { useEffect, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { RealmRegion } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const RealmRegionModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.REALM_REGION)
    const region = useModalInput<RealmRegion>(MODAL.REALM_REGION)
    const createRegion = useStore((state) => state.createRealmRegion)
    const updateRegion = useStore((state) => state.updateRealmRegion)
    const { t } = useStrings()
    const r = t.realms

    const [hasName, setHasName] = useState(false)
    const [active, setActive] = useState(true)
    const [saving, setSaving] = useState(false)

    const name = useRef('')
    const nameRef = useRef<ValueElement | null>(null)

    useEffect(() => {
        if (!isOpen) return
        name.current = region?.name ?? ''
        setHasName(Boolean(region?.name))
        setActive(region?.active ?? true)

        const frame = requestAnimationFrame(() => {
            if (nameRef.current) nameRef.current.value = region?.name ?? ''
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, region])

    const submit = async () => {
        if (!hasName || saving) return
        setSaving(true)
        try {
            const draft = { name: name.current.trim(), active }
            const saved = region
                ? await updateRegion(region.id, draft)
                : await createRegion(draft)
            if (saved) closeModal(true)
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <div className="modal-realm-region">
                <tc-form-input
                    ref={nameRef}
                    type="text"
                    label={r.regionNameLabel}
                    placeholder={r.regionNamePlaceholder}
                    required
                    onInput={(event: React.FormEvent<ValueElement>) => {
                        name.current = String((event.target as ValueElement).value ?? '')
                        setHasName(name.current.trim().length > 0)
                    }}
                />
                <tc-switch
                    checked={active || undefined}
                    label={r.regionActiveLabel}
                    help={r.regionActiveHint}
                    onClick={() => setActive((current) => !current)}
                />
            </div>
            <tc-button
                slot="footer"
                variant="primary"
                disabled={!hasName || saving || undefined}
                onClick={submit}
            >
                <span>{region ? t.projects.save : r.regionAdd}</span>
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                <span>{t.modal.cancel}</span>
            </tc-button>
        </>
    )
}

export default RealmRegionModal
