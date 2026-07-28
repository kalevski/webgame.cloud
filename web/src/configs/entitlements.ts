import { Permission } from 'types'

export type Entitlement = {
    feature: string
}

export const ENTITLEMENTS: Partial<Record<Permission, Entitlement>> = {}

export const PROJECT_LIMIT_ENTITLEMENT: Entitlement = { feature: 'unlimitedProjects' }

export const STORAGE_LIMIT_ENTITLEMENT: Entitlement = { feature: 'moreStorage' }
