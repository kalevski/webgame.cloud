import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import type {
    AdminProject,
    AdminProjectFilters,
    AdminProjectPage,
    InviteDraft,
    Project,
    ProjectDraft,
    ProjectInvite,
    ProjectMember,
    ProjectPermission,
    ProjectCategoriesAndTags,
    User,
    CategoriesAndTagsDraft,
} from '../contracts/index.js'
import {
    ADMIN_PROJECT_SORTS,
    ADMIN_PROJECT_STATES,
    APP_TYPES,
    PROJECT_PERMISSIONS,
} from '../contracts/index.js'
import { WEB_URL } from '../env.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { MemberRepository } from '../repositories/projects/MemberRepository.js'
import { InviteRepository } from '../repositories/projects/InviteRepository.js'
import { UserRepository } from '../repositories/users/UserRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { RealmService } from './RealmService.js'
import { NotificationService } from './NotificationService.js'
import { FeatureService } from './FeatureService.js'
import { EmailService } from './EmailService.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { asProjectPermissions, resolveProjectPermissions } from '../domain/projectAccess.js'
import { Database } from '../Database.js'
import { toAdminProject, toInvite, toMember, toNamed, toProject } from '../schema/projects.js'
import type { ProjectRow } from '../schema/projects.js'

export type InviteConflict = 'exists'

const ADMIN_PROJECT_PAGE_SIZE = 20

const clean = (value: string | undefined, fallback = ''): string => value?.trim() ?? fallback

const uniqueNames = (values: readonly string[] = []): string[] => {
    const seen = new Map<string, string>()
    for (const raw of values) {
        const name = raw.trim()
        if (!name) continue
        const key = name.toLowerCase()
        if (!seen.has(key)) seen.set(key, name)
    }
    return [...seen.values()]
}

@injectable()
export class ProjectService {
    constructor(
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(MemberRepository) private members: MemberRepository,
        @inject(InviteRepository) private invites: InviteRepository,
        @inject(UserRepository) private users: UserRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(RealmService) private realms: RealmService,
        @inject(NotificationService) private notifications: NotificationService,
        @inject(FeatureService) private features: FeatureService,
        @inject(EmailService) private email: EmailService,
        @inject(Database) private database: Database
    ) {}

    private present(row: ProjectRow, user: User): Project {
        const permissions = resolveProjectPermissions(
            user,
            { ownerId: row.owner_id },
            row.caller_permissions ? { permissions: row.caller_permissions } : null
        )
        return toProject(row, [...permissions], row.owner_id === user.id)
    }

    async list(user: User, archived = false): Promise<Project[]> {
        const rows = await this.projects.listForUser(user.id, archived)
        return rows.map((row) => this.present(row, user))
    }

    async listAdmin(filters: AdminProjectFilters): Promise<AdminProjectPage> {
        const query = {
            state: ADMIN_PROJECT_STATES.includes(filters.state as never) ? filters.state! : 'active',
            q: clean(filters.q),
            appType: APP_TYPES.includes(filters.appType as never) ? filters.appType! : '',
            realmId: clean(filters.realmId),
            sort: ADMIN_PROJECT_SORTS.includes(filters.sort as never) ? filters.sort! : 'created',
            direction: filters.direction === 'asc' ? 'asc' : 'desc',
            limit: Math.min(Math.max(filters.limit ?? ADMIN_PROJECT_PAGE_SIZE, 1), 100),
            offset: Math.max(filters.offset ?? 0, 0),
        }
        const [rows, total] = await Promise.all([
            this.projects.listAdmin(query),
            this.projects.countAdmin(query),
        ])
        return { projects: rows.map(toAdminProject), total }
    }

    async getAdmin(id: string): Promise<AdminProject> {
        const row = await this.projects.findAdminById(id)
        if (!row) throw new NotFoundError('project_not_found', 'project not found', [id])
        return toAdminProject(row)
    }

    async get(row: ProjectRow, user: User): Promise<Project> {
        const membership = await this.members.findMembership(row.id, user.id)
        return this.present({ ...row, caller_permissions: membership?.permissions ?? null }, user)
    }

    async create(user: User, draft: ProjectDraft): Promise<Project> {
        const name = clean(draft.name)
        if (!name) throw new ValidationError('name_required', 'a project needs a name')

        const categories = uniqueNames(draft.categories)
        if (categories.length === 0) {
            throw new ValidationError('category_required', 'a project needs at least one category')
        }

        const created = await this.database.transaction(async (trx) => {
            await this.access.assertWithinLimit(user, 'projects')
            const realm = await this.realms.requireRealm(user.id, trx)

            const row = await this.projects.create({
                ownerId: user.id,
                realmId: realm.id,
                name,
                description: clean(draft.description),
                appType: draft.appType ?? 'game',
                genre: clean(draft.genre),
                icon: clean(draft.icon, 'Gamepad2') || 'Gamepad2',
                color: clean(draft.color),
            }, trx)

            await this.members.add(row.id, user.id, PROJECT_PERMISSIONS, trx)

            for (const category of categories) {
                await this.projects.insertNames('categories', row.id, category, trx)
            }
            for (const tag of uniqueNames(draft.tags)) {
                await this.projects.insertNames('tags', row.id, tag, trx)
            }
            for (const buildTag of uniqueNames(draft.buildTags)) {
                await this.projects.insertNames('buildTags', row.id, buildTag, trx)
            }

            return row
        })

        const fresh = await this.projects.findById(created.id)
        return this.present({ ...fresh!, caller_permissions: [...PROJECT_PERMISSIONS] }, user)
    }

    async update(row: ProjectRow, user: User, patch: Partial<ProjectDraft> & { defaultCategoryId?: string | null }): Promise<Project> {
        const name = patch.name === undefined ? row.name : clean(patch.name)
        if (!name) throw new ValidationError('name_required', 'a project needs a name')

        const updated = await this.projects.updateFields(row.id, {
            name,
            description: patch.description === undefined ? row.description : clean(patch.description),
            appType: patch.appType ?? row.app_type,
            genre: patch.genre === undefined ? row.genre : clean(patch.genre),
            icon: patch.icon === undefined ? row.icon : clean(patch.icon, row.icon) || row.icon,
            color: patch.color === undefined ? row.color : clean(patch.color),
            defaultCategoryId: patch.defaultCategoryId === undefined
                ? row.default_category_id
                : patch.defaultCategoryId ?? '',
        })
        if (!updated) throw new NotFoundError('project_not_found', `unknown project ${row.id}`, [row.id])
        return this.get(updated, user)
    }

    async setArchived(row: ProjectRow, user: User, archived: boolean): Promise<Project> {
        await this.projects.setArchived(row.id, archived)
        const fresh = await this.projects.findById(row.id)
        return this.get(fresh!, user)
    }

    async remove(row: ProjectRow): Promise<boolean> {
        const paths = await this.projects.storagePaths(row.id)
        const deleted = await this.projects.softDeleteCascade(row.id)
        if (deleted) void this.realms.purgePaths(row.realm_id, paths).catch(() => undefined)
        return deleted
    }

    async transferOwnership(row: ProjectRow, toUserId: string): Promise<void> {
        const target = await this.users.findById(toUserId)
        if (!target) throw new NotFoundError('user_not_found', `unknown user ${toUserId}`, [toUserId])

        await this.access.assertWithinLimit(target, 'projects')

        const usedBytes = await this.projects.sumBytes(row.id)
        await this.access.assertStorageHeadroom(target.id, usedBytes)

        await this.database.transaction(async (trx) => {
            await this.projects.setOwner(row.id, target.id, trx)
            await this.members.add(row.id, target.id, PROJECT_PERMISSIONS, trx)
            if (row.owner_id !== target.id) {
                await this.members.removeMembership(row.id, row.owner_id, trx)
            }
        })
    }

    async categoriesAndTags(projectId: string): Promise<ProjectCategoriesAndTags> {
        const [categories, tags, buildTags] = await Promise.all([
            this.projects.listNames('categories', projectId),
            this.projects.listNames('tags', projectId),
            this.projects.listNames('buildTags', projectId),
        ])
        return {
            categories: categories.map(toNamed),
            tags: tags.map(toNamed),
            buildTags: buildTags.map(toNamed),
        }
    }

    async replaceCategoriesAndTags(row: ProjectRow, draft: CategoriesAndTagsDraft): Promise<ProjectCategoriesAndTags> {
        const categories = uniqueNames(draft.categories)
        if (categories.length === 0) {
            throw new ValidationError('category_required', 'a project needs at least one category')
        }
        const tags = uniqueNames(draft.tags)
        const buildTags = uniqueNames(draft.buildTags)

        const current = await this.categoriesAndTags(row.id)

        for (const tag of current.tags) {
            if (tags.some((name) => name.toLowerCase() === tag.name.toLowerCase())) continue
            const used = await this.projects.countTagUsage(row.id, tag.name)
            if (used > 0) {
                throw new ConflictError('tag_in_use', `${tag.name} is still in use`, [tag.name, used])
            }
        }

        for (const tag of current.buildTags) {
            if (buildTags.some((name) => name.toLowerCase() === tag.name.toLowerCase())) continue
            const used = await this.projects.countBuildTagUsage(row.id, tag.name)
            if (used > 0) {
                throw new ConflictError('tag_in_use', `${tag.name} is still in use`, [tag.name, used])
            }
        }

        for (const category of current.categories) {
            if (categories.some((name) => name.toLowerCase() === category.name.toLowerCase())) continue
            const used = await this.projects.countCategoryUsage(row.id, category.id)
            if (used > 0) {
                throw new ConflictError('tag_in_use', `${category.name} is still in use`, [category.name, used])
            }
        }

        await this.database.transaction(async (trx) => {
            for (const name of categories) {
                await this.projects.insertNames('categories', row.id, name, trx)
            }
            for (const name of tags) {
                await this.projects.insertNames('tags', row.id, name, trx)
            }
            for (const name of buildTags) {
                await this.projects.insertNames('buildTags', row.id, name, trx)
            }
            await this.projects.pruneNames('categories', row.id, categories, trx)
            await this.projects.pruneNames('tags', row.id, tags, trx)
            await this.projects.pruneNames('buildTags', row.id, buildTags, trx)

            if (draft.defaultCategoryId !== undefined) {
                await this.projects.updateFields(row.id, {
                    name: row.name,
                    description: row.description,
                    appType: row.app_type,
                    genre: row.genre,
                    icon: row.icon,
                    color: row.color,
                    defaultCategoryId: draft.defaultCategoryId ?? '',
                }, trx)
            }
        })

        return this.categoriesAndTags(row.id)
    }

    async listMembers(projectId: string, ownerId: string): Promise<ProjectMember[]> {
        const rows = await this.members.listByProject(projectId)
        return rows.map((row) => toMember(row, ownerId))
    }

    async setMemberPermissions(
        row: ProjectRow,
        actor: User,
        held: ReadonlySet<ProjectPermission>,
        memberId: string,
        permissions: ProjectPermission[]
    ): Promise<ProjectMember> {
        const member = await this.members.findMember(memberId, row.id)
        if (!member) throw new NotFoundError('member_not_found', `unknown member ${memberId}`, [memberId])
        if (member.user_id === row.owner_id) {
            throw new ConflictError('owner_cannot_be_removed', 'the project owner keeps every permission')
        }

        this.assertNoEscalation(actor, row, permissions, held)

        await this.members.setPermissions(memberId, row.id, permissions)
        const fresh = await this.members.findMember(memberId, row.id)
        return toMember(fresh!, row.owner_id)
    }

    async removeMember(row: ProjectRow, memberId: string): Promise<void> {
        const member = await this.members.findMember(memberId, row.id)
        if (!member) throw new NotFoundError('member_not_found', `unknown member ${memberId}`, [memberId])
        if (member.user_id === row.owner_id) {
            throw new ConflictError('owner_cannot_be_removed', 'transfer ownership first')
        }
        await this.members.remove(memberId, row.id)
    }

    async leave(row: ProjectRow, user: User): Promise<void> {
        if (row.owner_id === user.id) {
            throw new ConflictError('owner_cannot_be_removed', 'transfer ownership or delete the project')
        }
        await this.members.removeMembership(row.id, user.id)
    }

    async listInvites(projectId: string): Promise<ProjectInvite[]> {
        return (await this.invites.listByProject(projectId)).map(toInvite)
    }

    async listInvitesForUser(user: User): Promise<ProjectInvite[]> {
        return (await this.invites.listForUser(user.id, user.email)).map(toInvite)
    }

    async invite(
        actor: User,
        row: ProjectRow,
        held: ReadonlySet<ProjectPermission>,
        draft: InviteDraft
    ): Promise<Result<ProjectInvite, InviteConflict>> {
        const permissions = asProjectPermissions(draft.permissions)
        this.assertNoEscalation(actor, row, permissions, held)

        let userId: string | null = null
        let email = clean(draft.email).toLowerCase()

        if (draft.username) {
            const found = await this.users.findByEmail(draft.username.trim().toLowerCase())
            if (!found) {
                throw new NotFoundError('username_not_found', 'no account with that name', [draft.username])
            }
            userId = found.id
            email = found.email.toLowerCase()
        }

        if (!email) throw new ValidationError('email_invalid', 'an invite needs an address')

        if (!userId) {
            const existing = await this.users.findByEmail(email)
            userId = existing?.id ?? null
        }

        if (userId) {
            const membership = await this.members.findMembership(row.id, userId)
            if (membership) throw new ConflictError('member_exists', 'already a member', [email])
        }

        if (!userId && !(await this.features.isEnabled('email'))) {
            throw new ConflictError('invite_undeliverable', 'email is switched off, so this invite cannot be sent')
        }

        await this.access.assertWithinProjectLimit(
            { id: row.id, ownerId: row.owner_id },
            'members_per_project'
        )

        const created = await this.invites.create(row.id, {
            email,
            userId,
            permissions,
            invitedBy: actor.id,
        })
        if (created.isErr()) return err('exists')

        const invite = toInvite(created.unwrap())

        if (userId) {
            void this.notifications.notify(
                userId,
                'project_invite',
                `${actor.name || actor.email} invited you to ${row.name}`,
                `/invites/${invite.id}`
            ).catch(() => undefined)
        } else {
            void this.email.queueTemplate('project-invitation', email, {
                inviterName: actor.name || actor.email,
                projectName: row.name,
                inviteUrl: `${WEB_URL}/invites/${invite.id}`,
            }).catch(() => undefined)
        }

        return ok(invite)
    }

    async updateInvitePermissions(
        actor: User,
        row: ProjectRow,
        held: ReadonlySet<ProjectPermission>,
        inviteId: string,
        next: ProjectPermission[]
    ): Promise<ProjectInvite> {
        const invite = await this.invites.findById(inviteId)
        if (!invite || invite.project_id !== row.id) {
            throw new NotFoundError('invite_not_found', `unknown invite ${inviteId}`, [inviteId])
        }

        const permissions = asProjectPermissions(next)
        this.assertNoEscalation(actor, row, permissions, held)

        await this.invites.setPermissions(inviteId, row.id, permissions)
        const fresh = await this.invites.findById(inviteId)
        return toInvite(fresh!)
    }

    async revokeInvite(row: ProjectRow, inviteId: string): Promise<void> {
        const revoked = await this.invites.revoke(inviteId, row.id)
        if (!revoked) throw new NotFoundError('invite_not_found', `unknown invite ${inviteId}`, [inviteId])
    }

    async acceptInvite(user: User, inviteId: string): Promise<Project> {
        const invite = await this.invites.findById(inviteId)
        if (!invite) throw new NotFoundError('invite_not_found', `unknown invite ${inviteId}`, [inviteId])

        const addressed = invite.user_id
            ? invite.user_id === user.id
            : invite.email.toLowerCase() === user.email.toLowerCase()
        if (!addressed) {
            throw new ConflictError('invite_email_mismatch', 'this invitation was sent to another address')
        }

        if (invite.expires_at.getTime() < Date.now()) {
            throw new ConflictError('invite_expired', 'this invitation has expired')
        }

        const project = await this.projects.findById(invite.project_id)
        if (!project) throw new NotFoundError('project_not_found', 'the project is gone', [invite.project_id])

        await this.access.assertWithinProjectLimit(
            { id: project.id, ownerId: project.owner_id },
            'members_per_project'
        )

        await this.database.transaction(async (trx) => {
            await this.members.add(project.id, user.id, asProjectPermissions(invite.permissions), trx)
            await this.invites.accept(inviteId, trx)
        })

        return this.get(project, user)
    }

    async declineInvite(user: User, inviteId: string): Promise<void> {
        const invite = await this.invites.findById(inviteId)
        if (!invite) throw new NotFoundError('invite_not_found', `unknown invite ${inviteId}`, [inviteId])

        const addressed = invite.user_id
            ? invite.user_id === user.id
            : invite.email.toLowerCase() === user.email.toLowerCase()
        if (!addressed) {
            throw new ConflictError('invite_email_mismatch', 'this invitation was sent to another address')
        }

        await this.invites.revoke(inviteId, invite.project_id)
    }

    async countOwned(userId: string): Promise<number> {
        return this.projects.countOwned(userId)
    }

    private assertNoEscalation(
        actor: User,
        row: ProjectRow,
        permissions: ProjectPermission[],
        held: ReadonlySet<ProjectPermission>
    ): void {
        if (row.owner_id === actor.id) return
        const missing = permissions.filter((permission) => !held.has(permission))
        if (missing.length > 0) {
            throw new ValidationError(
                'permission_escalation',
                'you cannot grant a permission you do not hold',
                [missing[0]]
            )
        }
    }
}
