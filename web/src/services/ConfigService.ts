import { apiFetch } from 'helpers/api'
import { ConfigSchema, ConfigSchemaDraft, ConfigVersion, GameConfig, GameConfigDraft } from 'types'

const base = (projectId: string) => `/api/projects/${encodeURIComponent(projectId)}`

class ConfigService {
    private static instance: ConfigService
    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) ConfigService.instance = new ConfigService()
        return ConfigService.instance
    }

    async listSchemas(projectId: string): Promise<ConfigSchema[]> {
        return apiFetch<ConfigSchema[]>(`${base(projectId)}/schemas`)
    }

    async saveSchema(projectId: string, draft: ConfigSchemaDraft, schemaId?: string): Promise<ConfigSchema> {
        const path = schemaId
            ? `${base(projectId)}/schemas/${encodeURIComponent(schemaId)}`
            : `${base(projectId)}/schemas`
        return apiFetch<ConfigSchema>(path, { method: schemaId ? 'PATCH' : 'POST', body: JSON.stringify(draft) })
    }

    async deleteSchema(projectId: string, schemaId: string): Promise<void> {
        await apiFetch<void>(`${base(projectId)}/schemas/${encodeURIComponent(schemaId)}`, { method: 'DELETE' })
    }

    async listConfigs(projectId: string): Promise<GameConfig[]> {
        return apiFetch<GameConfig[]>(`${base(projectId)}/configs`)
    }

    async createConfig(projectId: string, draft: GameConfigDraft): Promise<GameConfig> {
        return apiFetch<GameConfig>(`${base(projectId)}/configs`, { method: 'POST', body: JSON.stringify(draft) })
    }

    async deleteConfig(projectId: string, configId: string): Promise<void> {
        await apiFetch<void>(`${base(projectId)}/configs/${encodeURIComponent(configId)}`, { method: 'DELETE' })
    }

    async readVersion(projectId: string, configId: string, tag: string): Promise<ConfigVersion> {
        return apiFetch<ConfigVersion>(
            `${base(projectId)}/configs/${encodeURIComponent(configId)}/versions/${encodeURIComponent(tag)}`
        )
    }

    async saveVersion(
        projectId: string,
        configId: string,
        tag: string,
        values: Record<string, unknown>
    ): Promise<ConfigVersion> {
        return apiFetch<ConfigVersion>(
            `${base(projectId)}/configs/${encodeURIComponent(configId)}/versions/${encodeURIComponent(tag)}`,
            { method: 'PUT', body: JSON.stringify({ values }) }
        )
    }

    async refreshSchema(projectId: string, configId: string): Promise<GameConfig> {
        return apiFetch<GameConfig>(
            `${base(projectId)}/configs/${encodeURIComponent(configId)}/refresh-schema`,
            { method: 'POST' }
        )
    }
}

export default ConfigService
