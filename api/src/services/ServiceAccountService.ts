import { inject, injectable } from 'tsyringe'
import type {
    ApiKey,
    ApiKeyDraft,
    ApiKeyIssued,
    ServiceAccount,
    ServiceAccountDraft,
    User,
    UserAccessOverrides,
    UserAccessPayload,
    UserRole,
} from '../contracts/index.js'
import { OWNER_ROLE_ID } from '../contracts/index.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { ApiKeyService } from './ApiKeyService.js'

@injectable()
export class ServiceAccountService {
    constructor(
        @inject(UserRepository) private users: UserRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(ApiKeyService) private keys: ApiKeyService
    ) {}

    async list(): Promise<ServiceAccount[]> {
        return this.users.listServiceAccounts()
    }

    async get(id: string): Promise<ServiceAccount> {
        const account = await this.users.findServiceAccount(id)
        if (!account) throw new NotFoundError('service_account_not_found', 'service account not found', [id])
        return account
    }

    private async account(id: string): Promise<User> {
        await this.get(id)
        const user = await this.users.findById(id)
        if (!user) throw new NotFoundError('service_account_not_found', 'service account not found', [id])
        return user
    }

    private async resolveRole(role?: UserRole): Promise<UserRole> {
        if (role === OWNER_ROLE_ID) {
            throw new ValidationError('service_account_role_reserved', 'a service account cannot hold the owner role')
        }
        if (!role) return (await this.access.getBindings()).default ?? 'indie'
        const roles = await this.access.listRoles()
        if (!roles.some((entry) => entry.id === role)) {
            throw new NotFoundError('role_not_found', `role ${role} not found`, [role])
        }
        return role
    }

    async create(draft: ServiceAccountDraft): Promise<ServiceAccount> {
        const name = draft.name?.trim() ?? ''
        if (!name) throw new ValidationError('service_account_name_required', 'a name is required')

        const role = await this.resolveRole(draft.role)
        const created = await this.users.createServiceAccount({ name: name.slice(0, 80), role })
        return this.get(created.id)
    }

    async update(id: string, patch: { name?: string; role?: UserRole; active?: boolean }): Promise<ServiceAccount> {
        await this.account(id)

        if (patch.name !== undefined) {
            const name = patch.name.trim()
            if (!name) throw new ValidationError('service_account_name_required', 'a name is required')
            await this.users.touchProfile(id, { name: name.slice(0, 80), picture: '' })
        }

        if (patch.role !== undefined || patch.active !== undefined) {
            const role = patch.role === undefined ? undefined : await this.resolveRole(patch.role)
            await this.users.update(id, { role, active: patch.active })
            this.access.invalidateUser(id)
        }

        return this.get(id)
    }

    async remove(id: string): Promise<void> {
        await this.account(id)
        await this.users.deleteServiceAccount(id)
        this.access.invalidateUser(id)
    }

    async getAccess(id: string): Promise<UserAccessPayload> {
        const user = await this.account(id)
        const overrides = await this.access.getUserOverrides(user.id)
        return { ...overrides, usage: await this.access.usageFor(user) }
    }

    async saveAccess(id: string, overrides: UserAccessOverrides): Promise<UserAccessPayload> {
        const user = await this.account(id)
        const saved = await this.access.saveUserOverrides(user.id, overrides)
        return { ...saved, usage: await this.access.usageFor(user) }
    }

    async listKeys(id: string): Promise<ApiKey[]> {
        await this.get(id)
        return this.keys.list(id)
    }

    async createKey(id: string, draft: ApiKeyDraft): Promise<ApiKeyIssued> {
        await this.get(id)
        return this.keys.create(id, draft)
    }

    async revokeKey(id: string, keyId: string): Promise<void> {
        await this.get(id)
        await this.keys.revoke(id, keyId)
    }
}
