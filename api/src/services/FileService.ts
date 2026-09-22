import { inject, injectable } from 'tsyringe'
import { randomUUID } from 'node:crypto'
import type {
    AssetSource,
    AssetSourceDraft,
    AssetSourceRules,
    AssetType,
    AssetTypeBindings,
    StoredFile,
} from '../contracts/index.js'
import {
    ASSET_SOURCE_TYPES,
    ASSET_TYPES,
    extensionAllowed,
    extensionOf,
    mimeTypeAllowed,
    normalizeExtension,
    normalizeMimeType,
} from '../contracts/index.js'
import { ConflictError, NotFoundError, UnavailableError, ValidationError } from '../domain/errors.js'
import { getStoragePort } from '../domain/storage.js'
import { FileRepository } from '../repositories/files/FileRepository.js'
import { toAssetSource, toStoredFile } from '../schema/files.js'
import { SettingsService } from './SettingsService.js'

const bindingKey = (assetType: AssetType): string => `asset_type_source_${assetType}`

const RULE_MAX_ENTRIES = 40

const normalizeList = (values: readonly string[], normalize: (raw: string) => string): string[] =>
    [...new Set(values.map(normalize).filter(Boolean))].slice(0, RULE_MAX_ENTRIES)

const normalizeRules = (rules: Partial<AssetSourceRules> | undefined): AssetSourceRules => ({
    extensions: normalizeList(rules?.extensions ?? [], normalizeExtension),
    mimeTypes: normalizeList(rules?.mimeTypes ?? [], normalizeMimeType),
})

@injectable()
export class FileService {
    constructor(
        @inject(FileRepository) private files: FileRepository,
        @inject(SettingsService) private settings: SettingsService
    ) {}

    async listSources(): Promise<AssetSource[]> {
        return (await this.files.listSources()).map(toAssetSource)
    }

    async createSource(draft: AssetSourceDraft): Promise<AssetSource> {
        const name = draft.name?.trim() ?? ''
        if (!name) throw new ValidationError('asset_source_name_required', 'a name is required')
        if (!(ASSET_SOURCE_TYPES as readonly string[]).includes(draft.type)) {
            throw new ValidationError('asset_source_config_invalid', 'unknown source type')
        }

        const config = draft.config ?? {}
        if (draft.type === 's3' && !config.bucket?.trim()) {
            throw new ValidationError('asset_source_config_invalid', 'a bucket is required for s3 sources')
        }

        const rules = normalizeRules(draft.rules)
        const created = await this.files.insertSource({
            id: randomUUID(),
            name,
            type: draft.type,
            config,
            secret: draft.secret?.trim() ?? '',
            extensions: rules.extensions,
            mimeTypes: rules.mimeTypes,
        })
        if (!created) throw new NotFoundError('asset_source_not_found', 'file source not found')
        return toAssetSource(created)
    }

    async updateSource(id: string, patch: Partial<AssetSourceDraft>): Promise<AssetSource> {
        if (patch.name !== undefined && !patch.name.trim()) {
            throw new ValidationError('asset_source_name_required', 'a name is required')
        }
        if (patch.config?.bucket !== undefined && patch.config.bucket !== null && !patch.config.bucket.trim()) {
            throw new ValidationError('asset_source_config_invalid', 'a bucket is required for s3 sources')
        }

        const rules = patch.rules === undefined ? null : normalizeRules(patch.rules)
        const updated = await this.files.updateSource(id, {
            name: patch.name?.trim() ?? null,
            config: patch.config ?? null,
            secret: patch.secret?.trim() || null,
            extensions: rules?.extensions ?? null,
            mimeTypes: rules?.mimeTypes ?? null,
        })
        if (!updated) throw new NotFoundError('asset_source_not_found', 'file source not found', [id])
        return toAssetSource(updated)
    }

    async deleteSource(id: string): Promise<void> {
        const bindings = await this.getBindings()
        if (Object.values(bindings).includes(id)) {
            throw new ConflictError('asset_source_in_use', 'reassign every file type using this source first', [id])
        }

        const filesUsingSource = await this.files.countFilesForSource(id)
        if (filesUsingSource > 0) {
            throw new ConflictError('asset_source_in_use', 'files are already stored on this source', [id])
        }

        const removed = await this.files.deleteSource(id)
        if (!removed) throw new NotFoundError('asset_source_not_found', 'file source not found', [id])
    }

    async getBindings(): Promise<AssetTypeBindings> {
        const entries = await Promise.all(
            ASSET_TYPES.map(async (assetType) => {
                const raw = await this.settings.getRaw(bindingKey(assetType))
                return [assetType, raw ?? null] as const
            })
        )
        return Object.fromEntries(entries) as AssetTypeBindings
    }

    async saveBindings(patch: Partial<AssetTypeBindings>): Promise<AssetTypeBindings> {
        for (const assetType of ASSET_TYPES) {
            if (!(assetType in patch)) continue

            const sourceId = patch[assetType]
            if (sourceId) {
                const source = await this.files.findSource(sourceId)
                if (!source) throw new NotFoundError('asset_source_not_found', 'file source not found', [sourceId])
            }
            await this.settings.setRaw(bindingKey(assetType), sourceId ?? '')
        }
        return this.getBindings()
    }

    async upload(
        assetType: AssetType,
        ownerId: string | null,
        data: Buffer,
        meta: { originalName: string; mime: string }
    ): Promise<StoredFile> {
        if (!(ASSET_TYPES as readonly string[]).includes(assetType)) {
            throw new ValidationError('asset_type_invalid', 'unknown file type', [assetType])
        }

        const bindings = await this.getBindings()
        const sourceId = bindings[assetType]
        if (!sourceId) {
            throw new UnavailableError(
                'asset_type_unassigned',
                'no storage source is configured for this file type',
                [assetType]
            )
        }

        const source = await this.files.findSource(sourceId)
        if (!source) throw new NotFoundError('asset_source_not_found', 'file source not found', [sourceId])

        const rules = toAssetSource(source).rules
        if (!extensionAllowed(rules, meta.originalName)) {
            throw new ValidationError(
                'asset_extension_not_allowed',
                'this source does not accept that file extension',
                [extensionOf(meta.originalName) || '?', rules.extensions.join(' ')]
            )
        }
        if (!mimeTypeAllowed(rules, meta.mime)) {
            throw new ValidationError(
                'asset_mime_not_allowed',
                'this source does not accept that file type',
                [meta.mime || '?', rules.mimeTypes.join(' ')]
            )
        }

        const port = getStoragePort(source.type)
        if (!port) throw new UnavailableError('asset_type_unassigned', 'no storage backend for this source type')

        const id = randomUUID()
        const location = `${assetType}/${id}`
        await port.put(source, location, data)

        const created = await this.files.insertFile({
            id,
            assetType,
            sourceId: source.id,
            location,
            ownerId,
            originalName: meta.originalName.slice(0, 300),
            mime: meta.mime.slice(0, 200),
            size: data.length,
        })
        if (!created) throw new NotFoundError('asset_not_found', 'file not found')
        return toStoredFile(created)
    }

    async get(id: string): Promise<StoredFile> {
        const row = await this.files.findFile(id)
        if (!row) throw new NotFoundError('asset_not_found', 'file not found', [id])
        return toStoredFile(row)
    }

    async readBytes(file: StoredFile): Promise<Buffer> {
        const source = await this.files.findSource(file.sourceId)
        if (!source) throw new NotFoundError('asset_source_not_found', 'file source not found')

        const port = getStoragePort(source.type)
        if (!port) throw new UnavailableError('asset_type_unassigned', 'no storage backend for this source type')

        return port.get(source, file.location)
    }

    async remove(file: StoredFile): Promise<void> {
        const removed = await this.files.deleteFile(file.id)
        if (!removed) throw new NotFoundError('asset_not_found', 'file not found', [file.id])

        const source = await this.files.findSource(file.sourceId)
        if (!source) return

        const port = getStoragePort(source.type)
        if (port) void port.remove(source, file.location).catch(() => {})
    }
}
