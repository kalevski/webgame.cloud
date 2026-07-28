import { inject, injectable } from 'tsyringe'
import type { AccountExport, OAuthProvider, User, UserIdentity, UserSession } from '../contracts/index.js'
import { OWNER_ROLE_ID } from '../contracts/index.js'
import { describeUserAgent } from '../domain/userAgent.js'
import { AccountRepository } from '../repositories/account/AccountRepository.js'
import { ProjectService } from './ProjectService.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { IdentityRepository } from '../repositories/users/IdentityRepository.js'
import { SessionRepository } from '../repositories/users/SessionRepository.js'
import { toUserIdentity, type SessionRow } from '../schema/users.js'

const toUserSession = (row: SessionRow, currentSessionId: string | null): UserSession => ({
    id: row.public_id,
    current: row.id === currentSessionId,
    ...describeUserAgent(row.user_agent),
    ip: row.ip,
    createdAt: row.created_at.toISOString(),
    lastSeenAt: row.last_seen_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
})

@injectable()
export class AccountService {
    constructor(
        @inject(AccountRepository) private account: AccountRepository,
        @inject(ProjectService) private projects: ProjectService,
        @inject(UserRepository) private users: UserRepository,
        @inject(IdentityRepository) private identities: IdentityRepository,
        @inject(SessionRepository) private sessions: SessionRepository
    ) {}

    async listIdentities(userId: string): Promise<UserIdentity[]> {
        return (await this.identities.listForUser(userId)).map(toUserIdentity)
    }

    async unlinkIdentity(userId: string, provider: OAuthProvider): Promise<void> {
        const linked = await this.identities.listForUser(userId)
        if (!linked.some((identity) => identity.provider === provider)) {
            throw new NotFoundError('identity_not_found', 'identity not found', [provider])
        }
        if (linked.length <= 1) {
            throw new ConflictError('last_identity', 'cannot unlink the only sign-in method')
        }
        await this.identities.unlink(userId, provider)
    }

    async listSessions(userId: string, currentSessionId: string | null): Promise<UserSession[]> {
        const rows = await this.sessions.listForUser(userId)
        const mapped = rows.map((row) => toUserSession(row, currentSessionId))
        return mapped.sort((left, right) => Number(right.current) - Number(left.current))
    }

    async revokeSession(userId: string, publicId: string, currentSessionId: string | null): Promise<void> {
        const session = await this.sessions.findForUser(userId, publicId)
        if (!session) throw new NotFoundError('session_not_found', 'session not found', [publicId])
        if (session.id === currentSessionId) {
            throw new ConflictError('current_session', 'cannot sign out the current device')
        }
        await this.sessions.deletePublicForUser(userId, publicId)
    }

    async consent(userId: string): Promise<User> {
        const user = await this.users.recordConsent(userId)
        if (!user) throw new NotFoundError('user_not_found', 'user not found')
        return user
    }

    async rename(userId: string, rawName: string): Promise<User> {
        const name = rawName.trim()
        if (name.length === 0) throw new ValidationError('name_required', 'name is required')
        if (!(await this.account.updateName(userId, name))) {
            throw new NotFoundError('user_not_found', 'user not found')
        }
        const user = await this.users.findById(userId)
        if (!user) throw new NotFoundError('user_not_found', 'user not found')
        return user
    }

    async exportData(userId: string): Promise<AccountExport | null> {
        const user = await this.users.findById(userId)
        if (!user) return null

        const projects = await this.projects.list(user)
        const owned = projects.filter((project) => project.ownerId === userId)
        const memberships = projects
            .filter((project) => project.ownerId !== userId)
            .map((project) => ({
                projectId: project.id,
                projectName: project.name,
                permissions: project.permissions,
                joinedAt: project.createdAt,
            }))

        return {
            exportedAt: new Date().toISOString(),
            user,
            identities: await this.listIdentities(userId),
            projects: owned,
            memberships,
        }
    }

    async deleteAccount(user: User): Promise<void> {
        if (user.role === OWNER_ROLE_ID) {
            throw new ValidationError(
                'owner_cannot_self_delete',
                'the owner account cannot delete itself while holding the owner role'
            )
        }

        await this.sessions.deleteForUser(user.id)
        await this.account.deleteUser(user.id)
    }
}
