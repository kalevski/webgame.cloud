import { FeatureFlag, Permission } from 'types'
import type { AppStrings } from './strings'

export const HOME_ROUTE = '/dashboard'

export type ChromeBar = 'brand' | 'title' | 'back' | 'none'

export type NavSection = 'workspace' | 'platform' | 'admin'

export type NavLabelKey = keyof AppStrings['nav']

export type NavItem = {
    id: string
    labelKey: NavLabelKey
    tabLabelKey?: NavLabelKey
    icon: string
    path: string
    section: NavSection
    requires: Permission[]
    requiresAny?: Permission[]
    feature?: FeatureFlag
    rank: number
    order: number
}

export type RouteChrome = {
    pattern: RegExp
    bar: ChromeBar
    nav: string
    backTo?: string
}

export const NAV: NavItem[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: 'LayoutGrid', path: '/dashboard', requires: [], rank: 1, order: 1, section: 'workspace' },
    { id: 'profile', labelKey: 'profile', icon: 'User', path: '/profile', requires: [], rank: 5, order: 2, section: 'workspace' },
    { id: 'tickets', labelKey: 'tickets', tabLabelKey: 'ticketsTab', icon: 'LifeBuoy', path: '/profile/tickets', requires: ['ticket.create'], feature: 'tickets', rank: 6, order: 3, section: 'workspace' },
    { id: 'billing', labelKey: 'billing', icon: 'CreditCard', path: '/billing', requires: [], feature: 'billing', rank: 7, order: 4, section: 'workspace' },

    { id: 'realms', labelKey: 'realms', icon: 'Server', path: '/platform/realms', requires: ['realm.read'], rank: 11, order: 11, section: 'platform' },
    { id: 'platform-projects', labelKey: 'platformProjects', icon: 'FolderKanban', path: '/platform/projects', requires: ['admin.project.read'], rank: 12, order: 12, section: 'platform' },
    { id: 'platform-users', labelKey: 'platformUsers', icon: 'Users', path: '/platform/users', requires: ['admin.user.read'], rank: 13, order: 13, section: 'platform' },
    { id: 'ticket-queue', labelKey: 'ticketQueue', tabLabelKey: 'ticketQueueTab', icon: 'Inbox', path: '/platform/tickets', requires: ['ticket.queue.read'], feature: 'tickets', rank: 14, order: 14, section: 'platform' },
    { id: 'invoices', labelKey: 'invoices', icon: 'Receipt', path: '/platform/invoices', requires: ['invoice.read'], feature: 'billing', rank: 15, order: 15, section: 'platform' },
    { id: 'enquiries', labelKey: 'enquiries', icon: 'Mailbox', path: '/platform/enquiries', requires: ['enquiry.read'], feature: 'billing', rank: 16, order: 16, section: 'platform' },
    { id: 'email', labelKey: 'email', icon: 'Mail', path: '/platform/email', requires: ['email.outbox.read'], feature: 'email', rank: 17, order: 17, section: 'platform' },

    { id: 'admin', labelKey: 'admin', icon: 'Shield', path: '/admin', requires: ['admin.overview.read'], rank: 21, order: 21, section: 'admin' },
    { id: 'moderation', labelKey: 'moderation', icon: 'Flag', path: '/moderation', requires: [], requiresAny: ['moderation.queue.read', 'role.application.read'], rank: 22, order: 22, section: 'admin' },
]

const ROUTE_CHROME: RouteChrome[] = [
    { pattern: /^\/dashboard\/?$/, bar: 'brand', nav: 'dashboard' },
    { pattern: /^\/projects\/new\/?$/, bar: 'back', nav: 'dashboard', backTo: HOME_ROUTE },

    { pattern: /^\/projects\/[^/]+\/settings(\/[^/]+)?\/?$/, bar: 'back', nav: 'dashboard', backTo: HOME_ROUTE },
    { pattern: /^\/projects\/[^/]+\/tools\/[^/]+\/?$/, bar: 'back', nav: 'dashboard', backTo: HOME_ROUTE },
    { pattern: /^\/projects\/[^/]+\/live(\/[^/]+)?\/?$/, bar: 'back', nav: 'dashboard', backTo: HOME_ROUTE },
    { pattern: /^\/projects\/[^/]+(\/(assets|bundles|builds|members))?\/?$/, bar: 'title', nav: 'dashboard' },

    { pattern: /^\/profile\/tickets\/?$/, bar: 'title', nav: 'tickets' },
    { pattern: /^\/profile(\/[^/]+)?\/?$/, bar: 'title', nav: 'profile' },

    { pattern: /^\/billing(\/[^/]+)?\/?$/, bar: 'title', nav: 'billing' },

    { pattern: /^\/platform\/tickets\/?$/, bar: 'title', nav: 'ticket-queue' },
    { pattern: /^\/tickets\/[^/]+\/?$/, bar: 'back', nav: 'tickets', backTo: '/profile/tickets' },

    { pattern: /^\/platform\/realms(\/[^/]+)?\/?$/, bar: 'back', nav: 'realms', backTo: HOME_ROUTE },
    { pattern: /^\/platform\/projects(\/[^/]+)*\/?$/, bar: 'back', nav: 'platform-projects', backTo: HOME_ROUTE },
    { pattern: /^\/platform\/users(\/[^/]+)*\/?$/, bar: 'back', nav: 'platform-users', backTo: HOME_ROUTE },
    { pattern: /^\/platform\/invoices\/?$/, bar: 'back', nav: 'invoices', backTo: HOME_ROUTE },
    { pattern: /^\/platform\/enquiries\/?$/, bar: 'back', nav: 'enquiries', backTo: HOME_ROUTE },
    { pattern: /^\/platform\/email(\/[^/]+)?\/?$/, bar: 'back', nav: 'email', backTo: HOME_ROUTE },

    { pattern: /^\/admin(\/[^/]+)?\/?$/, bar: 'back', nav: 'admin', backTo: HOME_ROUTE },
    { pattern: /^\/moderation(\/[^/]+)?\/?$/, bar: 'back', nav: 'moderation', backTo: HOME_ROUTE },

    { pattern: /^\/(terms|privacy|dmca)\/?$/, bar: 'back', nav: 'more', backTo: HOME_ROUTE },
]

const FALLBACK: RouteChrome = { pattern: /.*/, bar: 'none', nav: '' }

export const chromeForPath = (pathname: string): RouteChrome =>
    ROUTE_CHROME.find((entry) => entry.pattern.test(pathname)) ?? FALLBACK

export const navIdForPath = (pathname: string): string => chromeForPath(pathname).nav

export type NavFilter = {
    can: (permission: Permission) => boolean
    hasFeature: (flag: FeatureFlag) => boolean
}

export const availableNav = (filter: NavFilter): NavItem[] =>
    NAV.filter((item) =>
        (item.feature ? filter.hasFeature(item.feature) : true)
        && item.requires.every((permission) => filter.can(permission))
        && (item.requiresAny === undefined || item.requiresAny.some((permission) => filter.can(permission)))
    )

export const dockSeats = (filter: NavFilter): NavItem[] =>
    [...availableNav(filter)]
        .sort((first, second) => first.rank - second.rank)
        .slice(0, 4)
        .sort((first, second) => first.order - second.order)

export const moreGroups = (filter: NavFilter): Array<{ section: NavSection; items: NavItem[] }> => {
    const seated = new Set(dockSeats(filter).map((item) => item.id))
    const rest = availableNav(filter).filter((item) => !seated.has(item.id))

    const sections: NavSection[] = ['workspace', 'platform', 'admin']
    return sections
        .map((section) => ({
            section,
            items: rest.filter((item) => item.section === section).sort((a, b) => a.order - b.order),
        }))
        .filter((group) => group.items.length > 0)
}
