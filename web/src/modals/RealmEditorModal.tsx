import React, { useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { Realm, RealmStatus } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const RealmEditorModal: React.FC = () => {
    const closeModal = useModalClose()
    const realm = useModalInput<Realm>(MODAL.REALM_EDITOR)
    const createRealm = useStore((state) => state.createRealm)
    const updateRealm = useStore((state) => state.updateRealm)
    const plans = useStore((state) => state.plans)
    const { t } = useStrings()
    const r = t.realms

    const [name, setName] = useState(realm?.name ?? '')
    const [baseUrl, setBaseUrl] = useState(realm?.baseUrl ?? '')
    const [region, setRegion] = useState(realm?.region ?? '')
    const [planId, setPlanId] = useState(realm?.planId ?? '')
    const [status, setStatus] = useState<RealmStatus>(realm?.status ?? 'active')
    const [exclusive, setExclusive] = useState(realm?.exclusive ?? false)
    const [saving, setSaving] = useState(false)

    const nameInput = useTc<ValueElement>({
        defaultValue: realm?.name ?? '',
        onChange: (value: unknown) => setName(String(value ?? '')),
    })
    const urlInput = useTc<ValueElement>({
        defaultValue: realm?.baseUrl ?? '',
        onChange: (value: unknown) => setBaseUrl(String(value ?? '')),
    })
    const regionInput = useTc<ValueElement>({
        defaultValue: realm?.region ?? '',
        onChange: (value: unknown) => setRegion(String(value ?? '')),
    })
    const planSelect = useTc<ValueElement>({
        items: [{ key: '', label: r.anyPlan }, ...plans.map((plan) => ({ key: plan.id, label: plan.name }))],
        defaultValue: realm?.planId ?? '',
        onChange: (value: unknown) => setPlanId(String(value ?? '')),
    })
    const statusSelect = useTc<ValueElement>({
        items: [
            { key: 'active', label: r.statusActive },
            { key: 'draining', label: r.statusDraining },
            { key: 'offline', label: r.statusOffline },
        ],
        defaultValue: realm?.status ?? 'active',
        onChange: (value: unknown) => setStatus(String(value ?? 'active') as RealmStatus),
    })
    const exclusiveSwitch = useTc<ValueElement>({
        defaultValue: realm?.exclusive ?? false,
        onChange: (value: unknown) => setExclusive(Boolean(value)),
    })

    const submit = async () => {
        setSaving(true)
        const draft = { name, baseUrl, region, planId: planId || null, exclusive, status }
        if (realm) {
            const saved = await updateRealm(realm.id, draft)
            setSaving(false)
            if (saved) closeModal(true)
            return
        }
        const issued = await createRealm(draft)
        setSaving(false)
        if (issued) closeModal(issued)
    }

    return (
        <>
            <tc-form-input ref={nameInput} label={r.nameLabel} required />
            <tc-form-input ref={urlInput} label={r.baseUrlLabel} required />
            <tc-form-input ref={regionInput} label={r.regionLabel} />
            <tc-label>{r.planLabel}</tc-label>
            <tc-extended-select ref={planSelect} placeholder={r.anyPlan} />
            <tc-label>{r.statusLabel}</tc-label>
            <tc-select ref={statusSelect} />
            <tc-switch ref={exclusiveSwitch} label={r.exclusiveLabel} help={r.exclusiveHint} />
            <tc-button
                slot="footer"
                variant="primary"
                disabled={saving || name.trim().length === 0 || baseUrl.trim().length === 0 || undefined}
                onClick={submit}
            >
                {t.projects.save}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default RealmEditorModal
