import { inject, injectable } from 'tsyringe'
import { ok, err, type Result } from '@toolcase/base'
import type {
    Bundle,
    BundleDraft,
    BundlePreview,
    BundleResolution,
    BundleRule,
} from '../contracts/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { BundleRepository } from '../repositories/bundles/BundleRepository.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { toBundle } from '../schema/bundles.js'
import { toAssetFile } from '../schema/assets.js'
import type { BundleRow } from '../schema/bundles.js'
import type { ProjectRow } from '../schema/projects.js'

export type BundleConflict = 'exists'

@injectable()
export class BundleService {
    constructor(
        @inject(BundleRepository) private bundles: BundleRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService
    ) {}

    async list(projectId: string): Promise<Bundle[]> {
        return (await this.bundles.listByProject(projectId)).map(toBundle)
    }

    async find(projectId: string, bundleId: string): Promise<BundleRow> {
        const row = await this.bundles.findById(bundleId)
        if (!row || row.project_id !== projectId) {
            throw new NotFoundError('bundle_not_found', `unknown bundle ${bundleId}`, [bundleId])
        }
        return row
    }

    async create(project: ProjectRow, draft: BundleDraft): Promise<Result<Bundle, BundleConflict>> {
        const name = draft.name?.trim() ?? ''
        if (!name) throw new ValidationError('bundle_name_required', 'a bundle needs a name')

        await this.assertKnownTags(project.id, draft)
        await this.access.assertWithinProjectLimit(
            { id: project.id, ownerId: project.owner_id },
            'bundles_per_project'
        )

        const created = await this.bundles.create(project.id, this.toWrite(name, draft))
        if (created.isErr()) return err('exists')
        return ok(toBundle(created.unwrap()))
    }

    async update(
        project: ProjectRow,
        bundleId: string,
        draft: Partial<BundleDraft>
    ): Promise<Result<Bundle, BundleConflict>> {
        const existing = await this.find(project.id, bundleId)
        await this.assertKnownTags(project.id, draft)

        const merged = {
            name: draft.name?.trim() || existing.name,
            engine: draft.engine ?? existing.engine,
            categoryId: draft.categoryId === undefined ? existing.category_id : draft.categoryId,
            includedTags: draft.includedTags ?? existing.included_tags,
            excludedTags: draft.excludedTags ?? existing.excluded_tags,
            buildTag: draft.buildTag ?? existing.build_tag,
            algorithm: draft.algorithm ?? existing.algorithm,
            downscale: draft.downscale ?? existing.downscale,
            rotationEnabled: draft.rotationEnabled ?? existing.rotation_enabled,
        }

        const updated = await this.bundles.updateBundle(bundleId, project.id, merged)
        if (updated.isErr()) return err('exists')
        const row = updated.unwrap()
        if (!row) throw new NotFoundError('bundle_not_found', `unknown bundle ${bundleId}`, [bundleId])
        return ok(toBundle(row))
    }

    async remove(project: ProjectRow, bundleId: string): Promise<void> {
        await this.find(project.id, bundleId)
        const deleted = await this.bundles.softDeleteCascade(bundleId, project.id)
        if (!deleted) throw new NotFoundError('bundle_not_found', `unknown bundle ${bundleId}`, [bundleId])
    }

    async preview(projectId: string, rule: BundleRule): Promise<BundlePreview> {
        const [counts, files] = await Promise.all([
            this.bundles.previewCount(projectId, rule),
            this.bundles.previewFiles(projectId, rule),
        ])
        return { count: counts.count, totalBytes: counts.totalBytes, files: files.map(toAssetFile) }
    }

    async resolve(bundle: BundleRow): Promise<BundleResolution> {
        const rows = await this.bundles.resolveAssets(bundle.project_id, {
            categoryId: bundle.category_id,
            includedTags: bundle.included_tags,
            excludedTags: bundle.excluded_tags,
        })

        const byId = new Map(rows.map((row) => [row.id, row]))
        const relations = rows
            .filter((row) => row.parent_asset_id && byId.has(row.parent_asset_id))
            .map((row) => ({
                parentUploadId: byId.get(row.parent_asset_id!)!.upload_uuid,
                childUploadId: row.upload_uuid,
                kind: row.kind,
            }))

        return { uploadIds: rows.map((row) => row.upload_uuid), relations }
    }

    private toWrite(name: string, draft: Partial<BundleDraft>) {
        return {
            name,
            engine: draft.engine ?? 'phaser',
            categoryId: draft.categoryId ?? null,
            includedTags: draft.includedTags ?? [],
            excludedTags: draft.excludedTags ?? [],
            buildTag: draft.buildTag ?? '',
            algorithm: draft.algorithm ?? 'max-rects',
            downscale: draft.downscale ?? 100,
            rotationEnabled: draft.rotationEnabled ?? false,
        }
    }

    private async assertKnownTags(projectId: string, draft: Partial<BundleDraft>): Promise<void> {
        const names = [...(draft.includedTags ?? []), ...(draft.excludedTags ?? [])]
        if (names.length > 0) {
            const tags = await this.projects.listNames('tags', projectId)
            const known = new Set(tags.map((row) => row.name.toLowerCase()))
            for (const name of names) {
                if (!known.has(name.toLowerCase())) {
                    throw new ValidationError('unknown_tag', 'that tag is not in this project', [name])
                }
            }
        }

        if (draft.buildTag) {
            const buildTags = await this.projects.listNames('buildTags', projectId)
            const known = new Set(buildTags.map((row) => row.name.toLowerCase()))
            if (!known.has(draft.buildTag.toLowerCase())) {
                throw new ValidationError('unknown_build_tag', 'that build tag is not in this project', [draft.buildTag])
            }
        }

        if (draft.categoryId) {
            const categories = await this.projects.listNames('categories', projectId)
            if (!categories.some((row) => row.id === draft.categoryId)) {
                throw new ConflictError('unknown_category', 'that category is not in this project', [draft.categoryId])
            }
        }
    }
}
