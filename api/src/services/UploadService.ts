import { inject, injectable } from 'tsyringe'
import type {
    AssetFile,
    AssetKind,
    AssetPatch,
    AssetSourceTicket,
    FinalizeUpload,
    UploadRequest,
    UploadTicket,
    User,
} from '../contracts/index.js'
import { PARENTED_KINDS, TOOL_ONLY_KINDS, UPLOAD_TOKEN_SECONDS } from '../contracts/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../domain/errors.js'
import { childKindsOf, extensionOf, inferKind, isAllowedMime } from '../domain/assets.js'
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

        const batchBytes = Math.max(request.sizeBytes, request.batchBytes ?? 0)
        await this.access.assertStorageHeadroom(project.owner_id, batchBytes)

        const realm = project.realm_id ? await this.realms.findById(project.realm_id) : undefined
        if (!realm) {
            throw new ConflictError('realm_unavailable', 'this project has no realm to upload to')
        }

        const kind = await this.resolveKind(project, request, mime)

        const tags = await this.resolveTags(project.id, request.tags ?? [])

        const created = await this.assets.create({
            projectId: project.id,
            uploadedBy: user.id,
            parentAssetId: request.parentAssetId ?? null,
            kind,
            categoryId: request.categoryId ?? (project.default_category_id || null),
            name: request.name.trim(),
            extension: extensionOf(request.name),
            mime,
            sizeBytes: Math.max(0, Math.floor(request.sizeBytes)),
            tags,
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

    private async resolveKind(
        project: ProjectRow,
        request: UploadRequest,
        mime: string
    ): Promise<AssetKind> {
        if (!request.kind) {
            if (request.parentAssetId) {
                throw new ValidationError('invalid_parent', 'only tool assets can declare a parent at upload', [
                    request.parentAssetId,
                ])
            }
            return inferKind(mime)
        }

        if (!TOOL_ONLY_KINDS.includes(request.kind)) {
            throw new ValidationError('asset_type_unsupported', `${request.kind} cannot be requested explicitly`, [
                request.kind,
            ])
        }

        if (!request.parentAssetId) {
            if (PARENTED_KINDS.includes(request.kind)) {
                throw new ValidationError('parent_asset_required', `a ${request.kind} needs a parent asset`)
            }
            return request.kind
        }

        const parent = await this.assets.findById(request.parentAssetId)
        if (!parent || parent.project_id !== project.id) {
            throw new ValidationError('parent_asset_not_found', 'that parent is not in this project', [
                request.parentAssetId,
            ])
        }
        if (parent.upload_status !== 'ready') {
            throw new ValidationError('asset_not_ready', 'that parent has not finished uploading', [
                request.parentAssetId,
            ])
        }
        if (!childKindsOf(parent.kind).includes(request.kind)) {
            throw new ValidationError('invalid_parent', `${request.kind} cannot be a child of ${parent.kind}`, [
                request.parentAssetId,
            ])
        }
        return request.kind
    }

    private async resolveTags(projectId: string, requested: string[]): Promise<string[]> {
        if (requested.length === 0) return []

        const known = new Map(
            (await this.projects.listNames('tags', projectId)).map((row) => [row.name.toLowerCase(), row.name])
        )

        const resolved: string[] = []
        for (const tag of requested) {
            const name = known.get(tag.trim().toLowerCase())
            if (!name) throw new ValidationError('unknown_tag', 'that tag is not in this project', [tag])
            if (!resolved.includes(name)) resolved.push(name)
        }
        return resolved
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
                const child = await this.assets.findById(patch.id)
                if (!child || !childKindsOf(parent.kind).includes(child.kind)) {
                    throw new ValidationError('invalid_parent', 'that file cannot be a child of that parent', [
                        patch.parentAssetId,
                    ])
                }
            }
        }

        await this.assets.patchMany(project.id, patches)
        return this.list(project.id)
    }

    async sourceTicket(project: ProjectRow, assetId: string): Promise<AssetSourceTicket> {
        const asset = await this.assets.findById(assetId)
        if (!asset || asset.project_id !== project.id) {
            throw new NotFoundError('asset_not_found', `unknown asset ${assetId}`, [assetId])
        }
        if (asset.upload_status !== 'ready' || !asset.storage_path) {
            throw new ConflictError('asset_not_ready', 'that asset has not finished uploading', [assetId])
        }

        const realm = project.realm_id ? await this.realms.findById(project.realm_id) : undefined
        if (!realm) {
            throw new ConflictError('realm_unavailable', 'this project has no realm to serve from')
        }

        const signed = await this.signing.sign('realm_download', {
            sub: asset.id,
            projectId: project.id,
            storagePath: asset.storage_path,
            mime: asset.mime,
        }, { expiresInSeconds: UPLOAD_TOKEN_SECONDS })

        return {
            url: `${realm.base_url}/files/${asset.id}?token=${encodeURIComponent(signed.token)}`,
            mime: asset.mime,
            kind: asset.kind,
            expiresAt: signed.expiresAt,
        }
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
