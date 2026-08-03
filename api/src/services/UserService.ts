import { inject, injectable } from 'tsyringe'
import type { AdminUserProfile, User, UserRole } from '../contracts/index.js'
import { OWNER_ROLE_ID } from '../contracts/index.js'
import { UserRepository, normalizeEmail } from '../repositories/users/UserRepository.js'
import { SessionRepository } from '../repositories/users/SessionRepository.js'
import type { SessionContext } from '../repositories/users/SessionRepository.js'
import { IdentityRepository } from '../repositories/users/IdentityRepository.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { AuditRepository } from '../repositories/moderation/AuditRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../domain/errors.js'
import { notify } from '../notify.js'
import { toUserIdentity } from '../schema/users.js'
import { toAdminProject } from '../schema/projects.js'

const PROFILE_ACTIVITY_LIMIT = 20

@injectable()
export class UserService {
    constructor(
        @inject(UserRepository) private users: UserRepository,
        @inject(SessionRepository) private sessions: SessionRepository,
        @inject(IdentityRepository) private identities: IdentityRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(AuditRepository) private audit: AuditRepository
    ) {}

    async list(): Promise<User[]> {
        return this.users.list()
    }

    async findById(id: string): Promise<User | null> {
        return this.users.findById(id)
    }

    async profile(userId: string): Promise<AdminUserProfile> {
        const user = await this.users.findById(userId)
        if (!user) throw new NotFoundError('user_not_found', 'user not found', [userId])

        const [roles, permissions, limits, usage, identities, sessions, projects, storageBytes, activity] =
            await Promise.all([
                this.access.listRoles(),
                this.access.permissionsFor(user),
                this.access.limitsFor(user),
                this.access.usageFor(user),
                this.identities.listForUser(user.id),
                this.sessions.listForUser(user.id),
                this.projects.listForMember(user.id),
                this.projects.sumOwnerBytes(user.id),
                this.audit.list({
                    actorId: user.id,
                    action: null,
                    from: null,
                    to: null,
                    q: null,
                    limit: PROFILE_ACTIVITY_LIMIT,
                    offset: 0,
                }),
            ])

        const lastSeenAt = sessions.reduce<Date | null>(
            (latest, session) =>
                latest === null || session.last_seen_at > latest ? session.last_seen_at : latest,
            null
        )

        return {
            user,
            roleName: roles.find((role) => role.id === user.role)?.name ?? user.role,
            permissions: [...permissions],
            limits,
            usage,
            identities: identities.map(toUserIdentity),
            sessionCount: sessions.length,
            lastSeenAt: lastSeenAt?.toISOString() ?? null,
            projects: projects.map(toAdminProject),
            storageBytes,
            activity: activity.map((row) => ({
                id: row.id,
                actorId: row.actor_id,
                actorName: row.actor_name,
                action: row.action,
                targetId: row.target_id,
                detail: row.detail,
                createdAt: row.created_at.toISOString(),
            })),
        }
    }

    async createProvisioned(actor: User, draft: { email: string; name?: string; role?: string }): Promise<User> {
        const email = normalizeEmail(draft.email)
        let role = draft.role
        if (role) {
            const roles = await this.access.listRoles()
            if (!roles.some((entry) => entry.id === role)) {
                throw new NotFoundError('role_not_found', `role ${role} not found`, [role])
            }
        } else {
            role = (await this.access.getBindings()).default ?? 'member'
        }
        if (await this.users.findByEmail(email)) {
            throw new ConflictError('email_exists', 'email already registered')
        }
        const created = await this.users.create({
            email,
            name: draft.name?.trim() || email.split('@')[0],
            picture: '',
            role,
        })
        void this.audit.record(actor.id, actor.name || actor.email, 'create_user', created.id, `${created.email}, role=${role}`)
        return created
    }

    async impersonate(
        actor: User,
        currentSessionId: string | null,
        targetId: string,
        context: SessionContext
    ): Promise<{ target: User; sessionId: string }> {
        const target = await this.users.findById(targetId)
        if (!target) throw new NotFoundError('user_not_found', 'user not found', [targetId])
        if (target.id === actor.id) throw new ValidationError('self_impersonation', 'cannot impersonate yourself')

        if (!target.active) throw new ConflictError('account_deactivated', 'account is deactivated')

        if (target.role === OWNER_ROLE_ID && actor.role !== OWNER_ROLE_ID) {
            throw new ForbiddenError('forbidden', 'cannot impersonate the owner')
        }

        void this.audit.record(actor.id, actor.name || actor.email, 'impersonate_user', target.id, target.email)

        if (currentSessionId) await this.sessions.delete(currentSessionId)
        return { target, sessionId: await this.sessions.create(target.id, context) }
    }

    async update(
        actor: User,
        userId: string,
        patch: { role?: UserRole; active?: boolean; verified?: boolean }
    ): Promise<User> {
        if (userId === actor.id) throw new ValidationError('self_role_change', 'cannot edit your own access')
        const target = await this.users.findById(userId)
        if (!target) throw new NotFoundError('user_not_found', 'user not found', [userId])

        const nextRole = patch.role ?? target.role
        if (patch.role) {
            const roles = await this.access.listRoles()
            if (!roles.some((role) => role.id === patch.role)) {
                throw new NotFoundError('role_not_found', `role ${patch.role} not found`, [patch.role])
            }
        }
        const losingOwner = target.role === OWNER_ROLE_ID &&
            (nextRole !== OWNER_ROLE_ID || patch.active === false)
        if (losingOwner && (await this.users.countActiveOwners()) <= 1) {
            throw new ConflictError('last_owner', 'cannot demote or deactivate the last owner')
        }
        const updated = await this.users.update(userId, patch)
        if (!updated) throw new NotFoundError('user_not_found', 'user not found', [userId])
        if (patch.active === false) await this.sessions.deleteForUser(userId)
        if (updated.role !== target.role && updated.active) {
            const roles = await this.access.listRoles()
            const label = roles.find((role) => role.id === updated.role)?.name ?? updated.role
            void notify(userId, 'system', `Your access level is now ${label}.`, '/profile')
        }

        void this.audit.record(
            actor.id,
            actor.name || actor.email,
            'update_user',
            userId,
            [
                ...Object.entries(patch).map(([key, value]) => `${key}=${value}`),
                ...(updated.role !== target.role ? [`role: ${target.role} → ${updated.role}`] : []),
            ].join(', ')
        )
        return updated
    }
}
