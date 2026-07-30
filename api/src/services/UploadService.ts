import { inject, injectable } from 'tsyringe'
import type {
    AssetFile,
    AssetPatch,
    FinalizeUpload,
    UploadRequest,
    UploadTicket,
    User,
} from '../contracts/index.js'
import { UPLOAD_TOKEN_SECONDS } from '../contracts/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { extensionOf, isAllowedMime, resolveKind } from '../domain/assets.js'
import { AssetFileRepository } from '../repositories/assets/AssetFileRepository.js'
import { ProjectRepository } from '../repositories/projects/ProjectRepository.js'
import { RealmRepository } from '../repositories/realms/RealmRepository.js'
import { AccessPolicyService } from './AccessPolicyService.js'
import { SigningKeyService } from './SigningKeyService.js'
import { toAssetFile } from '../schema/assets.js'
import type { ProjectRow } from '../schema/projects.js'
import type { RealmRow } from '../schema/realms.js'

@injectable()
export class UploadService {
    constructor(
        @inject(AssetFileRepository) private assets: AssetFileRepository,
        @inject(ProjectRepository) private projects: ProjectRepository,
        @inject(RealmRepository) private realms: RealmRepository,
        @inject(AccessPolicyService) private access: AccessPolicyService,
        @inject(SigningKeyService) private signing: SigningKeyService
    ) {}

    async requestUpload(user: User, project: ProjectRow, request: UploadRequest): Promise<UploadTicket> {
        const mime = request.mime.trim().toLowerCase()
        if (!isAllowedMime(mime)) {
            throw new ValidationError('asset_type_unsupported', `${mime} is not an accepted type`, [mime])
        }

        let parent = null
        if (request.parentAssetId) {
            parent = await this.assets.findById(request.parentAssetId)
            if (!parent || parent.project_id !== project.id) {
                throw new NotFoundError('parent_asset_not_found', 'the parent file is gone', [request.parentAssetId])
            }
        }

        const batchBytes = Math.max(request.sizeBytes, request.batchBytes ?? 0)
        await this.access.assertStorageHeadroom(project.owner_id, batchBytes)

        const realm = project.realm_id ? await this.realms.findById(project.realm_id) : undefined
        if (!realm) {
            throw new ConflictError('realm_unavailable', 'this project has no realm to upload to')
        }

        const created = await this.assets.create({
            projectId: project.id,
            uploadedBy: user.id,
            parentAssetId: parent?.id ?? null,
            kind: resolveKind(mime, request.kind, Boolean(parent)),
            categoryId: request.categoryId ?? (project.default_category_id || null),
            name: request.name.trim(),
            extension: extensionOf(request.name),
            mime,
            sizeBytes: Math.max(0, Math.floor(request.sizeBytes)),
        })
        if (created.isErr()) {
            throw new ConflictError('normal_map_exists', 'that texture already has a normal map')
        }

        const asset = created.unwrap()
        const signed = await this.signing.sign('realm_upload', {
            sub: asset.id,
            projectId: project.id,
            maxBytes: Math.max(0, Math.floor(request.sizeBytes)),
            mime,
        }, { expiresInSeconds: UPLOAD_TOKEN_SECONDS })

        return {
            token: signed.token,
            uploadUrl: `${realm.base_url}/uploads/${asset.id}`,
            expiresAt: signed.expiresAt,
        }
    }

    async finalize(realm: RealmRow, assetId: string, body: FinalizeUpload): Promise<AssetFile> {
        const asset = await this.assets.findById(assetId)
        if (!asset) throw new NotFoundError('asset_not_found', `unknown asset ${assetId}`, [assetId])

        const project = await this.projects.findById(asset.project_id)
        if (!project || project.realm_id !== realm.id) {
            throw new NotFoundError('asset_not_found', 'that asset does not belong to this realm', [assetId])
        }

        if (asset.upload_status === 'ready' || asset.upload_status === 'failed') {
            if (asset.checksum === body.checksum && asset.storage_path === body.storagePath) {
                return toAssetFile(asset)
            }
            throw new ConflictError('upload_not_pending', 'that upload has already finished', [assetId])
        }

        const finalized = await this.assets.finalize(assetId, {
            status: body.status,
            sizeBytes: body.sizeBytes,
            checksum: body.checksum,
            storagePath: body.storagePath,
        })

        if (body.status === 'ready') {
            const status = await this.access.storageStatus(project.owner_id)
            void this.access.syncOverageFlag(project.owner_id, status)
        }

        return toAssetFile(finalized!)
    }

    async patchMany(project: ProjectRow, patches: AssetPatch[]): Promise<AssetFile[]> {
        const [categories, tags] = await Promise.all([
            this.projects.listNames('categories', project.id),
            this.projects.listNames('tags', project.id),
        ])
        const categoryIds = new Set(categories.map((row) => row.id))
        const tagNames = new Set(tags.map((row) => row.name.toLowerCase()))

        for (const patch of patches) {
            if (patch.categoryId && !categoryIds.has(patch.categoryId)) {
                throw new ValidationError('unknown_category', 'that category is not in this project', [patch.categoryId])
            }
            for (const tag of patch.tags ?? []) {
                if (!tagNames.has(tag.toLowerCase())) {
                    throw new ValidationError('unknown_tag', 'that tag is not in this project', [tag])
                }
            }
            if (patch.parentAssetId) {
                if (patch.parentAssetId === patch.id) {
                    throw new ValidationError('invalid_parent', 'an asset cannot be its own parent', [patch.id])
                }
                const parent = await this.assets.findById(patch.parentAssetId)
                if (!parent || parent.project_id !== project.id) {
                    throw new ValidationError('invalid_parent', 'that parent is not in this project', [
                        patch.parentAssetId,
                    ])
                }
            }
        }

        await this.assets.patchMany(project.id, patches)
        return this.list(project.id)
    }

    async list(projectId: string, query: { categoryId?: string; tag?: string } = {}): Promise<AssetFile[]> {
        const rows = await this.assets.listByProject(projectId, query)
        return rows.map(toAssetFile)
    }

    async remove(project: ProjectRow, assetId: string): Promise<string | null> {
        const asset = await this.assets.findById(assetId)
        if (!asset || asset.project_id !== project.id) {
            throw new NotFoundError('asset_not_found', `unknown asset ${assetId}`, [assetId])
        }
        await this.assets.softDelete(assetId, project.id)
        return asset.storage_path || null
    }

    async reapOrphans(limit = 200): Promise<number> {
        const reaped = await this.assets.reapOrphans(limit)
        return reaped.length
    }
}
