import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { Realm, RealmStatus, RealmToken } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

const ANY_PLAN = 'any'

const NO_REGION = 'none'

const RealmEditorModal: React.FC = () => {
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.REALM_EDITOR)
    const realm = useModalInput<Realm>(MODAL.REALM_EDITOR)
    const createRealm = useStore((state) => state.createRealm)
    const updateRealm = useStore((state) => state.updateRealm)
    const plans = useStore((state) => state.plans)
    const regions = useStore((state) => state.realmRegions)
    const regionsLoaded = useStore((state) => state.realmRegionsLoaded)
    const fetchRegions = useStore((state) => state.fetchRealmRegions)
    const { t } = useStrings()
    const r = t.realms

    const [hasName, setHasName] = useState(false)
    const [hasUrl, setHasUrl] = useState(false)
    const planId = useRef(ANY_PLAN)
    const regionId = useRef(NO_REGION)
    const status = useRef<RealmStatus>('active')
    const [exclusive, setExclusive] = useState(false)
    const [issued, setIssued] = useState<RealmToken | null>(null)
    const [copied, setCopied] = useState(false)
    const [saving, setSaving] = useState(false)

    const name = useRef('')
    const baseUrl = useRef('')
    const nameRef = useRef<ValueElement | null>(null)
    const urlRef = useRef<ValueElement | null>(null)

    const regionItems = useMemo(
        () => [
            { key: NO_REGION, label: r.regionNone },
            ...regions.flatMap((entry) =>
                entry.active || entry.id === realm?.regionId
                    ? [{
                          key: entry.id,
                          label: entry.active ? entry.name : `${entry.name} · ${r.regionInactiveBadge}`,
                      }]
                    : []
            ),
        ],
        [regions, realm, r]
    )

    const regionSelect = useTc<ValueElement>({
        items: regionItems,
        onChange: (value: unknown) => {
            regionId.current = String(value ?? NO_REGION) || NO_REGION
        },
    })
    const planSelect = useTc<ValueElement>({
        items: [
            { key: ANY_PLAN, label: r.anyPlan },
            ...plans.map((plan) => ({ key: plan.id, label: plan.name })),
        ],
        onChange: (value: unknown) => {
            planId.current = String(value ?? ANY_PLAN) || ANY_PLAN
        },
    })
    const statusSelect = useTc<ValueElement>({
        items: [
            { key: 'active', label: r.statusActive },
            { key: 'draining', label: r.statusDraining },
            { key: 'offline', label: r.statusOffline },
        ],
        onChange: (value: unknown) => {
            status.current = String(value ?? 'active') as RealmStatus
        },
    })
    const stepper = useTc<HTMLElement>({
        steps: [
            { key: 'register', label: r.stepRegister, description: r.flowStepRegister },
            { key: 'token', label: r.stepToken, description: r.flowStepToken },
        ],
    })

    useEffect(() => {
        if (isOpen && !regionsLoaded) void fetchRegions()
    }, [isOpen, regionsLoaded, fetchRegions])

    useEffect(() => {
        if (!isOpen) return
        name.current = realm?.name ?? ''
        baseUrl.current = realm?.baseUrl ?? ''
        setHasName(Boolean(realm?.name))
        setHasUrl(Boolean(realm?.baseUrl))
        planId.current = realm?.planId ?? ANY_PLAN
        regionId.current = realm?.regionId ?? NO_REGION
        status.current = realm?.status ?? 'active'
        setExclusive(realm?.exclusive ?? false)
        setIssued(null)
        setCopied(false)

        const frame = requestAnimationFrame(() => {
            if (nameRef.current) nameRef.current.value = realm?.name ?? ''
            if (urlRef.current) urlRef.current.value = realm?.baseUrl ?? ''
            if (regionSelect.current) regionSelect.current.value = realm?.regionId ?? NO_REGION
            if (planSelect.current) planSelect.current.value = realm?.planId ?? ANY_PLAN
            if (statusSelect.current) statusSelect.current.value = realm?.status ?? 'active'
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, realm, regionSelect, planSelect, statusSelect])

    const valid = hasName && hasUrl

    const submit = async () => {
        if (!valid || saving) return
        setSaving(true)
        try {
            const draft = {
                name: name.current.trim(),
                baseUrl: baseUrl.current.trim(),
                regionId: regionId.current === NO_REGION ? null : regionId.current,
                planId: planId.current === ANY_PLAN ? null : planId.current,
                exclusive,
                status: status.current,
            }
            if (realm) {
                const saved = await updateRealm(realm.id, draft)
                if (saved) closeModal(true)
                return
            }
            const created = await createRealm(draft)
            if (created) setIssued(created)
        } finally {
            setSaving(false)
        }
    }

    const copy = () => {
        if (!issued) return
        void navigator.clipboard?.writeText(issued.token)
        setCopied(true)
    }

    if (issued) {
        return (
            <>
                <div className="modal-realm-editor">
                    <tc-stepper ref={stepper} active-step="token"></tc-stepper>
                    <tc-alert variant="warning">{r.tokenHint}</tc-alert>
                    <tc-code-snippet code={issued.token} language="bash" title={issued.realm.name} />
                    <tc-helper-text icon="Info">{r.createdHint}</tc-helper-text>
                </div>
                <tc-button slot="footer" variant="primary" onClick={() => closeModal(true)}>
                    <span>{r.done}</span>
                </tc-button>
                <tc-button slot="footer" variant="secondary" outline onClick={copy}>
                    <span>{copied ? r.copied : r.copy}</span>
                </tc-button>
            </>
        )
    }

    return (
        <>
            <div className="modal-realm-editor">
                {!realm && (
                    <>
                        <tc-stepper ref={stepper} active-step="register"></tc-stepper>
                        <tc-alert variant="info">{r.flowIntro}</tc-alert>
                    </>
                )}

                <section className="modal-realm-editor__group">
                    <header className="modal-realm-editor__group-head">
                        <tc-icon name="Server" size="15"></tc-icon>
                        <strong>{r.groupIdentity}</strong>
                    </header>
                    <div className="modal-realm-editor__row">
                        <tc-form-input
                            ref={nameRef}
                            type="text"
                            label={r.nameLabel}
                            placeholder={r.namePlaceholder}
                            required
                            onInput={(event: React.FormEvent<ValueElement>) => {
                                name.current = String((event.target as ValueElement).value ?? '')
                                setHasName(name.current.trim().length > 0)
                            }}
                        />
                        <div className="modal-realm-editor__field">
                            <tc-label>{r.regionLabel}</tc-label>
                            <tc-extended-select ref={regionSelect} placeholder={r.regionPlaceholder} />
                            <tc-helper-text>
                                {regionItems.length > 1 ? r.regionHint : r.regionsEmptyHint}
                            </tc-helper-text>
                        </div>
                    </div>
                    <tc-form-input
                        ref={urlRef}
                        type="text"
                        label={r.baseUrlLabel}
                        help={r.baseUrlHint}
                        placeholder={r.baseUrlPlaceholder}
                        required
                        onInput={(event: React.FormEvent<ValueElement>) => {
                            baseUrl.current = String((event.target as ValueElement).value ?? '')
                            setHasUrl(baseUrl.current.trim().length > 0)
                        }}
                    />
                </section>

                <section className="modal-realm-editor__group">
                    <header className="modal-realm-editor__group-head">
                        <tc-icon name="Route" size="15"></tc-icon>
                        <strong>{r.groupRouting}</strong>
                    </header>
                    <div className="modal-realm-editor__row">
                        <div className="modal-realm-editor__field">
                            <tc-label>{r.planLabel}</tc-label>
                            <tc-extended-select ref={planSelect} placeholder={r.anyPlan} />
                            <tc-helper-text>{r.planHint}</tc-helper-text>
                        </div>
                        <div className="modal-realm-editor__field">
                            <tc-label>{r.statusLabel}</tc-label>
                            <tc-extended-select ref={statusSelect} />
                            <tc-helper-text>{r.statusHint}</tc-helper-text>
                        </div>
                    </div>
                    <tc-switch
                        checked={exclusive || undefined}
                        label={r.exclusiveLabel}
                        help={r.exclusiveHint}
                        onClick={() => setExclusive((current) => !current)}
                    />
                </section>
            </div>
            <tc-button
                slot="footer"
                variant="primary"
                disabled={!valid || saving || undefined}
                onClick={submit}
            >
                <span>{realm ? t.projects.save : r.create}</span>
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                <span>{t.modal.cancel}</span>
            </tc-button>
        </>
    )
}

export default RealmEditorModal
