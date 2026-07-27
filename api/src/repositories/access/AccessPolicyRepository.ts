import { inject, injectable } from 'tsyringe'
import type {
    AccessPolicy,
    LimitableResource,
    LimitMap,
    Permission,
    PermissionDelta,
    UserAccessOverrides,
} from '../../contracts/index.js'
import { LIMITABLE_RESOURCES } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'

import SELECT_ROLES from './sql/select-roles.sql'
import SELECT_ROLE_PERMISSIONS from './sql/select-role-permissions.sql'
import SELECT_ROLE_LIMITS from './sql/select-role-limits.sql'
import INSERT_ROLE from './sql/insert-role.sql'
import UPDATE_ROLE from './sql/update-role.sql'
import DELETE_ROLE from './sql/delete-role.sql'
import DELETE_ROLE_PERMISSIONS_FOR from './sql/delete-role-permissions-for.sql'
import COUNT_USERS_WITH_ROLE from './sql/count-users-with-role.sql'
import REASSIGN_ROLE from './sql/reassign-role.sql'
import SELECT_USER_PERMISSIONS from './sql/select-user-permissions.sql'
import SELECT_USER_LIMITS from './sql/select-user-limits.sql'
import DELETE_ROLE_LIMITS from './sql/delete-role-limits.sql'
import INSERT_ROLE_PERMISSION from './sql/insert-role-permission.sql'
import INSERT_ROLE_LIMIT from './sql/insert-role-limit.sql'
import DELETE_USER_PERMISSIONS from './sql/delete-user-permissions.sql'
import DELETE_USER_LIMITS from './sql/delete-user-limits.sql'
import INSERT_USER_PERMISSION from './sql/insert-user-permission.sql'
import INSERT_USER_LIMIT from './sql/insert-user-limit.sql'

import COUNT_PROJECTS from './sql/count-projects.sql'
import COUNT_TASKS from './sql/count-tasks.sql'

const COUNT_SQL: Record<LimitableResource, string> = {
    projects: COUNT_PROJECTS,
    tasks: COUNT_TASKS,
}

const isResource = (value: string): value is LimitableResource =>
    (LIMITABLE_RESOURCES as readonly string[]).includes(value)

@injectable()
export class AccessPolicyRepository {
    constructor(@inject(Database) private database: Database) {}

    private run(trx?: QueryRunner): QueryRunner {
        return trx ?? this.database.pool
    }

    async listRoles(trx?: QueryRunner): Promise<Array<{ id: string; name: string; builtin: boolean; position: number }>> {
        const { rows } = await this.run(trx).query<{ id: string; name: string; builtin: boolean; position: number }>(SELECT_ROLES)
        return rows
    }

    async loadPolicy(trx?: QueryRunner): Promise<Omit<AccessPolicy, 'bindings'>> {
        const runner = this.run(trx)
        const [permissions, limits] = await Promise.all([
            runner.query<{ role_id: string; permission: string }>(SELECT_ROLE_PERMISSIONS),
            runner.query<{ role: string; resource: string; max_count: number | null }>(SELECT_ROLE_LIMITS),
        ])

        const roles: Record<string, Permission[]> = {}
        const roleLimits: Record<string, LimitMap> = {}
        for (const row of permissions.rows) {
            (roles[row.role_id] ??= []).push(row.permission as Permission)
        }
        for (const row of limits.rows) {
            if (!isResource(row.resource)) continue
            const map = (roleLimits[row.role] ??= {})
            map[row.resource] = row.max_count
        }
        return { roles, roleLimits }
    }

    async saveRole(
        role: { id: string; name: string; position: number; permissions: readonly Permission[] },
        isNew: boolean
    ): Promise<void> {
        await this.database.transaction(async (trx) => {
            if (isNew) await trx.query(INSERT_ROLE, [role.id, role.name, role.position])
            else await trx.query(UPDATE_ROLE, [role.id, role.name])
            await trx.query(DELETE_ROLE_PERMISSIONS_FOR, [role.id])
            for (const permission of role.permissions) {
                await trx.query(INSERT_ROLE_PERMISSION, [role.id, permission])
            }
        })
    }

    async countUsersWithRole(roleId: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_USERS_WITH_ROLE, [roleId])
        return Number(rows[0]?.c ?? 0)
    }

    async reassignRole(fromRoleId: string, toRoleId: string): Promise<number> {
        const { rowCount } = await this.run().query(REASSIGN_ROLE, [fromRoleId, toRoleId])
        return rowCount ?? 0
    }

    async deleteRole(roleId: string): Promise<boolean> {
        const { rowCount } = await this.run().query(DELETE_ROLE, [roleId])
        return (rowCount ?? 0) > 0
    }

    async loadUserOverrides(userId: string, trx?: QueryRunner): Promise<UserAccessOverrides> {
        const runner = this.run(trx)
        const [permissions, limits] = await Promise.all([
            runner.query<{ permission: string; granted: boolean }>(SELECT_USER_PERMISSIONS, [userId]),
            runner.query<{ resource: string; max_count: number | null }>(SELECT_USER_LIMITS, [userId]),
        ])
        const overrides: UserAccessOverrides = { permissions: {}, limits: {} }
        for (const row of permissions.rows) {
            overrides.permissions[row.permission as Permission] = row.granted
        }
        for (const row of limits.rows) {
            if (!isResource(row.resource)) continue
            overrides.limits[row.resource] = row.max_count
        }
        return overrides
    }

    async saveLimits(roleLimits: AccessPolicy['roleLimits']): Promise<void> {
        await this.database.transaction(async (trx) => {
            await trx.query(DELETE_ROLE_LIMITS)
            for (const [role, map] of Object.entries(roleLimits)) {
                for (const [resource, max] of Object.entries(map ?? {})) {
                    await trx.query(INSERT_ROLE_LIMIT, [role, resource, max])
                }
            }
        })
    }

    async saveUserOverrides(userId: string, overrides: UserAccessOverrides): Promise<void> {
        await this.database.transaction(async (trx) => {
            await trx.query(DELETE_USER_PERMISSIONS, [userId])
            await trx.query(DELETE_USER_LIMITS, [userId])
            for (const [permission, granted] of Object.entries(overrides.permissions)) {
                await trx.query(INSERT_USER_PERMISSION, [userId, permission, granted])
            }
            for (const [resource, max] of Object.entries(overrides.limits)) {
                await trx.query(INSERT_USER_LIMIT, [userId, resource, max])
            }
        })
    }

    async count(resource: LimitableResource, userId: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_SQL[resource], [userId])
        return Number(rows[0]?.c ?? 0)
    }

    async countAll(userId: string, trx?: QueryRunner): Promise<Record<LimitableResource, number>> {
        const entries = await Promise.all(
            LIMITABLE_RESOURCES.map(async (resource) => [resource, await this.count(resource, userId, trx)] as const)
        )
        return Object.fromEntries(entries) as Record<LimitableResource, number>
    }
}

export type { LimitMap, PermissionDelta }
