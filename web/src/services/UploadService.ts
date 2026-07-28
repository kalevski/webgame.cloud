import AssetService from 'services/AssetService'
import { AssetKind, UploadTicket } from 'types'

export type UploadProgress = {
    file: File
    loaded: number
    total: number
}

const decodeAssetId = (token: string): string => {
    const [, payload] = token.split('.')
    if (!payload) return ''
    try {
        const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string }
        return claims.sub ?? ''
    } catch {
        return ''
    }
}

const transfer = (ticket: UploadTicket, file: File, onProgress: (loaded: number) => void): Promise<void> =>
    new Promise((resolve, reject) => {
        const request = new XMLHttpRequest()
        request.open('PUT', ticket.uploadUrl)
        request.setRequestHeader('authorization', `Bearer ${ticket.token}`)
        request.upload.addEventListener('progress', (event) => onProgress(event.loaded))
        request.addEventListener('load', () =>
            request.status >= 200 && request.status < 300
                ? resolve()
                : reject(new Error(`upload failed with ${request.status}`)))
        request.addEventListener('error', () => reject(new Error('upload failed')))
        request.send(file)
    })

class UploadService {
    private static instance: UploadService
    private constructor() {}

    static getInstance(): UploadService {
        if (!UploadService.instance) UploadService.instance = new UploadService()
        return UploadService.instance
    }

    async upload(
        projectId: string,
        file: File,
        options: {
            batchBytes?: number
            categoryId?: string
            kind?: AssetKind
            parentAssetId?: string
            onProgress?: (loaded: number, total: number) => void
        } = {}
    ): Promise<string> {
        const ticket = await AssetService.getInstance().requestUpload(projectId, {
            name: file.name,
            sizeBytes: file.size,
            mime: file.type || 'application/octet-stream',
            batchBytes: options.batchBytes,
            categoryId: options.categoryId,
            kind: options.kind,
            parentAssetId: options.parentAssetId,
        })

        await transfer(ticket, file, (loaded) => options.onProgress?.(loaded, file.size))
        return decodeAssetId(ticket.token)
    }
}

export default UploadService
