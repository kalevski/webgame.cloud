import { StateCreator } from 'zustand'
import ConfigService from 'services/ConfigService'
import { STRINGS } from 'configs/strings'
import { ConfigSchema, ConfigSchemaDraft, ConfigVersion, GameConfig, GameConfigDraft } from 'types'
import type { AppStore } from './index'

export type ConfigsSlice = {
    schemas: ConfigSchema[]
    configs: GameConfig[]
    configsLoaded: boolean
    activeVersion: ConfigVersion | null

    fetchSchemas: (projectId: string) => Promise<void>
    saveSchema: (projectId: string, draft: ConfigSchemaDraft, schemaId?: string) => Promise<boolean>
    createSchema: (projectId: string) => Promise<string | null>
    deleteSchema: (projectId: string, schemaId: string) => Promise<boolean>

    fetchConfigs: (projectId: string) => Promise<void>
    createConfig: (projectId: string, draft: GameConfigDraft) => Promise<boolean>
    deleteConfig: (projectId: string, configId: string) => Promise<boolean>

    fetchVersion: (projectId: string, configId: string, tag: string) => Promise<void>
    saveVersion: (
        projectId: string,
        configId: string,
        tag: string,
        values: Record<string, unknown>
    ) => Promise<boolean>
    refreshSchema: (projectId: string, configId: string) => Promise<boolean>
}

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createConfigsSlice: StateCreator<AppStore, [], [], ConfigsSlice> = (set, get) => ({
    schemas: [],
    configs: [],
    configsLoaded: false,
    activeVersion: null,

    async fetchSchemas(projectId) {
        try {
            set({ schemas: await ConfigService.getInstance().listSchemas(projectId) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createSchema(projectId) {
        try {
            const existing = new Set(get().schemas.map((schema) => schema.name))
            let index = existing.size + 1
            while (existing.has(STRINGS.configs.generatedSchemaName(index))) index += 1
            const created = await ConfigService.getInstance().saveSchema(projectId, {
                name: STRINGS.configs.generatedSchemaName(index),
                definition: [],
            })
            await get().fetchSchemas(projectId)
            return created?.id ?? null
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return null
        }
    },

    async saveSchema(projectId, draft, schemaId) {
        try {
            await ConfigService.getInstance().saveSchema(projectId, draft, schemaId)
            await get().fetchSchemas(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async deleteSchema(projectId, schemaId) {
        try {
            await ConfigService.getInstance().deleteSchema(projectId, schemaId)
            await get().fetchSchemas(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async fetchConfigs(projectId) {
        try {
            set({ configs: await ConfigService.getInstance().listConfigs(projectId), configsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async createConfig(projectId, draft) {
        try {
            await ConfigService.getInstance().createConfig(projectId, draft)
            await get().fetchConfigs(projectId)
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async deleteConfig(projectId, configId) {
        try {
            await ConfigService.getInstance().deleteConfig(projectId, configId)
            await get().fetchConfigs(projectId)
            void get().fetchProjectUsage(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async fetchVersion(projectId, configId, tag) {
        try {
            set({ activeVersion: await ConfigService.getInstance().readVersion(projectId, configId, tag) })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async saveVersion(projectId, configId, tag, values) {
        try {
            set({ activeVersion: await ConfigService.getInstance().saveVersion(projectId, configId, tag, values) })
            await get().fetchConfigs(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },

    async refreshSchema(projectId, configId) {
        try {
            await ConfigService.getInstance().refreshSchema(projectId, configId)
            await get().fetchConfigs(projectId)
            return true
        } catch (error) {
            fail(get, error, STRINGS.common.saveFailed)
            return false
        }
    },
})
