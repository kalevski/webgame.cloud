import type { Permission } from './permissions.js'

export const PROJECT_PERMISSIONS = [
    'member.manage',
    'project.settings',
    'file.write',
    'bundle.write',
    'build.run',
    'config.write',
] as const

export type ProjectPermission = typeof PROJECT_PERMISSIONS[number]

type NoOverlap = ProjectPermission & Permission extends never ? true : never

export const PLANES_ARE_DISJOINT: NoOverlap = true

export const PROJECT_PERMISSION_LABELS: Record<ProjectPermission, string> = {
    'member.manage': 'Manage members',
    'project.settings': 'Project settings',
    'file.write': 'Manage assets',
    'bundle.write': 'Manage bundles',
    'build.run': 'Run builds',
    'config.write': 'Manage configs',
}

export const PROJECT_PERMISSION_HINTS: Record<ProjectPermission, string> = {
    'member.manage': 'Invite teammates, change what they can do, remove them.',
    'project.settings': 'Rename the project and edit its categories and tags.',
    'file.write': 'Upload, rename, re-tag and delete asset files.',
    'bundle.write': 'Create, edit and delete bundles.',
    'build.run': 'Trigger builds, move build tags, delete and purge builds.',
    'config.write': 'Create schemas and configs, and edit their values.',
}
