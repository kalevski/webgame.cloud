import { inject, injectable } from 'tsyringe'
import { randomUUID } from 'node:crypto'
import type {
    OpenRole,
    RoleApplication,
    RoleApplicationDecision,
    RoleApplicationDraft,
    RoleApplicationFilters,
    User,
} from '../contracts/index.js'
import { OWNER_ROLE_ID } from '../contracts/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { RoleApplicationRepository } from '../repositories/access/RoleApplicationRepository.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { toRoleApplication } from '../schema/roles.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { notify } from '../notify.js'

const MESSAGE_MAX = 2000

@injectable()
export class RoleApplicationService {
    constructor(
        @inject(RoleApplicationRepository) private applications: RoleApplicationRepository,
        @inject(UserRepository) private users: UserRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    async openRoles(user: User): Promise<OpenRole[]> {
        const roles = await this.applications.listApplicableRoles()
        return roles.filter((role) => role.id !== user.role)
    }

    async apply(user: User, draft: RoleApplicationDraft): Promise<RoleApplication> {
        if (user.kind === 'service') {
            throw new ConflictError('role_not_applicable', 'service accounts cannot apply for a role')
        }
        if (user.role === OWNER_ROLE_ID) {
            throw new ConflictError('role_application_owner', 'the reserved role cannot apply for another role')
        }
        if (draft.roleId === user.role) {
            throw new ConflictError('role_already_held', 'you already hold this role', [draft.roleId])
        }

        const applicable = await this.applications.listApplicableRoles()
        const role = applicable.find((entry) => entry.id === draft.roleId)
        if (!role) {
            throw new ConflictError('role_not_applicable', 'this role is not open to applications', [draft.roleId])
        }

        const result = await this.applications.create({
            id: randomUUID(),
            userId: user.id,
            roleId: role.id,
            message: (draft.message ?? '').trim().slice(0, MESSAGE_MAX),
        })
        if (result.isErr()) {
            throw new ConflictError('role_application_exists', 'an application is already pending review')
        }

        const created = result.unwrap()
        if (!created) throw new NotFoundError('role_application_not_found', 'application not found')
        return toRoleApplication(created)
    }

    async mine(userId: string): Promise<RoleApplication[]> {
        return (await this.applications.listForUser(userId)).map(toRoleApplication)
    }

    async withdraw(user: User, id: string): Promise<RoleApplication> {
        const existing = await this.applications.findById(id)
        if (!existing || existing.user_id !== user.id) {
            throw new NotFoundError('role_application_not_found', 'application not found', [id])
        }
        if (!(await this.applications.withdraw(id, user.id))) {
            throw new ConflictError('role_application_not_pending', 'application is no longer pending', [id])
        }
        const updated = await this.applications.findById(id)
        if (!updated) throw new NotFoundError('role_application_not_found', 'application not found', [id])
        return toRoleApplication(updated)
    }

    async list(filters: RoleApplicationFilters): Promise<{ applications: RoleApplication[]; total: number }> {
        const query = {
            status: filters.status ?? null,
            roleId: filters.roleId ?? null,
            q: filters.q?.trim() || null,
            limit: Math.min(filters.limit ?? 25, 200),
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total] = await Promise.all([
            this.applications.list(query),
            this.applications.count(query),
        ])
        return { applications: rows.map(toRoleApplication), total }
    }

    async decide(reviewer: User, id: string, decision: RoleApplicationDecision): Promise<RoleApplication> {
        const existing = await this.applications.findById(id)
        if (!existing) throw new NotFoundError('role_application_not_found', 'application not found', [id])
        if (existing.status !== 'pending') {
            throw new ConflictError('role_application_not_pending', 'application is no longer pending', [id])
        }
        if (existing.user_id === reviewer.id) {
            throw new ValidationError('self_role_change', 'you cannot decide your own application')
        }

        const applicant = await this.users.findById(existing.user_id)
        if (!applicant) throw new NotFoundError('user_not_found', 'user not found', [existing.user_id])
        if (decision.approve && applicant.role === OWNER_ROLE_ID) {
            throw new ConflictError('role_application_owner', 'the reserved role cannot be replaced')
        }

        const decided = await this.applications.decide(id, {
            status: decision.approve ? 'approved' : 'rejected',
            note: (decision.note ?? '').trim().slice(0, MESSAGE_MAX),
            deciderId: reviewer.id,
        })
        if (!decided) {
            throw new ConflictError('role_application_not_pending', 'application is no longer pending', [id])
        }

        if (decision.approve) {
            await this.users.update(applicant.id, { role: existing.role_id })
            this.access.invalidateUser(applicant.id)
        }

        const updated = await this.applications.findById(id)
        if (!updated) throw new NotFoundError('role_application_not_found', 'application not found', [id])

        const application = toRoleApplication(updated)
        void notify(
            applicant.id,
            'role_application',
            decision.approve
                ? `Your application for ${application.roleName} was approved`
                : `Your application for ${application.roleName} was declined`,
            '/profile/roles'
        )
        return application
    }
}
