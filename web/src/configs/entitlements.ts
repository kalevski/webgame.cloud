import { Permission } from 'types'

export type Entitlement = {
    feature: string
}

export const ENTITLEMENTS: Partial<Record<Permission, Entitlement>> = {}

export const PROJECT_LIMIT_ENTITLEMENT: Entitlement = { feature: 'unlimitedProjects' }

export const STORAGE_LIMIT_ENTITLEMENT: Entitlement = { feature: 'moreStorage' }

export const TICKET_LIMIT_ENTITLEMENT: Entitlement = { feature: 'moreTickets' }

export const DESIGN_TEMPLATE_LIMIT_ENTITLEMENT: Entitlement = { feature: 'moreDesignTemplates' }

export const DESIGN_LIMIT_ENTITLEMENT: Entitlement = { feature: 'moreDesigns' }
