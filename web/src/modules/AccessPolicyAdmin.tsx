import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import useCan from 'hooks/useCan'
import PlansAdmin from 'modules/PlansAdmin'
import { STRINGS } from 'configs/strings'
import { isRequiredText } from 'helpers/validation'
import { useTc } from '@toolcase/web-components/react'
import {
    LIMITABLE_RESOURCES,
    OWNER_ROLE_ID,
    Permission,
    PERMISSIONS,
    RESOURCE_LABELS,
    ROLE_SLOTS,
    ROLE_SLOT_LABELS,
    RoleBindings,
    RoleSlot,
} from 'types'

const GROUP_LABELS = STRINGS.accessAdmin.groups

const PERMISSION_CATALOG: string[] = [...PERMISSIONS]
const LIMIT_RESOURCES = LIMITABLE_RESOURCES.map((key) => ({ key, label: RESOURCE_LABELS[key] }))

type RoleDraft = { id: string; name: string; permissions: string[]; limits: Record<string, number> }

const NEW_ROLE = '+new'

const SlotBinding: React.FC<{
    options: Array<{ key: string; label: string }>
    value: string
    onChange: (next: string | null) => void
}> = ({ options, value, onChange }) => {
    const { t } = useStrings()
    const select = useTc<HTMLElement & { value: string }>({
        items: options,
        onChange: (next: string) => onChange(next || null),
    })
    useEffect(() => {
        const el = select.current
        if (!el || options.length === 0) return
        const frame = requestAnimationFrame(() => {
            el.value = value
        })
        return () => cancelAnimationFrame(frame)
    }, [value, options.length, select])
    return (
        <tc-extended-select
            ref={select}
            search-placeholder={t.common.search}
            no-results-text={t.common.noResults}
        ></tc-extended-select>
    )
}

const AccessPolicyAdmin: React.FC = () => {
    const { t } = useStrings()
    const s = t.accessAdmin
    const policy = useStore((state) => state.accessPolicy)
    const roles = useStore((state) => state.roles)
    const loading = useStore((state) => state.accessPolicyLoading)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)
    const saveRole = useStore((state) => state.saveRole)
    const deleteRole = useStore((state) => state.deleteRole)
    const reassignRole = useStore((state) => state.reassignRole)
    const saveRoleLimits = useStore((state) => state.saveRoleLimits)
    const saveRoleBindings = useStore((state) => state.saveRoleBindings)

    const billingEnabled = useFeature('billing')
    const adminPlans = useStore((state) => state.adminPlans)
    const fetchAdminPlans = useStore((state) => state.fetchAdminPlans)
    const updatePlan = useStore((state) => state.updatePlan)

    const canWrite = useCan('admin.role.write')

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [bindingDraft, setBindingDraft] = useState<Partial<RoleBindings>>({})
    const [planRoleDraft, setPlanRoleDraft] = useState<Record<string, string>>({})

    const draftRef = useRef<RoleDraft | null>(null)
    const [nameValid, setNameValid] = useState(false)

    useEffect(() => {
        fetchAccessPolicy()
    }, [fetchAccessPolicy])

    useEffect(() => {
        if (policy) setBindingDraft({ ...policy.bindings })
    }, [policy])

    useEffect(() => {
        if (billingEnabled) void fetchAdminPlans()
    }, [billingEnabled, fetchAdminPlans])

    useEffect(() => {
        setPlanRoleDraft(Object.fromEntries(adminPlans.map((plan) => [plan.id, plan.roleId ?? ''])))
    }, [adminPlans])

    const saveSlots = async () => {
        await saveRoleBindings(bindingDraft)
        const changed = adminPlans.flatMap((plan) => {
            const next = planRoleDraft[plan.id] ?? ''
            return next === (plan.roleId ?? '') ? [] : [{ planId: plan.id, roleId: next || null }]
        })
        await Promise.all(changed.map((entry) => updatePlan(entry.planId, { roleId: entry.roleId })))
    }

    useEffect(() => {
        if (!selectedId && roles.length > 0) setSelectedId(roles[0].id)
    }, [roles, selectedId])

    const selected = useMemo(
        () => roles.find((role) => role.id === selectedId) ?? null,
        [roles, selectedId]
    )

    const roleData = useMemo(() => {
        if (selectedId === NEW_ROLE) return { id: NEW_ROLE, name: '', permissions: [] as string[] }
        if (!selected) return null
        const limits: Record<string, number> = {}
        for (const [key, value] of Object.entries(policy?.roleLimits[selected.id] ?? {})) {
            if (typeof value === 'number') limits[key] = value
        }
        return {
            id: selected.id,
            name: selected.name,
            builtin: selected.builtin,
            permissions: [...selected.permissions],
            limits,
        }
    }, [selectedId, selected, policy])

    useEffect(() => {
        draftRef.current = roleData
            ? {
                  id: roleData.id,
                  name: roleData.name,
                  permissions: [...roleData.permissions],
                  limits: { ...('limits' in roleData ? roleData.limits : {}) },
              }
            : null
        setNameValid(!!roleData && isRequiredText(roleData.name, 80))
    }, [roleData])

    const actions = useMemo(
        () => (canWrite ? [{ key: 'new', label: s.newRole, icon: 'Plus', variant: 'primary' }] : []),
        [s, canWrite]
    )
    const actionHeader = useTc<HTMLElement>({
        actions,
        onExec: (key: string) => {
            if (key === 'new') setSelectedId(NEW_ROLE)
        },
    })

    useEffect(() => {
        const content = actionHeader.current?.querySelector('.tc-action-header-content')
        if (content) content.textContent = s.rolesTitle
    })

    const listItems = useMemo(() => {
        const items = roles.map((role) => ({
            key: role.id,
            icon: role.builtin ? 'Lock' : undefined,
            text: role.name,
            badge: role.permissions.length,
        }))
        if (selectedId === NEW_ROLE) items.push({ key: NEW_ROLE, icon: 'Plus', text: s.newRole, badge: 0 })
        return items
    }, [roles, selectedId, s])

    const roleList = useTc<HTMLElement>({
        items: listItems,
        activeKey: selectedId,
        onSelect: (key: string) => setSelectedId(key),
    })

    const moduleAccess = useTc<HTMLElement>({
        roleData,
        permissions: PERMISSION_CATALOG,
        limitableResources: LIMIT_RESOURCES,
        permissionGroupLabels: GROUP_LABELS,
        ownerRoleId: OWNER_ROLE_ID,
        onChange: (draft: RoleDraft) => {
            draftRef.current = draft

            setNameValid(isRequiredText(draft.name, 80))
        },
    })

    if (loading && roles.length === 0) return <tc-skeleton height="360"></tc-skeleton>
    if (!policy) return null

    const isOwner = selectedId === OWNER_ROLE_ID
    const isNew = selectedId === NEW_ROLE

    const submit = async () => {
        const draft = draftRef.current
        if (!draft || !isRequiredText(draft.name, 80)) return
        const saved = await saveRole(
            { name: draft.name.trim(), permissions: draft.permissions as Permission[] },
            isNew ? undefined : draft.id
        )
        if (!saved) return

        const limits: Record<string, number> = {}
        for (const [key, value] of Object.entries(draft.limits)) {
            if (Number.isFinite(value) && value > 0 && value <= 1000000) limits[key] = Math.floor(value)
        }
        await saveRoleLimits(saved.id, limits)

        setSelectedId(saved.id)
    }

    const removeSelected = async () => {
        if (!selected) return
        const fallback = roles.find((role) => role.id !== selected.id && role.id !== OWNER_ROLE_ID)
        const ok = await deleteRole(selected.id)
        if (ok) {
            setSelectedId(null)
            return
        }
        if (!fallback || !window.confirm(s.reassignPrompt(fallback.name))) return
        const moved = await reassignRole(selected.id, fallback.id)
        if (moved !== null && (await deleteRole(selected.id))) setSelectedId(null)
    }

    const slotOptions = (allowUnbound: boolean) => [

        ...(allowUnbound ? [{ key: '', label: s.unbound }] : []),
        ...roles.flatMap((role) => (role.id !== OWNER_ROLE_ID ? [{ key: role.id, label: role.name }] : [])),
    ]

    return (
        <div className="module module-access">
            <tc-action-header ref={actionHeader} className="module-access__action-header"></tc-action-header>

            <tc-vertical-item-list ref={roleList} className="module-access__list">
                <div className="module-access__detail">
                    {roleData ? (
                        <>
                            <tc-module-access ref={moduleAccess}></tc-module-access>
                            <tc-helper-text className="module-access__limits-hint">{s.limitsHint}</tc-helper-text>
                            {!isOwner && canWrite && (
                                <div className="module-access__footer">
                                    {!isNew && (
                                        <tc-button variant="danger" outline onClick={removeSelected}>
                                            {s.delete}
                                        </tc-button>
                                    )}
                                    <span className="module-access__spacer" />
                                    <tc-button
                                        variant="secondary"
                                        outline
                                        onClick={() => setSelectedId(roles[0]?.id ?? null)}
                                    >
                                        {t.modal.cancel}
                                    </tc-button>

                                    <tc-button
                                        variant={nameValid ? 'primary' : 'secondary'}
                                        outline={!nameValid || undefined}
                                        disabled={!nameValid || undefined}
                                        onClick={submit}
                                    >
                                        {s.save}
                                    </tc-button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="module-access__detail--empty">
                            <tc-empty-state icon="shield">{s.pickRole}</tc-empty-state>
                        </div>
                    )}
                </div>
            </tc-vertical-item-list>

            <section className="module-access__bindings">
                <tc-heading as="h4">{s.bindingsTitle}</tc-heading>
                <tc-helper-text>{s.bindingsHint}</tc-helper-text>
                <div className="module-access__slots">
                    {ROLE_SLOTS.map((slot: RoleSlot) => (
                        <div key={slot} className="module-access__slot">
                            <tc-label>{ROLE_SLOT_LABELS[slot].label}</tc-label>
                            <SlotBinding
                                options={slotOptions(false)}
                                value={bindingDraft[slot] ?? ''}
                                onChange={(next) => setBindingDraft({ ...bindingDraft, [slot]: next })}
                            />
                            <tc-helper-text>{ROLE_SLOT_LABELS[slot].hint}</tc-helper-text>
                        </div>
                    ))}
                    {billingEnabled && adminPlans.map((plan) => (
                        <div key={`plan-${plan.id}`} className="module-access__slot">
                            <tc-label>{t.plansAdmin.slotLabel(plan.name)}</tc-label>
                            <SlotBinding
                                options={slotOptions(true)}
                                value={planRoleDraft[plan.id] ?? ''}
                                onChange={(next) => setPlanRoleDraft({ ...planRoleDraft, [plan.id]: next ?? '' })}
                            />
                            <tc-helper-text>
                                {t.plansAdmin.slotHint(plan.mode === 'manual' ? t.plansAdmin.modeManual : t.plansAdmin.modeManaged)}
                            </tc-helper-text>
                        </div>
                    ))}
                </div>
                {canWrite && (
                    <div className="module-access__footer">
                        <tc-button variant="primary" onClick={saveSlots}>
                            {s.save}
                        </tc-button>
                    </div>
                )}
            </section>

            {billingEnabled && <PlansAdmin />}
        </div>
    )
}

export default AccessPolicyAdmin
