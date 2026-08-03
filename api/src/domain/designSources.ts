import type { DesignSourceInfo, DesignSourceItem, User } from '../contracts/index.js'
import container from '../container.js'
import { ProjectService } from '../services/ProjectService.js'

export type DesignSource = DesignSourceInfo & {
    list: (user: User) => Promise<DesignSourceItem[]>
    resolve: (user: User, itemId: string) => Promise<Record<string, string>>
}

const projects = () => container.resolve(ProjectService)

const PROJECT_SOURCE: DesignSource = {
    id: 'project',
    label: 'Project',
    itemLabel: 'Pick a project',
    fields: [
        { key: 'name', label: 'Project name' },
        { key: 'description', label: 'Project description' },
        { key: 'appType', label: 'Project type' },
        { key: 'genre', label: 'Genre' },
        { key: 'memberCount', label: 'Member count' },
        { key: 'assetCount', label: 'Asset count' },
    ],
    async list(user) {
        const owned = await projects().list(user, false)
        return owned.map((project) => ({ id: project.id, label: project.name }))
    },
    async resolve(user, itemId): Promise<Record<string, string>> {
        const owned = await projects().list(user, false)
        const project = owned.find((entry) => entry.id === itemId)
        if (!project) return {}
        return {
            name: project.name,
            description: project.description,
            appType: project.appType,
            genre: project.genre,
            memberCount: String(project.memberCount),
            assetCount: String(project.assetCount),
        }
    },
}

export const DESIGN_SOURCES: DesignSource[] = [PROJECT_SOURCE]

export const designSource = (id: string): DesignSource | undefined =>
    DESIGN_SOURCES.find((source) => source.id === id)

export const designSourceCatalog = (): DesignSourceInfo[] =>
    DESIGN_SOURCES.map(({ id, label, itemLabel, fields }) => ({ id, label, itemLabel, fields }))
