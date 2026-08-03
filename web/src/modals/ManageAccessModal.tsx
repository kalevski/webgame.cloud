import React, { useEffect, useMemo, useReducer } from 'react'
import useStrings from 'hooks/useStrings'
import { STRINGS } from 'configs/strings'
import { useTc } from '@toolcase/web-components/react'
import type { ModuleAccessRole, ModuleAccessRoleDraft } from '@toolcase/web-components'
import { useStore } from 'state'
import {
    LIMITABLE_RESOURCES,
    LimitableResource,
    PERMISSIONS,
    Permission,
    RESOURCE_LABELS,
    User,
    UserRole, OWNER_ROLE_ID } from 'types'
import { MODAL } from './keys'
import { useModalClose, useModalInput, useModalIsOpen } from './registry'

type ValueElement = HTMLElement & { value?: unknown }

export type ManageAccessTarget = Pick<User, 'id' | 'name' | 'email' | 'role' | 'verified'>

export type ManageAccessInput = {
    user: ManageAccessTarget

    activeOwners: number

    clientCount: number

    scope?: 'user' | 'service'
}

export type ManageAccessResult = {
    role: UserRole
    verified: boolean

    overrides: {
        permissions: Partial<Record<Permission, boolean>>
        limits: Partial<Record<LimitableResource, number | null>>
    }
}

type LoadedAccess = {
    permissions: Partial<Record<Permission, boolean>>
    limits: Partial<Record<LimitableResource, number | null>>
}

type AccessDraft = {
    role: UserRole
    verified: boolean
    confirmText: string
    showAdvanced: boolean
    loaded: LoadedAccess | null
    permissionOverrides: Partial<Record<Permission, boolean>>
    limitOverrides: Partial<Record<LimitableResource, number | null>>
    usage: Record<string, { used: number; limit: number | null }>
}

const EMPTY_DRAFT: AccessDraft = {
    role: 'member',
    verified: false,
    confirmText: '',
    showAdvanced: false,
    loaded: null,
    permissionOverrides: {},
    limitOverrides: {},
    usage: {},
}

type AccessAction =
    | { type: 'reset'; role: UserRole; verified: boolean }
    | { type: 'accessLoaded'; permissions: AccessDraft['permissionOverrides']; limits: AccessDraft['limitOverrides']; usage: AccessDraft['usage'] }
    | { type: 'setRole'; role: UserRole }
    | { type: 'toggleVerified' }
    | { type: 'setConfirmText'; text: string }
    | { type: 'toggleAdvanced' }
    | { type: 'setOverrides'; permissions: AccessDraft['permissionOverrides']; limits: AccessDraft['limitOverrides'] }

const accessReducer = (draft: AccessDraft, action: AccessAction): AccessDraft => {
    switch (action.type) {
        case 'reset':
            return { ...EMPTY_DRAFT, role: action.role, verified: action.verified }
        case 'accessLoaded':
            return {
                ...draft,
                loaded: { permissions: action.permissions, limits: action.limits },
                permissionOverrides: action.permissions,
                limitOverrides: action.limits,
                usage: action.usage,
            }
        case 'setRole':
            return { ...draft, role: action.role }
        case 'toggleVerified':
            return { ...draft, verified: !draft.verified }
        case 'setConfirmText':
            return { ...draft, confirmText: action.text }
        case 'toggleAdvanced':
            return { ...draft, showAdvanced: !draft.showAdvanced }
        case 'setOverrides':
            return { ...draft, permissionOverrides: action.permissions, limitOverrides: action.limits }
    }
}

const ManageAccessModal: React.FC = () => {
    const { t } = useStrings()
    const s = t.manageAccess
    const closeModal = useModalClose()
    const isOpen = useModalIsOpen(MODAL.MANAGE_ACCESS)
    const input = useModalInput<ManageAccessInput>(MODAL.MANAGE_ACCESS)
    const user = input?.user
    const isService = input?.scope === 'service'

    const [draft, dispatch] = useReducer(accessReducer, EMPTY_DRAFT)
    const fetchUserAccess = useStore((state) => state.fetchUserAccess)
    const fetchServiceAccountAccess = useStore((state) => state.fetchServiceAccountAccess)

    const roles = useStore((state) => state.roles)
    const accessPolicy = useStore((state) => state.accessPolicy)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)

    const roleItems = useMemo(
        () => roles.flatMap((entry) => (isService && entry.id === OWNER_ROLE_ID
            ? []
            : [{ key: entry.id, label: entry.name }])),
        [roles, isService]
    )

    const roleSelect = useTc<ValueElement>({
        items: roleItems,
        onChange: (next: string) => dispatch({ type: 'setRole', role: next as UserRole }),
    })

    const roleEntry = roles.find((entry) => entry.id === draft.role)
    const basePermissions = useMemo(
        () => roleEntry?.permissions ?? accessPolicy?.roles?.[draft.role] ?? [],
        [roleEntry, accessPolicy, draft.role]
    )
    const baseLimits = useMemo(
        () => accessPolicy?.roleLimits?.[draft.role] ?? {},
        [accessPolicy, draft.role]
    )

    const roleData = useMemo((): ModuleAccessRole | null => {
        if (!user || !draft.loaded) return null
        const permissions = (PERMISSIONS as readonly Permission[]).filter((permission) => {
            const override = draft.loaded?.permissions[permission]
            return override === undefined ? basePermissions.includes(permission) : override
        })
        const limits: Record<string, number> = {}
        for (const resource of LIMITABLE_RESOURCES) {
            const override = draft.loaded?.limits[resource]
            const value = resource in (draft.loaded?.limits ?? {}) ? override : baseLimits[resource]
            if (typeof value === 'number') limits[resource] = value
        }
        return {
            id: draft.role,
            name: roleEntry?.name ?? draft.role,
            builtin: roleEntry?.builtin,
            permissions,
            limits,
        }
    }, [user, draft.loaded, draft.role, basePermissions, baseLimits, roleEntry])

    const limitableResources = useMemo(
        () => LIMITABLE_RESOURCES.map((resource) => ({ key: resource, label: RESOURCE_LABELS[resource] })),
        []
    )

    const permissionCatalog = useMemo(() => [...(PERMISSIONS as readonly Permission[])], [])

    const moduleAccess = useTc<HTMLElement>({
        ownerRoleId: OWNER_ROLE_ID,
        permissions: permissionCatalog,
        permissionGroupLabels: STRINGS.accessAdmin.groups,
        limitableResources,
        roleData,
        onChange: (next: ModuleAccessRoleDraft) => {
            const drafted = new Set(next.permissions)
            const permissions: AccessDraft['permissionOverrides'] = {}
            for (const permission of PERMISSIONS as readonly Permission[]) {
                const inRole = basePermissions.includes(permission)
                const inDraft = drafted.has(permission)
                if (inDraft !== inRole) permissions[permission] = inDraft
            }
            const limits: AccessDraft['limitOverrides'] = {}
            for (const resource of LIMITABLE_RESOURCES) {
                const base = baseLimits[resource]
                const value = next.limits[resource]
                if (value === undefined) {
                    if (typeof base === 'number') limits[resource] = null
                } else if (base === undefined) {
                    if (value > 0) limits[resource] = value
                } else if (value !== base) {
                    limits[resource] = value
                }
            }
            dispatch({ type: 'setOverrides', permissions, limits })
        },
    })

    useEffect(() => {
        const el = roleSelect.current
        if (!isOpen || !user || roles.length === 0 || !el) return
        const frame = requestAnimationFrame(() => {
            el.value = user.role
        })
        return () => cancelAnimationFrame(frame)
    }, [isOpen, user, roles.length, roleSelect])

    useEffect(() => {
        if (!isOpen) return
        if (!accessPolicy) void fetchAccessPolicy()
    }, [isOpen, accessPolicy, fetchAccessPolicy])

    useEffect(() => {
        if (!isOpen || !user) return
        dispatch({ type: 'reset', role: user.role, verified: user.verified })

        let stale = false
        const load = isService ? fetchServiceAccountAccess : fetchUserAccess
        void load(user.id).then((payload) => {
            if (!payload || stale) return
            dispatch({
                type: 'accessLoaded',
                permissions: payload.permissions ?? {},
                limits: payload.limits ?? {},
                usage: Object.fromEntries(
                    (payload.usage ?? []).map((entry) => [entry.resource, { used: entry.used, limit: entry.limit }])
                ),
            })
        })
        return () => {
            stale = true
        }
    }, [isOpen, user, isService, fetchUserAccess, fetchServiceAccountAccess])

    const promotingToOwner = draft.role === OWNER_ROLE_ID && user?.role !== OWNER_ROLE_ID
    const lastOwner = user?.role === OWNER_ROLE_ID && draft.role !== OWNER_ROLE_ID && (input?.activeOwners ?? 0) <= 1

    const abandoningClients = (input?.clientCount ?? 0) > 0 && !!user && draft.role !== user.role
    const overrideCount = Object.keys(draft.permissionOverrides).length + Object.keys(draft.limitOverrides).length

    const changed = !!user && (draft.role !== user.role || draft.verified !== user.verified || draft.showAdvanced)
    const confirmed = !promotingToOwner || draft.confirmText.trim() === s.confirmWord
    const valid = changed && confirmed && !lastOwner

    const usageEntries = LIMITABLE_RESOURCES.flatMap((resource) =>
        draft.usage[resource] ? [{ resource, ...draft.usage[resource] }] : []
    )

    return (
        <>
            <div className="modal-access">
                <p className="modal-access__who">{user ? user.name || (isService ? '' : user.email) : ''}</p>

                <tc-label>{s.roleLabel}</tc-label>
                <tc-extended-select ref={roleSelect} placeholder={s.roleLabel}></tc-extended-select>

                {user && !isService && (
                    <tc-switch
                        checked={draft.verified || undefined}
                        label={s.verifiedLabel}
                        onClick={() => dispatch({ type: 'toggleVerified' })}
                    ></tc-switch>
                )}

                <button
                    type="button"
                    className="modal-access__toggle"
                    onClick={() => dispatch({ type: 'toggleAdvanced' })}
                >
                    {draft.showAdvanced ? s.hideOverrides : s.showOverrides}
                    {overrideCount > 0 && ` (${overrideCount})`}
                </button>

                {draft.showAdvanced && (
                    <div className="modal-access__overrides">
                        <p className="modal-access__hint">{s.overridesHint}</p>

                        {usageEntries.length > 0 && (
                            <p className="modal-access__usage-summary">
                                {usageEntries.map(({ resource, used, limit }) => (
                                    <em key={resource} className="modal-access__usage">
                                        {RESOURCE_LABELS[resource]}: {s.usage(used, limit)}
                                    </em>
                                ))}
                            </p>
                        )}

                        <tc-module-access ref={moduleAccess}></tc-module-access>
                    </div>
                )}

                {lastOwner && <p className="modal-access__error">{s.lastOwner}</p>}

                {abandoningClients && (
                    <p className="modal-access__warning">{s.clientsWarning(input?.clientCount ?? 0)}</p>
                )}

                {promotingToOwner && (
                    <div className="modal-access__danger">
                        <p>{s.ownerWarning}</p>
                        <tc-form-input
                            type="text"
                            label={s.confirmPrompt(s.confirmWord)}
                            onInput={(event: React.FormEvent<ValueElement>) =>
                                dispatch({ type: 'setConfirmText', text: String((event.target as ValueElement).value ?? '') })
                            }
                        ></tc-form-input>
                    </div>
                )}
            </div>
            <tc-button
                slot="footer"
                variant="primary"
                disabled={!valid || undefined}
                onClick={() =>
                    valid &&
                    closeModal({
                        role: draft.role,
                        verified: draft.verified,
                        overrides: { permissions: draft.permissionOverrides, limits: draft.limitOverrides },
                    } satisfies ManageAccessResult)
                }
            >
                {s.save}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default ManageAccessModal
