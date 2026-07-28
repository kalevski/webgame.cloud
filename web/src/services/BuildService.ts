import { apiFetch } from 'helpers/api'
import { Build, BuildDetail, BuildFilters } from 'types'

const base = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}`

class BuildService {
    private static instance: BuildService
    private constructor() {}

    static getInstance(): BuildService {
        if (!BuildService.instance) BuildService.instance = new BuildService()
        return BuildService.instance
    }

    async list(projectId: string, filters: BuildFilters = {}): Promise<Build[]> {
        const query = new URLSearchParams()
        if (filters.status) query.set('status', filters.status)
        if (filters.bundleId) query.set('bundleId', filters.bundleId)
        if (filters.cursor) query.set('cursor', filters.cursor)
        const suffix = query.toString() ? `?${query.toString()}` : ''
        return apiFetch<Build[]>(`${base(projectId)}/builds${suffix}`)
    }

    async detail(projectId: string, buildId: string): Promise<BuildDetail> {
        return apiFetch<BuildDetail>(`${base(projectId)}/builds/${encodeURIComponent(buildId)}`)
    }

    async run(projectId: string, bundleId: string): Promise<Build> {
        return apiFetch<Build>(`${base(projectId)}/bundles/${encodeURIComponent(bundleId)}/builds`, {
            method: 'POST',
        })
    }

    async setTag(projectId: string, buildId: string, buildTag: string): Promise<Build> {
        return apiFetch<Build>(`${base(projectId)}/builds/${encodeURIComponent(buildId)}/tag`, {
            method: 'PUT',
            body: JSON.stringify({ buildTag }),
        })
    }

    async remove(projectId: string, buildId: string): Promise<void> {
        await apiFetch<void>(`${base(projectId)}/builds/${encodeURIComponent(buildId)}`, { method: 'DELETE' })
    }

    async purge(projectId: string): Promise<{ purged: number }> {
        return apiFetch<{ purged: number }>(`${base(projectId)}/builds`, { method: 'DELETE' })
    }
}

export default BuildService
