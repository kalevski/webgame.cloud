import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import type {
    ProjectMigration,
    Realm,
    RealmDraft,
    RealmHeartbeat,
    RealmToken,
} from '../contracts/index.js'
import { MIGRATION_TIMEOUT_MINUTES } from '../contracts/index.js'
import { ConflictError, NotFoundError, UnavailableError } from '../domain/errors.js'
import { RealmRepository } from '../repositories/realms/RealmRepository.js'
import { ProjectMigrationRepository } from '../repositories/realms/ProjectMigrationRepository.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { toMigration, toRealm } from '../schema/realms.js'
import type { RealmRow } from '../schema/realms.js'
import type { QueryRunner } from '../Database.js'
import { BillingService } from './BillingService.js'
import { JobService } from './JobService.js'
import { SigningKeyService } from './SigningKeyService.js'
import { getLogger } from '../logging.js'

const log = getLogger('realms')

export const REALM_TOKEN_PREFIX = 'rlm'

export const hashRealmToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex')

export const JOB_REALM_MIGRATE = 'realm.migrate'
export const JOB_REALM_PURGE = 'realm.purge'
export const JOB_REALM_REAP_MIGRATIONS = 'realms.reap_stale_migrations'

export type MoveConflict = 'in_progress'

const newToken = (): string => `${REALM_TOKEN_PREFIX}_${randomBytes(24).toString('base64url')}`

@injectable()
export class RealmService {
    constructor(
        @inject(RealmRepository) private realms: RealmRepository,
        @inject(ProjectMigrationRepository) private migrations: ProjectMigrationRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(BillingService) private billing: BillingService,
        @inject(JobService) private jobs: JobService,
        @inject(SigningKeyService) private signing: SigningKeyService
    ) {}

    async list(): Promise<Realm[]> {
        return (await this.realms.findAll()).map(toRealm)
    }

    async find(id: string): Promise<Realm> {
        const row = await this.realms.findById(id)
        if (!row) throw new NotFoundError('realm_not_found', `unknown realm ${id}`, [id])
        return toRealm(row)
    }

    async findByToken(token: string): Promise<RealmRow | undefined> {
        if (!token.startsWith(`${REALM_TOKEN_PREFIX}_`)) return undefined
        return this.realms.findByTokenHash(hashRealmToken(token))
    }

    async create(draft: RealmDraft): Promise<Result<RealmToken, 'exists'>> {
        const token = newToken()
        const created = await this.realms.create(
            {
                name: draft.name.trim(),
                baseUrl: draft.baseUrl.trim().replace(/\/+$/, ''),
                region: draft.region?.trim() ?? '',
                planId: draft.planId ?? null,
                exclusive: draft.exclusive ?? false,
                status: draft.status ?? 'active',
            },
            hashRealmToken(token)
        )
        if (created.isErr()) return err('exists')
        return ok({ realm: toRealm(created.unwrap()), token })
    }

    async update(id: string, draft: RealmDraft): Promise<Result<Realm, 'exists'>> {
        const existing = await this.realms.findById(id)
        if (!existing) throw new NotFoundError('realm_not_found', `unknown realm ${id}`, [id])

        const updated = await this.realms.updateRealm(id, {
            name: draft.name?.trim() || existing.name,
            baseUrl: draft.baseUrl?.trim().replace(/\/+$/, '') || existing.base_url,
            region: draft.region?.trim() ?? existing.region,
            planId: draft.planId === undefined ? existing.plan_id : draft.planId,
            exclusive: draft.exclusive ?? existing.exclusive,
            status: draft.status ?? existing.status,
        })
        if (updated.isErr()) return err('exists')
        const row = updated.unwrap()
        if (!row) throw new NotFoundError('realm_not_found', `unknown realm ${id}`, [id])
        return ok(toRealm(row))
    }

    async remove(id: string): Promise<void> {
        const hosted = await this.realms.countProjects(id)
        if (hosted > 0) {
            throw new ConflictError('realm_in_use', `${hosted} projects live on this realm`, [hosted])
        }
        const removed = await this.realms.softDelete(id)
        if (!removed) throw new NotFoundError('realm_not_found', `unknown realm ${id}`, [id])
    }

    async rotateToken(id: string): Promise<RealmToken> {
        const token = newToken()
        const updated = await this.realms.setTokenHash(id, hashRealmToken(token))
        if (!updated) throw new NotFoundError('realm_not_found', `unknown realm ${id}`, [id])
        return { realm: await this.find(id), token }
    }

    async heartbeat(realmId: string, beat: RealmHeartbeat): Promise<void> {
        await this.realms.touchHeartbeat(realmId, beat)
    }

    async selectRealm(ownerId: string, trx?: QueryRunner): Promise<RealmRow | undefined> {
        const plan = await this.billing.resolvePlan(ownerId).catch(() => null)
        const candidates = await this.realms.findCandidates(plan?.id ?? null, trx)
        return candidates[0]
    }

    async requireRealm(ownerId: string, trx?: QueryRunner): Promise<RealmRow> {
        const realm = await this.selectRealm(ownerId, trx)
        if (!realm) {
            throw new UnavailableError('realm_unavailable', 'no realm can accept this project')
        }
        return realm
    }

    async lockOf(projectId: string): Promise<{ locked: boolean; migration: ProjectMigration | null }> {
        const row = await this.migrations.findActive(projectId)
        return { locked: Boolean(row), migration: row ? toMigration(row) : null }
    }

    async moveProject(
        projectId: string,
        toRealmId: string,
        actorId: string | null
    ): Promise<Result<ProjectMigration, MoveConflict>> {
        const project = await this.projects.findById(projectId)
        if (!project) throw new NotFoundError('project_not_found', `unknown project ${projectId}`, [projectId])

        const target = await this.realms.findById(toRealmId)
        if (!target) throw new NotFoundError('realm_not_found', `unknown realm ${toRealmId}`, [toRealmId])
        if (target.status === 'offline') {
            throw new ConflictError('realm_offline', 'target realm is offline', [target.name])
        }

        const created = await this.migrations.create({
            projectId,
            fromRealmId: project.realm_id,
            toRealmId,
            actorId,
        })
        if (created.isErr()) return err('in_progress')
        const row = created.unwrap()

        await this.jobs.enqueue({
            kind: JOB_REALM_MIGRATE,
            payload: { migrationId: row.id },
            uniqueKey: `${JOB_REALM_MIGRATE}:${row.id}`,
        })

        return ok(toMigration(row))
    }

    async purgePaths(realmId: string | null, paths: string[]): Promise<void> {
        if (!realmId || paths.length === 0) return
        await this.jobs.enqueue({
            kind: JOB_REALM_PURGE,
            payload: { realmId, paths },
            uniqueKey: `${JOB_REALM_PURGE}:${randomUUID()}`,
        })
    }

    async runMigration(migrationId: string): Promise<void> {
        const migration = await this.migrations.findById(migrationId)
        if (!migration) return
        if (migration.state === 'completed' || migration.state === 'failed') return

        const [source, target] = await Promise.all([
            migration.from_realm_id ? this.realms.findById(migration.from_realm_id) : Promise.resolve(undefined),
            this.realms.findById(migration.to_realm_id),
        ])
        if (!target) {
            await this.migrations.fail(migrationId, 'target realm is gone')
            return
        }

        try {
            const instruction = await this.signing.sign('realm_transfer', {
                sub: migration.project_id,
                migrationId,
                fromRealm: source?.id ?? null,
                toRealm: target.id,
            }, { expiresInSeconds: 3600 })

            await this.migrations.advance(migrationId, 'exporting')
            const manifest = source
                ? await this.callRealm<{ files: Array<{ path: string; size: number; sha256: string }> }>(
                    source, 'POST', '/transfer/export', { token: instruction.token }
                )
                : { files: [] }

            await this.migrations.advance(migrationId, 'importing')
            await this.callRealm(target, 'POST', '/transfer/import', {
                token: instruction.token,
                from: source?.base_url ?? '',
                files: manifest.files,
            })

            const verified = await this.callRealm<{ complete: boolean }>(target, 'POST', '/transfer/verify', {
                token: instruction.token,
                files: manifest.files,
            })
            if (!verified.complete) throw new Error('target could not confirm every file')

            await this.migrations.advance(migrationId, 'repointing')
            await this.projects.setRealm(migration.project_id, target.id)

            await this.migrations.advance(migrationId, 'purging')
            if (source) {
                await this.callRealm(source, 'POST', '/transfer/purge', {
                    token: instruction.token,
                    files: manifest.files,
                }).catch(() => undefined)
            }

            await this.migrations.advance(migrationId, 'completed')
        } catch (error) {
            log.error('migration failed', { migrationId, error: String(error) })
            await this.migrations.fail(migrationId, String(error))
        }
    }

    async purgeOnRealm(realmId: string, paths: string[]): Promise<void> {
        const realm = await this.realms.findById(realmId)
        if (!realm) return
        const instruction = await this.signing.sign('realm_transfer', {
            sub: realmId,
            paths: paths.length,
        }, { expiresInSeconds: 3600 })
        await this.callRealm(realm, 'POST', '/purge', { token: instruction.token, paths })
    }

    async reapStaleMigrations(): Promise<number> {
        const stale = await this.migrations.findStale(MIGRATION_TIMEOUT_MINUTES)
        for (const row of stale) {
            await this.migrations.fail(row.id, 'migration timeout')
        }
        if (stale.length > 0) log.warning('failed stale migrations', { count: stale.length })
        return stale.length
    }

    async init(): Promise<void> {
        const pending = await this.migrations.findNonTerminal().catch(() => [])
        for (const row of pending) {
            await this.jobs.enqueue({
                kind: JOB_REALM_MIGRATE,
                payload: { migrationId: row.id },
                uniqueKey: `${JOB_REALM_MIGRATE}:${row.id}:resume`,
            }).catch(() => undefined)
        }
        if (pending.length > 0) log.info('re-enqueued migrations', { count: pending.length })
    }

    private async callRealm<T>(
        realm: RealmRow,
        method: string,
        path: string,
        body: unknown
    ): Promise<T> {
        const response = await fetch(`${realm.base_url}${path}`, {
            method,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            throw new Error(`realm ${realm.name} answered ${response.status} for ${path}`)
        }
        return await response.json() as T
    }
}
