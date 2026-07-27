import type { ProjectVisibility, TaskStatus } from '../contracts/index.js'

export type ProjectRow = {
    id: string
    owner_id: string
    name: string
    description: string
    visibility: ProjectVisibility
    icon: string
    color: string
    priority: number
    due_date: Date | null
    notify_on_activity: boolean
    task_count: string
    created_at: Date
    updated_at: Date
}

export type TaskRow = {
    id: string
    project_id: string
    owner_id: string
    title: string
    status: TaskStatus
    position: number
    created_at: Date
}
