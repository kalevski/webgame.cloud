import { StateCreator } from 'zustand'
import AccessPolicyService from 'services/AccessPolicyService'
import { STRINGS } from 'configs/strings'
import { AccessPolicy, LimitMap, Role, RoleBindings, RoleDraft, UserAccessOverrides, UserAccessPayload } from 'types'
import type { AppStore } from './index'

export type AccessPolicySlice = {
    accessPolicy: AccessPolicy | null
    accessPolicyLoading: boolean

    roles: Role[]
    fetchAccessPolicy: () => Promise<void>

    saveRole: (draft: RoleDraft, roleId?: string) => Promise<Role | null>
    deleteRole: (roleId: string) => Promise<boolean>
    reassignRole: (roleId: string, toRoleId: string) => Promise<number | null>

    saveRoleLimits: (roleId: string, limits: LimitMap) => Promise<boolean>
    saveRoleBindings: (bindings: Partial<RoleBindings>) => Promise<boolean>

    fetchUserAccess: (userId: string) => Promise<UserAccessPayload | null>
    saveUserAccess: (userId: string, overrides: UserAccessOverrides) => Promise<boolean>
}

export const createAccessPolicySlice: StateCreator<AppStore, [], [], AccessPolicySlice> = (set, get) => ({
    accessPolicy: null,
    accessPolicyLoading: false,
    roles: [],

    async fetchAccessPolicy() {
        set({ accessPolicyLoading: true })
        try {
            const [accessPolicy, roles] = await Promise.all([
                AccessPolicyService.getInstance().fetchPolicy(),
                AccessPolicyService.getInstance().fetchRoles(),
            ])
            set({ accessPolicy, roles })
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.common.loadFailed,
                dismissible: true,
            })
        } finally {
            set({ accessPolicyLoading: false })
        }
    },

    async saveRole(draft, roleId) {
        try {
            const service = AccessPolicyService.getInstance()
            const role = roleId ? await service.updateRole(roleId, draft) : await service.createRole(draft)
            await get().fetchAccessPolicy()
            await get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.accessAdmin.saved, dismissible: true })
            return role
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.accessAdmin.saveFailed,
                dismissible: true,
            })
            return null
        }
    },

    async deleteRole(roleId) {
        try {
            await AccessPolicyService.getInstance().deleteRole(roleId)
            await get().fetchAccessPolicy()
            get().addAlert({ variant: 'success', message: STRINGS.accessAdmin.roleDeleted, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.accessAdmin.saveFailed,
                dismissible: true,
            })
            return false
        }
    },

    async reassignRole(roleId, toRoleId) {
        try {
            const { moved } = await AccessPolicyService.getInstance().reassignRole(roleId, toRoleId)
            await get().fetchUsers()
            return moved
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.accessAdmin.saveFailed,
                dismissible: true,
            })
            return null
        }
    },

    async saveRoleLimits(roleId, limits) {
        try {
            const roleLimits = { ...(get().accessPolicy?.roleLimits ?? {}) }

            if (Object.keys(limits).length > 0) roleLimits[roleId] = limits
            else delete roleLimits[roleId]
            set({ accessPolicy: await AccessPolicyService.getInstance().saveLimits(roleLimits) })
            await get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.accessAdmin.saved, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.accessAdmin.saveFailed,
                dismissible: true,
            })
            return false
        }
    },

    async saveRoleBindings(bindings) {
        try {
            await AccessPolicyService.getInstance().saveBindings(bindings)
            await get().fetchAccessPolicy()
            get().addAlert({ variant: 'success', message: STRINGS.accessAdmin.saved, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.accessAdmin.saveFailed,
                dismissible: true,
            })
            return false
        }
    },

    async fetchUserAccess(userId) {
        try {
            return await AccessPolicyService.getInstance().fetchUserAccess(userId)
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.common.loadFailed,
                dismissible: true,
            })
            return null
        }
    },

    async saveUserAccess(userId, overrides) {
        try {
            await AccessPolicyService.getInstance().saveUserAccess(userId, overrides)
            get().addAlert({ variant: 'success', message: STRINGS.accessAdmin.saved, dismissible: true })
            return true
        } catch (error) {
            get().addAlert({
                variant: 'danger',
                message: error instanceof Error ? error.message : STRINGS.accessAdmin.saveFailed,
                dismissible: true,
            })
            return false
        }
    },
})
