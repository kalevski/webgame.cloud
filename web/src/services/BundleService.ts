import { apiFetch } from 'helpers/api'
import { Bundle, BundleDraft, BundlePreview, BundleRule } from 'types'

const base = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}/bundles`

class BundleService {
    private static instance: BundleService
    private constructor() {}

    static getInstance(): BundleService {
        if (!BundleService.instance) BundleService.instance = new BundleService()
        return BundleService.instance
    }

    async list(projectId: string): Promise<Bundle[]> {
        return apiFetch<Bundle[]>(base(projectId))
    }

    async preview(projectId: string, rule: BundleRule): Promise<BundlePreview> {
        return apiFetch<BundlePreview>(`${base(projectId)}/preview`, {
            method: 'POST',
            body: JSON.stringify(rule),
        })
    }

    async create(projectId: string, draft: BundleDraft): Promise<Bundle> {
        return apiFetch<Bundle>(base(projectId), { method: 'POST', body: JSON.stringify(draft) })
    }

    async update(projectId: string, bundleId: string, draft: Partial<BundleDraft>): Promise<Bundle> {
        return apiFetch<Bundle>(`${base(projectId)}/${encodeURIComponent(bundleId)}`, {
            method: 'PATCH',
            body: JSON.stringify(draft),
        })
    }

    async remove(projectId: string, bundleId: string): Promise<void> {
        await apiFetch<void>(`${base(projectId)}/${encodeURIComponent(bundleId)}`, { method: 'DELETE' })
    }
}

export default BundleService
