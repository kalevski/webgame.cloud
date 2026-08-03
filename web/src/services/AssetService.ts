import { apiFetch } from 'helpers/api'
import { AssetFile, AssetPatch, AssetSourceTicket, UploadRequest, UploadTicket } from 'types'

const base = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}`

class AssetService {
    private static instance: AssetService
    private constructor() {}

    static getInstance(): AssetService {
        if (!AssetService.instance) AssetService.instance = new AssetService()
        return AssetService.instance
    }

    async list(projectId: string): Promise<AssetFile[]> {
        return apiFetch<AssetFile[]>(`${base(projectId)}/assets`)
    }

    async requestUpload(projectId: string, request: UploadRequest): Promise<UploadTicket> {
        return apiFetch<UploadTicket>(`${base(projectId)}/uploads`, {
            method: 'POST',
            body: JSON.stringify(request),
        })
    }

    async source(projectId: string, assetId: string): Promise<AssetSourceTicket> {
        return apiFetch<AssetSourceTicket>(
            `${base(projectId)}/assets/${encodeURIComponent(assetId)}/source`
        )
    }

    async patchMany(projectId: string, files: AssetPatch[]): Promise<AssetFile[]> {
        return apiFetch<AssetFile[]>(`${base(projectId)}/assets`, {
            method: 'PUT',
            body: JSON.stringify({ files }),
        })
    }

    async remove(projectId: string, assetId: string): Promise<void> {
        await apiFetch<void>(`${base(projectId)}/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE' })
    }
}

export default AssetService
