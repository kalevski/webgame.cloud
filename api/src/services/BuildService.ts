import { inject, injectable } from 'tsyringe'
import type {
    AssetManifest,
    Build,
    BuildDetail,
    BuildFilters,
    BuildSnapshot,
    RealmJob,
    RealmJobResult,
    User,
} from '../contracts/index.js'
import { BUILD_POLL_MAX_MS } from '../contracts/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { BuildRepository } from '../repositories/builds/BuildRepository.js'
import { BundleRepository } from '../repositories/bundles/BundleRepository.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { BundleService } from './BundleService.js'
import { ConfigService } from './ConfigService.js'
import { NotificationService } from './NotificationService.js'
import { SettingsService } from './SettingsService.js'
import { toBuild, toBuildFile, toRowStatus } from '../schema/builds.js'
import { toBundle } from '../schema/bundles.js'
import type { BuildRow } from '../schema/builds.js'
import type { ProjectRow } from '../schema/projects.js'
import type { RealmRow } from '../schema/realms.js'
import { getLogger } from '../logging.js'

const log = getLogger('builds')

const DEFAULT_TIMEOUT_MINUTES = 30

type Waiter = {
    realmId: string
    resolve: () => void
}

@injectable()
export class BuildService {
    private waiters = new Set<Waiter>()

    constructor(
        @inject(BuildRepository) private builds: BuildRepository,
        @inject(BundleRepository) private bundles: BundleRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(BundleService) private bundleService: BundleService,
        @inject(ConfigService) private configs: ConfigService,
        @inject(NotificationService) private notifications: NotificationService,
        @inject(SettingsService) private settings: SettingsService
    ) {}

    async list(projectId: string, filters: BuildFilters = {}): Promise<Build[]> {
        const [createdAt, id] = (filters.cursor ?? '').split('|')
        const rows = await this.builds.listByProject(projectId, {
            status: filters.status ? toRowStatus(filters.status) : undefined,
            bundleId: filters.bundleId,
            limit: filters.limit,
            offset: filters.offset,
            cursorCreatedAt: createdAt || undefined,
            cursorId: id || undefined,
        })
        return rows.map(toBuild)
    }

    async detail(projectId: string, buildId: string): Promise<BuildDetail> {
        const row = await this.builds.findById(buildId)
        if (!row || row.project_id !== projectId) {
            throw new NotFoundError('build_not_found', `unknown build ${buildId}`, [buildId])
        }
        const files = await this.builds.listFiles(buildId)
        const snapshot = row.snapshot && 'bundle' in row.snapshot ? (row.snapshot as BuildSnapshot) : null
        return { ...toBuild(row), files: files.map(toBuildFile), snapshot }
    }

    async trigger(user: User, project: ProjectRow, bundleId: string): Promise<Build> {
        const bundle = await this.bundles.findById(bundleId)
        if (!bundle || bundle.project_id !== project.id) {
            throw new NotFoundError('bundle_not_found', `unknown bundle ${bundleId}`, [bundleId])
        }

        const resolution = await this.bundleService.resolve(bundle)
        if (resolution.uploadIds.length === 0) {
            throw new ValidationError('bundle_empty', 'this bundle matches no files', [bundle.name])
        }

        if (bundle.build_tag) {
            const buildTags = await this.projects.listNames('buildTags', project.id)
            if (!buildTags.some((row) => row.name.toLowerCase() === bundle.build_tag.toLowerCase())) {
                throw new ValidationError('unknown_build_tag', 'that build tag is gone', [bundle.build_tag])
            }
        }

        const configs = await this.configs.resolveForBuildTag(project.id, bundle.build_tag)
        const matched = await this.bundleService.preview(project.id, {
            categoryId: bundle.category_id,
            includedTags: bundle.included_tags,
            excludedTags: bundle.excluded_tags,
        })
        const snapshot: BuildSnapshot = {
            bundle: toBundle(bundle),
            configs,
            assets: matched.files.map((file) => ({
                id: file.id,
                name: file.name,
                kind: file.kind,
                sizeBytes: file.sizeBytes,
                tags: file.tags,
            })),
        }

        const created = await this.builds.create({
            projectId: project.id,
            bundleId: bundle.id,
            realmId: project.realm_id,
            triggeredBy: user.id,
            buildTag: bundle.build_tag,
            snapshot,
        })

        this.wake(project.realm_id)
        return toBuild(created)
    }

    async claim(realm: RealmRow, waitMs = BUILD_POLL_MAX_MS): Promise<RealmJob | null> {
        const claimed = await this.builds.claim(realm.id)
        if (claimed) return this.toJob(claimed)

        const waited = await this.waitForWork(realm.id, Math.min(waitMs, BUILD_POLL_MAX_MS))
        if (!waited) return null

        const second = await this.builds.claim(realm.id)
        return second ? this.toJob(second) : null
    }

    async report(realm: RealmRow, buildId: string): Promise<void> {
        await this.builds.markRunning(buildId, realm.id)
    }

    async complete(realm: RealmRow, buildId: string, result: RealmJobResult): Promise<void> {
        const row = await this.builds.findById(buildId)
        if (!row || row.realm_id !== realm.id) {
            throw new NotFoundError('build_not_found', `unknown build ${buildId}`, [buildId])
        }

        const done = result.state === 'fulfilled'
        await this.builds.complete(buildId, realm.id, {
            status: done ? 'done' : 'failed',
            artifactUrl: result.artifactUrl ?? '',
            manifestUrl: result.manifestUrl ?? '',
            checksum: result.checksum ?? '',
            sizeBytes: result.sizeBytes ?? 0,
            durationMs: result.durationMs ?? 0,
            error: result.error ?? '',
            files: result.files ?? [],
        })

        if (!done) {
            const project = await this.projects.findById(row.project_id)
            if (project) {
                void this.notifications.notify(
                    project.owner_id,
                    'build_failed',
                    `Build failed for ${row.bundle_name ?? 'a bundle'}`,
                    `/projects/${project.id}/builds/${buildId}`
                ).catch(() => undefined)
            }
        }
    }

    async setTag(project: ProjectRow, buildId: string, tag: string): Promise<Build> {
        const row = await this.builds.findById(buildId)
        if (!row || row.project_id !== project.id) {
            throw new NotFoundError('build_not_found', `unknown build ${buildId}`, [buildId])
        }
        if (tag && row.status !== 'done') {
            throw new ConflictError('build_not_finished', 'only a passed build can hold a build tag')
        }
        if (tag) {
            const buildTags = await this.projects.listNames('buildTags', project.id)
            if (!buildTags.some((entry) => entry.name.toLowerCase() === tag.toLowerCase())) {
                throw new ValidationError('build_tag_unknown', 'that build tag is not in this project', [tag])
            }
        }

        await this.builds.setTag(row, tag)
        const fresh = await this.builds.findById(buildId)
        return toBuild(fresh!)
    }

    async remove(project: ProjectRow, buildId: string): Promise<string | null> {
        const row = await this.builds.findById(buildId)
        if (!row || row.project_id !== project.id) {
            throw new NotFoundError('build_not_found', `unknown build ${buildId}`, [buildId])
        }
        await this.builds.softDelete(buildId, project.id)
        return row.artifact_url || null
    }

    async purgeUntagged(project: ProjectRow): Promise<number> {
        return this.builds.purgeUntagged(project.id)
    }

    async manifest(projectId: string, buildId: string | null, buildTag: string): Promise<AssetManifest> {
        const row = await this.builds.manifest(projectId, buildId, buildTag)
        if (!row) throw new NotFoundError('build_not_found', 'no matching build', [buildId ?? buildTag])
        return {
            buildId: row.id,
            buildTag: row.build_tag,
            checksum: row.checksum,
            files: (row.files ?? []) as AssetManifest['files'],
        }
    }

    async reapStale(): Promise<number> {
        const minutes = Number(await this.settings.getRaw('build_timeout_minutes')) || DEFAULT_TIMEOUT_MINUTES
        const reaped = await this.builds.reapStale(minutes)
        if (reaped.length > 0) log.warning('failed stale builds', { count: reaped.length })
        return reaped.length
    }

    wake(realmId: string | null): void {
        if (!realmId) return
        for (const waiter of [...this.waiters]) {
            if (waiter.realmId !== realmId) continue
            this.waiters.delete(waiter)
            waiter.resolve()
        }
    }

    private waitForWork(realmId: string, waitMs: number): Promise<boolean> {
        if (waitMs <= 0) return Promise.resolve(false)
        return new Promise<boolean>((resolve) => {
            const waiter: Waiter = { realmId, resolve: () => resolve(true) }
            this.waiters.add(waiter)
            setTimeout(() => {
                if (this.waiters.delete(waiter)) resolve(false)
            }, waitMs).unref?.()
        })
    }

    private async toJob(row: BuildRow): Promise<RealmJob> {
        const bundle = await this.bundles.findById(row.bundle_id)
        const resolution = bundle
            ? await this.bundleService.resolve(bundle)
            : { uploadIds: [], relations: [] }

        return {
            jobId: row.id,
            kind: 'asset_bundle:generate',
            payload: {
                projectId: row.project_id,
                bundleId: row.bundle_id,
                uploadIds: resolution.uploadIds,
                relations: resolution.relations,
                options: {
                    engine: bundle?.engine ?? 'phaser',
                    algorithm: bundle?.algorithm ?? 'max-rects',
                    downscale: bundle?.downscale ?? 100,
                    rotationEnabled: bundle?.rotation_enabled ?? false,
                },
            },
        }
    }
}
