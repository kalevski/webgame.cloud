export type ProjectVisibility = 'private' | 'shared'

export type Project = {
    id: string

    ownerId: string
    name: string
    description: string
    visibility: ProjectVisibility

    icon: string

    color: string

    priority: number

    dueDate: string | null

    notifyOnActivity: boolean

    taskCount: number
    createdAt: string
    updatedAt: string
}

export type ProjectDraft = {
    name: string
    description?: string
    visibility?: ProjectVisibility
    icon?: string
    color?: string
    priority?: number
    dueDate?: string | null
    notifyOnActivity?: boolean
}

export type TaskStatus = 'planned' | 'in-progress' | 'shipped'

export type Task = {
    id: string
    projectId: string

    ownerId: string
    title: string
    status: TaskStatus

    position: number
    createdAt: string
}

export type TaskDraft = {
    title: string
    status?: TaskStatus
}
