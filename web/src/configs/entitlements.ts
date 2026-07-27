import { Permission } from 'types'

export type Entitlement = {
    feature: string
}

export const ENTITLEMENTS: Partial<Record<Permission, Entitlement>> = {
    'project.export': { feature: 'export' },
}

export const PROJECT_LIMIT_ENTITLEMENT: Entitlement = { feature: 'unlimitedProjects' }
