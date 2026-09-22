import { inject, injectable } from 'tsyringe'
import type {
    AccessPolicy,
    AccountLimitedResource,
    LimitUsage,
    ProjectLimitedResource,
    ResolvedLimits,
    StorageStatus,
    User,
    UserAccessOverrides,
} from '../contracts/index.js'
import type { Role, RoleBindings, RoleDraft, RoleSlot } from '../contracts/index.js'
import {
    ACCOUNT_LIMITED,
    BYTES_PER_MB,
    LIMITABLE_RESOURCES,
    OWNER_ROLE_ID,
    PERMISSIONS,
    PROJECT_LIMITED,
    RESOURCE_LABELS,
    ROLE_SLOTS,
    SEED_ROLE_BINDINGS,
    toRoleId,
} from '../contracts/index.js'
import { SettingsService } from './SettingsService.js'
import { AccessPolicyRepository } from '../repositories/access/AccessPolicyRepository.js'
import { BillingRepository } from '../repositories/billing/BillingRepository.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import type { RoleRow } from '../schema/roles.js'
import { Database } from '../Database.js'

export const ACCESS_POLICY_CHANNEL = 'access_policy_changed'
import {
    EMPTY_OVERRIDES,
    effectiveCeiling,
    isInSlot,
    resolveLimitFor,
    resolveLimits,
    resolvePermissions,
    rolesInSlot,
    toRole,
} from '../domain/access.js'
import { ConflictError as Conflict, NotFoundError, ValidationError } from '../domain/errors.js'
import { KeyedCache, dropSlot, fromSlot, slot } from '../domain/cache.js'

const POLICY_TTL_MS = 30_000

const USER_CACHE_MAX = 5_000

const slotKey = (slot: RoleSlot) => `role_slot_${slot}`

@injectable()
export class AccessPolicyService {
    private policySlot = slot<AccessPolicy>()

    private roleRowsSlot = slot<RoleRow[]>()

    private userCache = new KeyedCache<UserAccessOverrides>(POLICY_TTL_MS, USER_CACHE_MAX)

    constructor(
        @inject(AccessPolicyRepository) private repository: AccessPolicyRepository,
        @inject(SettingsService) private settings: SettingsService,
        @inject(BillingRepository) private billing: BillingRepository,
        @inject(UserRepository) private users: UserRepository,
        @inject(Database) private database: Database
    ) {}

    async policy(): Promise<AccessPolicy> {
        return fromSlot(this.policySlot, POLICY_TTL_MS, async () => {
            const [loaded, bindings] = await Promise.all([this.repository.loadPolicy(), this.loadBindings()])
            return { ...loaded, bindings }
        })
    }

    invalidate(): void {
        this.invalidateLocal()
        void this.database.notify(ACCESS_POLICY_CHANNEL, '*')
    }

    private invalidateLocal(): void {
        dropSlot(this.policySlot)
        dropSlot(this.roleRowsSlot)
    }

    async init(): Promise<void> {
        await this.database.listen(ACCESS_POLICY_CHANNEL, (payload) => {
            if (payload === '*') this.invalidateLocal()
            else this.userCache.drop(payload)
        })
    }

    private async roleRows(): Promise<RoleRow[]> {
        return fromSlot(this.roleRowsSlot, POLICY_TTL_MS, () => this.repository.listRoles())
    }

    invalidateUser(userId: string): void {
        this.userCache.drop(userId)
        void this.database.notify(ACCESS_POLICY_CHANNEL, userId)
    }

    async getPolicy(): Promise<AccessPolicy> {
        return this.policy()
    }

    async listRoles(): Promise<Role[]> {
        const [rows, policy] = await Promise.all([this.roleRows(), this.policy()])
        return rows.map((row) => toRole(row, policy))
    }

    async saveRole(draft: RoleDraft, existingId?: string): Promise<Role> {
        const name = draft.name.trim()
        if (!name) throw new ValidationError('name_required', 'a role must have a name')
        if (existingId === OWNER_ROLE_ID) {
            throw new Conflict('role_builtin', 'the reserved role cannot be edited')
        }

        const id = existingId ?? toRoleId(draft.id?.trim() || name)
        if (!id) throw new ValidationError('id_required', 'invalid role identifier')
        if (!existingId && id === OWNER_ROLE_ID) {
            throw new Conflict('role_reserved', 'the identifier "owner" is reserved')
        }

        const existing = (await this.repository.listRoles()).find((row) => row.id === id)
        if (!existingId && existing) {
            throw new Conflict('role_exists', 'a role with that identifier already exists')
        }
        if (existingId && !existing) throw new NotFoundError('role_not_found', `role ${id} not found`, [id])

        const permitted = new Set<string>(PERMISSIONS)
        await this.repository.saveRole(
            {
                id,
                name,
                position: existing?.position ?? 60,
                applicable: draft.applicable ?? existing?.applicable ?? false,
                applicationPrompt: (draft.applicationPrompt ?? existing?.application_prompt ?? '').trim().slice(0, 500),
                permissions: draft.permissions.filter((key) => permitted.has(key)),
            },
            !existing
        )
        this.invalidate()
        const saved = (await this.listRoles()).find((role) => role.id === id)
        return saved!
    }

    async deleteRole(roleId: string): Promise<void> {
        if (roleId === OWNER_ROLE_ID) {
            throw new Conflict('role_builtin', 'the reserved role cannot be deleted')
        }
        const inUse = await this.repository.countUsersWithRole(roleId)
        if (inUse > 0) {
            throw new Conflict('role_in_use', `${inUse} account(s) still hold this role`, [inUse])
        }

        const bindings = await this.loadBindings()
        const bound = ROLE_SLOTS.filter((slot) => bindings[slot] === roleId)
        if (bound.length > 0) {
            throw new Conflict('role_bound', 'this role is bound to a slot in settings')
        }

        const dependents = await this.repository.countRoleDependents(roleId)
        if (dependents.plans > 0 || dependents.visibility > 0) {
            throw new Conflict('role_plan_bound', 'a billing plan still grants or targets this role', [
                dependents.plans + dependents.visibility,
            ])
        }
        if (dependents.applications > 0) {
            throw new Conflict('role_has_applications', 'applications for this role are still pending', [
                dependents.applications,
            ])
        }
        const removed = await this.repository.deleteRole(roleId)
        if (!removed) throw new NotFoundError('role_not_found', `role ${roleId} not found`, [roleId])
        this.invalidate()
    }

    async reassignRole(fromRoleId: string, toRoleId: string): Promise<number> {
        const roles = await this.repository.listRoles()
        if (!roles.some((role) => role.id === toRoleId)) {
            throw new NotFoundError('role_not_found', `role ${toRoleId} not found`, [toRoleId])
        }
        const moved = await this.repository.reassignRole(fromRoleId, toRoleId)
        this.invalidate()
        return moved
    }

    async countUsersWithRole(roleId: string): Promise<number> {
        return this.repository.countUsersWithRole(roleId)
    }

    async inSlot(user: { role: string }, slot: RoleSlot): Promise<boolean> {
        return isInSlot(user.role, slot, (await this.policy()).bindings)
    }

    async roleIdsInSlot(slot: RoleSlot): Promise<string[]> {
        return rolesInSlot(slot, (await this.policy()).bindings)
    }

    private async loadBindings(): Promise<RoleBindings> {
        const entries = await Promise.all(
            ROLE_SLOTS.map(async (slot) => [slot, (await this.settings.getRaw(slotKey(slot))) ?? null] as const)
        )
        const bindings = Object.fromEntries(entries) as RoleBindings

        if (!bindings.default) bindings.default = SEED_ROLE_BINDINGS.default
        return bindings
    }

    async getBindings(): Promise<RoleBindings> {
        return (await this.policy()).bindings
    }

    async saveBindings(next: Partial<RoleBindings>): Promise<RoleBindings> {
        const roles = new Set((await this.repository.listRoles()).map((role) => role.id))
        for (const slot of ROLE_SLOTS) {
            const value = next[slot]
            if (value === undefined) continue
            if (value !== null && !roles.has(value)) {
                throw new NotFoundError('role_not_found', `role ${value} not found`, [value])
            }
            await this.settings.setRaw(slotKey(slot), value ?? '')
        }

        const bindings = await this.loadBindings()
        if (!bindings.default) {
            throw new ValidationError('default_role_required', 'a default role must be set')
        }
        this.invalidate()
        return (await this.policy()).bindings
    }

    async saveLimits(roleLimits: AccessPolicy['roleLimits']): Promise<AccessPolicy> {
        await this.repository.saveLimits(this.sanitizeLimits(roleLimits))
        this.invalidate()
        return this.policy()
    }

    private sanitizeLimits(roleLimits: AccessPolicy['roleLimits']): AccessPolicy['roleLimits'] {
        const resources = new Set<string>(LIMITABLE_RESOURCES)
        const out: AccessPolicy['roleLimits'] = {}
        for (const [role, map] of Object.entries(roleLimits ?? {})) {
            const kept = Object.fromEntries(
                Object.entries(map ?? {})
                    .filter(([key]) => resources.has(key))
                    .map(([key, value]) => [key, value === null ? null : Math.max(0, Math.floor(Number(value)))])
            )
            if (Object.keys(kept).length > 0) out[role] = kept
        }
        return out
    }

    async getUserOverrides(userId: string): Promise<UserAccessOverrides> {
        return this.userCache.get(userId, () => this.repository.loadUserOverrides(userId))
    }

    async saveUserOverrides(userId: string, overrides: UserAccessOverrides): Promise<UserAccessOverrides> {
        const permitted = new Set<string>(PERMISSIONS)
        const resources = new Set<string>(LIMITABLE_RESOURCES)
        await this.repository.saveUserOverrides(userId, {
            permissions: Object.fromEntries(
                Object.entries(overrides.permissions ?? {}).filter(([key]) => permitted.has(key))
            ),
            limits: Object.fromEntries(
                Object.entries(overrides.limits ?? {})
                    .filter(([key]) => resources.has(key))
                    .map(([key, value]) => [key, value === null ? null : Math.max(0, Math.floor(Number(value)))])
            ),
        })
        this.invalidateUser(userId)
        return this.getUserOverrides(userId)
    }

    async usageFor(user: User): Promise<LimitUsage[]> {
        const [policy, overrides, counts] = await Promise.all([
            this.policy(),
            this.getUserOverrides(user.id),
            this.repository.countAll(user.id),
        ])
        const limits = resolveLimits(user, policy, overrides)
        return ACCOUNT_LIMITED.map((resource) => {
            const limit = limits[resource]
            const used = resource === 'storage_mb'
                ? Math.round(counts[resource] / BYTES_PER_MB)
                : counts[resource]
            return {
                resource,
                used,
                limit,
                reached: limit !== null && used >= limit,
            }
        })
    }

    async projectUsageFor(project: { id: string; ownerId: string }): Promise<LimitUsage[]> {
        const owner = await this.users.findById(project.ownerId)
        const [policy, overrides] = await Promise.all([
            this.policy(),
            this.getUserOverrides(project.ownerId),
        ])
        const usage = await Promise.all(PROJECT_LIMITED.map(async (resource) => {
            const limit = owner
                ? resolveLimitFor(resource, owner.role, policy, overrides)
                : null
            const used = await this.repository.countInProject(resource, project.id)
            return { resource, used, limit, reached: limit !== null && used >= limit }
        }))
        return usage
    }

    async limitsFor(user: User): Promise<ResolvedLimits> {
        const [policy, overrides] = await Promise.all([this.policy(), this.getUserOverrides(user.id)])
        return resolveLimits(user, policy, overrides)
    }

    async permissionsFor(user: User): Promise<ReadonlySet<import('../contracts/index.js').Permission>> {
        const [policy, overrides] = await Promise.all([this.policy(), this.getUserOverrides(user.id)])
        return resolvePermissions(user, policy, overrides)
    }

    async countOf(user: User, resource: AccountLimitedResource): Promise<number> {
        return this.repository.countResource(resource, user.id)
    }

    async assertWithinLimit(user: User, resource: AccountLimitedResource): Promise<void> {
        const limits = await this.limitsFor(user)
        const ceiling = effectiveCeiling(resource, limits[resource])
        const used = await this.repository.countResource(resource, user.id)
        if (used >= ceiling) {
            throw new Conflict(
                'limit_reached',
                `limit of ${ceiling} ${resource} reached`,
                [resource, ceiling]
            )
        }
    }

    async assertWithinProjectLimit(
        project: { id: string; ownerId: string },
        resource: ProjectLimitedResource
    ): Promise<void> {
        const owner = await this.users.findById(project.ownerId)
        const [policy, overrides] = await Promise.all([
            this.policy(),
            this.getUserOverrides(project.ownerId),
        ])
        const limit = owner ? resolveLimitFor(resource, owner.role, policy, overrides) : null
        const ceiling = effectiveCeiling(resource, limit)
        const used = await this.repository.countInProject(resource, project.id)
        if (used >= ceiling) {
            throw new ValidationError(
                'project_limit_reached',
                `limit of ${ceiling} ${resource} reached`,
                [resource, used, ceiling]
            )
        }
    }

    async storageStatus(ownerId: string, addBytes = 0): Promise<StorageStatus> {
        const owner = await this.users.findById(ownerId)
        const [policy, overrides, usedBytes, plan] = await Promise.all([
            this.policy(),
            this.getUserOverrides(ownerId),
            this.repository.countResource('storage_mb', ownerId),
            this.planOf(ownerId),
        ])
        const limitMb = owner ? resolveLimitFor('storage_mb', owner.role, policy, overrides) : null
        const limitBytes = effectiveCeiling('storage_mb', limitMb) * BYTES_PER_MB
        const overageAllowed = plan?.storage_overage_allowed ?? false
        const graceBytes = overageAllowed ? Math.floor(limitBytes * 1.5) : limitBytes
        const projected = usedBytes + Math.max(0, addBytes)

        const verdict: StorageStatus['verdict'] = projected < limitBytes
            ? 'ok'
            : projected < graceBytes ? 'grace' : 'blocked'

        return { usedBytes, limitBytes, graceBytes, verdict, overageAllowed }
    }

    async assertStorageHeadroom(ownerId: string, addBytes: number): Promise<StorageStatus> {
        const status = await this.storageStatus(ownerId, addBytes)
        if (status.verdict === 'blocked') {
            throw new ValidationError(
                'storage_hard_cap_exceeded',
                'storage hard cap exceeded',
                [
                    Math.round(status.usedBytes / BYTES_PER_MB),
                    Math.round((status.limitBytes ?? 0) / BYTES_PER_MB),
                ]
            )
        }
        void this.syncOverageFlag(ownerId, status)
        return status
    }

    async syncOverageFlag(ownerId: string, status: StorageStatus): Promise<void> {
        const overBy = status.limitBytes === null
            ? 0
            : Math.max(0, status.usedBytes - status.limitBytes)
        await this.billing.flagStorageOverage(ownerId, overBy).catch(() => undefined)
    }

    private async planOf(userId: string): Promise<{ storage_overage_allowed: boolean } | undefined> {
        const subscription = await this.billing.findSubscription(userId).catch(() => undefined)
        const planId = subscription?.staff_override_plan_id ?? subscription?.plan_id
        if (!planId) return undefined
        return this.billing.findPlan(planId).catch(() => undefined)
    }
}
