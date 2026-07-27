import { inject, injectable } from 'tsyringe'
import { randomUUID } from 'node:crypto'
import type { FileSource, FileSourceDraft, FileType, FileTypeBindings, StoredFile } from '../contracts/index.js'
import { FILE_SOURCE_TYPES, FILE_TYPES } from '../contracts/index.js'
import { ConflictError, NotFoundError, UnavailableError, ValidationError } from '../domain/errors.js'
import { getStoragePort } from '../domain/storage.js'
import { FileRepository } from '../repositories/files/FileRepository.js'
import { toFileSource, toStoredFile } from '../schema/files.js'
import { SettingsService } from './SettingsService.js'

const bindingKey = (fileType: FileType): string => `file_type_source_${fileType}`

@injectable()
export class FileService {
    constructor(
        @inject(FileRepository) private files: FileRepository,
        @inject(SettingsService) private settings: SettingsService
    ) {}

    async listSources(): Promise<FileSource[]> {
        return (await this.files.listSources()).map(toFileSource)
    }

    async createSource(draft: FileSourceDraft): Promise<FileSource> {
        const name = draft.name?.trim() ?? ''
        if (!name) throw new ValidationError('file_source_name_required', 'a name is required')
        if (!(FILE_SOURCE_TYPES as readonly string[]).includes(draft.type)) {
            throw new ValidationError('file_source_config_invalid', 'unknown source type')
        }

        const config = draft.config ?? {}
        if (draft.type === 's3' && !config.bucket?.trim()) {
            throw new ValidationError('file_source_config_invalid', 'a bucket is required for s3 sources')
        }

        const created = await this.files.insertSource({
            id: randomUUID(),
            name,
            type: draft.type,
            config,
            secret: draft.secret?.trim() ?? '',
        })
        if (!created) throw new NotFoundError('file_source_not_found', 'file source not found')
        return toFileSource(created)
    }

    async updateSource(id: string, patch: Partial<FileSourceDraft>): Promise<FileSource> {
        if (patch.name !== undefined && !patch.name.trim()) {
            throw new ValidationError('file_source_name_required', 'a name is required')
        }
        if (patch.config?.bucket !== undefined && patch.config.bucket !== null && !patch.config.bucket.trim()) {
            throw new ValidationError('file_source_config_invalid', 'a bucket is required for s3 sources')
        }

        const updated = await this.files.updateSource(id, {
            name: patch.name?.trim() ?? null,
            config: patch.config ?? null,
            secret: patch.secret?.trim() || null,
        })
        if (!updated) throw new NotFoundError('file_source_not_found', 'file source not found', [id])
        return toFileSource(updated)
    }

    async deleteSource(id: string): Promise<void> {
        const bindings = await this.getBindings()
        if (Object.values(bindings).includes(id)) {
            throw new ConflictError('file_source_in_use', 'reassign every file type using this source first', [id])
        }

        const filesUsingSource = await this.files.countFilesForSource(id)
        if (filesUsingSource > 0) {
            throw new ConflictError('file_source_in_use', 'files are already stored on this source', [id])
        }

        const removed = await this.files.deleteSource(id)
        if (!removed) throw new NotFoundError('file_source_not_found', 'file source not found', [id])
    }

    async getBindings(): Promise<FileTypeBindings> {
        const entries = await Promise.all(
            FILE_TYPES.map(async (fileType) => {
                const raw = await this.settings.getRaw(bindingKey(fileType))
                return [fileType, raw ?? null] as const
            })
        )
        return Object.fromEntries(entries) as FileTypeBindings
    }

    async saveBindings(patch: Partial<FileTypeBindings>): Promise<FileTypeBindings> {
        for (const fileType of FILE_TYPES) {
            if (!(fileType in patch)) continue

            const sourceId = patch[fileType]
            if (sourceId) {
                const source = await this.files.findSource(sourceId)
                if (!source) throw new NotFoundError('file_source_not_found', 'file source not found', [sourceId])
            }
            await this.settings.setRaw(bindingKey(fileType), sourceId ?? '')
        }
        return this.getBindings()
    }

    async upload(
        fileType: FileType,
        ownerId: string | null,
        data: Buffer,
        meta: { originalName: string; mime: string }
    ): Promise<StoredFile> {
        if (!(FILE_TYPES as readonly string[]).includes(fileType)) {
            throw new ValidationError('file_type_invalid', 'unknown file type', [fileType])
        }

        const bindings = await this.getBindings()
        const sourceId = bindings[fileType]
        if (!sourceId) {
            throw new UnavailableError(
                'file_type_unassigned',
                'no storage source is configured for this file type',
                [fileType]
            )
        }

        const source = await this.files.findSource(sourceId)
        if (!source) throw new NotFoundError('file_source_not_found', 'file source not found', [sourceId])

        const port = getStoragePort(source.type)
        if (!port) throw new UnavailableError('file_type_unassigned', 'no storage backend for this source type')

        const id = randomUUID()
        const location = `${fileType}/${id}`
        await port.put(source, location, data)

        const created = await this.files.insertFile({
            id,
            fileType,
            sourceId: source.id,
            location,
            ownerId,
            originalName: meta.originalName.slice(0, 300),
            mime: meta.mime.slice(0, 200),
            size: data.length,
        })
        if (!created) throw new NotFoundError('file_not_found', 'file not found')
        return toStoredFile(created)
    }

    async get(id: string): Promise<StoredFile> {
        const row = await this.files.findFile(id)
        if (!row) throw new NotFoundError('file_not_found', 'file not found', [id])
        return toStoredFile(row)
    }

    async readBytes(file: StoredFile): Promise<Buffer> {
        const source = await this.files.findSource(file.sourceId)
        if (!source) throw new NotFoundError('file_source_not_found', 'file source not found')

        const port = getStoragePort(source.type)
        if (!port) throw new UnavailableError('file_type_unassigned', 'no storage backend for this source type')

        return port.get(source, file.location)
    }

    async remove(file: StoredFile): Promise<void> {
        const removed = await this.files.deleteFile(file.id)
        if (!removed) throw new NotFoundError('file_not_found', 'file not found', [file.id])

        const source = await this.files.findSource(file.sourceId)
        if (!source) return

        const port = getStoragePort(source.type)
        if (port) void port.remove(source, file.location).catch(() => {})
    }
}
