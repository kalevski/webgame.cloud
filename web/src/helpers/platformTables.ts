import { AdvancedTableColumn } from 'components/AdvancedTable'
import { escapeHtml } from 'helpers/html'
import { formatBytes } from 'helpers/format'
import { formatDate } from 'helpers/dates'
import { toIconName } from 'helpers/icons'
import { AppStrings } from 'configs/strings'
import { AdminProject } from 'types'

const DEFAULT_PROJECT_COLOR = '#7c3aed'

const DEFAULT_PROJECT_ICON = 'folder'

const projectTile = (icon: string, color: string): string =>
    [
        `<span class="project-icon-tile" data-size="xs" style="--project-color:${escapeHtml(color || DEFAULT_PROJECT_COLOR)}">`,
        `<tc-icon name="${escapeHtml(toIconName(icon || DEFAULT_PROJECT_ICON))}" size="14"></tc-icon>`,
        '</span>',
    ].join('')

const TYPE_VARIANTS: Record<string, string> = {
    game: 'primary',
    app: 'info',
    prototype: 'secondary',
}

const badge = (variant: string, label: string): string =>
    `<tc-badge variant="${variant}" text="${escapeHtml(label)}"></tc-badge>`

const mono = (value: string): string => `<span class="platform-mono">${escapeHtml(value)}</span>`

const figure = (value: string | number): string =>
    `<span class="platform-figure">${escapeHtml(String(value))}</span>`

const unset = (label: string): string => `<span class="platform-unset">${escapeHtml(label)}</span>`

const standing = (isOwner: boolean, word: string, detail?: string): string =>
    [
        `<span class="platform-standing" data-owner="${isOwner}">`,
        `<span class="platform-standing__word">${escapeHtml(word)}</span>`,
        detail ? `<span class="platform-standing__detail">${escapeHtml(detail)}</span>` : '',
        '</span>',
    ].join('')

const link = (id: string, label: string): string =>
    `<button type="button" class="platform-identity__link" data-action="open" data-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`

const iconButton = (action: string, id: string, icon: string, label: string, variant: string): string =>
    `<tc-icon-button icon="${icon}" variant="${variant}" size="small" outline data-action="${escapeHtml(action)}" data-id="${escapeHtml(id)}" label="${escapeHtml(label)}" title="${escapeHtml(label)}"></tc-icon-button>`

const actionsCell = (buttons: string[]): string =>
    `<td style="text-align:right"><span class="table-actions">${buttons.join('')}</span></td>`

const initials = (name: string, email: string): string => {
    const parts = (name || email).trim().split(/[\s@._-]+/).filter(Boolean)
    if (parts.length === 0) return '—'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const stateCell = (active: boolean, label: string): string =>
    [
        `<span class="platform-state" data-on="${active}">`,
        '<span class="platform-state__dot"></span>',
        escapeHtml(label),
        '</span>',
    ].join('')

export type ProjectColumnKey =
    | 'name'
    | 'owner'
    | 'standing'
    | 'type'
    | 'realm'
    | 'members'
    | 'assets'
    | 'builds'
    | 'storage'
    | 'created'
    | 'actions'

export type ProjectTableOptions = {
    canMove?: boolean

    viewerId?: string
}

export const PROJECT_SORTABLE = ['name', 'owner', 'members', 'assets', 'storage', 'created']

export const projectColumns = (
    p: AppStrings['projectsAdmin'],
    keys: readonly ProjectColumnKey[]
): AdvancedTableColumn[] => {
    const all: Record<ProjectColumnKey, AdvancedTableColumn> = {
        name: { key: 'name', label: p.colName, minWidth: '14rem' },
        owner: { key: 'owner', label: p.colOwner, minWidth: '14rem' },
        standing: { key: 'standing', label: p.colStanding, minWidth: '8rem' },
        type: { key: 'type', label: p.colType },
        realm: { key: 'realm', label: p.colRealm, hideBelow: 'lg' },
        members: { key: 'members', label: p.colMembers, align: 'right', hideBelow: 'md' },
        assets: { key: 'assets', label: p.colAssets, align: 'right', hideBelow: 'md' },
        builds: { key: 'builds', label: p.colBuilds, align: 'right', hideBelow: 'lg' },
        storage: { key: 'storage', label: p.colStorage, align: 'right', hideBelow: 'sm' },
        created: { key: 'created', label: p.colCreated, hideBelow: 'sm' },
        actions: { key: 'actions', label: '', align: 'right', minWidth: '6rem' },
    }
    return keys.map((key) => all[key])
}

export const projectRow = (
    project: AdminProject,
    p: AppStrings['projectsAdmin'],
    keys: readonly ProjectColumnKey[],
    options: ProjectTableOptions = {}
): string => {
    const flags = [
        project.archivedAt ? badge('secondary', p.archivedBadge) : '',
        project.locked ? badge('warning', p.lockedBadge) : '',
    ].join(' ')

    const cells: Record<ProjectColumnKey, string> = {
        name: `<td><span class="platform-identity">${projectTile(project.icon, project.color)}${link(project.id, project.name)}${flags}</span></td>`,
        owner: `<td><span class="platform-owner"><span class="platform-owner__name">${escapeHtml(project.ownerName || project.ownerEmail)}</span><span class="platform-owner__email platform-mono">${escapeHtml(project.ownerEmail)}</span></span></td>`,
        standing: `<td>${standing(
            project.ownerId === options.viewerId,
            project.ownerId === options.viewerId ? p.standingOwner : p.standingMember
        )}</td>`,
        type: `<td>${badge(TYPE_VARIANTS[project.appType] ?? 'secondary', project.appType)}</td>`,
        realm: `<td>${project.realmName ? mono(project.realmName) : unset(p.noRealm)}</td>`,
        members: `<td style="text-align:right">${figure(project.memberCount)}</td>`,
        assets: `<td style="text-align:right">${figure(project.assetCount)}</td>`,
        builds: `<td style="text-align:right">${figure(project.buildCount)}</td>`,
        storage: `<td style="text-align:right">${figure(formatBytes(project.storageBytes))}</td>`,
        created: `<td>${mono(formatDate(project.createdAt))}</td>`,
        actions: actionsCell([
            options.canMove ? iconButton('move', project.id, 'Server', p.move, 'secondary') : '',
            iconButton('open', project.id, 'ArrowRight', p.open, 'primary'),
        ]),
    }

    return `<tr>${keys.map((key) => cells[key]).join('')}</tr>`
}

export type PersonColumnKey = 'name' | 'email' | 'role' | 'standing' | 'status' | 'joined' | 'actions'

export type PersonRowData = {
    id: string
    name: string
    email: string
    verified: boolean
    active: boolean
    roleName: string
    joinedAt: string

    isOwner?: boolean
    permissionCount?: number
}

export const personColumns = (
    u: AppStrings['usersAdmin'],
    p: AppStrings['projectsAdmin'],
    keys: readonly PersonColumnKey[]
): AdvancedTableColumn[] => {
    const all: Record<PersonColumnKey, AdvancedTableColumn> = {
        name: { key: 'name', label: u.colName, minWidth: '14rem' },
        email: { key: 'email', label: u.colEmail, minWidth: '16rem' },
        role: { key: 'role', label: u.colAccess, minWidth: '9rem' },
        standing: { key: 'standing', label: p.colStanding, minWidth: '11rem' },
        status: { key: 'status', label: u.colStatus, minWidth: '8rem' },
        joined: { key: 'joined', label: u.colJoined, hideBelow: 'sm' },
        actions: { key: 'actions', label: '', align: 'right', minWidth: '4rem' },
    }
    return keys.map((key) => all[key])
}

export const personRow = (
    person: PersonRowData,
    u: AppStrings['usersAdmin'],
    p: AppStrings['projectsAdmin'],
    keys: readonly PersonColumnKey[],
    openLabel: string
): string => {
    const cells: Record<PersonColumnKey, string> = {
        name: `<td><span class="platform-identity"><span class="platform-identity__tile" aria-hidden="true">${escapeHtml(initials(person.name, person.email))}</span>${link(person.id, person.name || u.unnamed)}</span></td>`,
        email: `<td><span class="platform-mono">${escapeHtml(person.email)}${person.verified ? `<span class="platform-verified" title="${escapeHtml(u.verifiedBadge)}">✓</span>` : ''}</span></td>`,
        role: `<td>${badge('primary', person.roleName)}</td>`,
        standing: `<td>${standing(
            Boolean(person.isOwner),
            person.isOwner ? p.standingOwner : p.standingMember,
            person.isOwner ? p.standingFullAccess : p.permissionCount(person.permissionCount ?? 0)
        )}</td>`,
        status: `<td>${stateCell(person.active, person.active ? u.active : u.inactive)}</td>`,
        joined: `<td>${mono(formatDate(person.joinedAt))}</td>`,
        actions: actionsCell([iconButton('open', person.id, 'ArrowRight', openLabel, 'primary')]),
    }

    return `<tr${person.active ? '' : ' class="platform-row--muted"'}>${keys.map((key) => cells[key]).join('')}</tr>`
}
