import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import { escapeHtml } from 'helpers/html'
import { formatBytes } from 'helpers/format'
import { formatDate } from 'helpers/dates'
import { ADMIN_PROJECT_STATES, APP_TYPES, AdminProject, AdminProjectState } from 'types'

const PAGE_SIZE = 20

const SEARCH_DEBOUNCE_MS = 300

type FilterableTable = HTMLElement & {
    filterValues?: Record<string, unknown>
    rows?: string
    total?: number
    limit?: number
    offset?: number
    loading?: boolean
}

const searchInput = (element: FilterableTable): HTMLInputElement | null =>
    element.shadowRoot?.querySelector<HTMLInputElement>('input[type="text"]') ??
    element.querySelector<HTMLInputElement>('input[type="text"]')

const TYPE_VARIANTS: Record<string, string> = {
    game: 'primary',
    app: 'info',
    prototype: 'secondary',
}

const ProjectDirectory: React.FC = () => {
    const { t } = useStrings()
    const p = t.projectsAdmin
    const navigate = useNavigate()

    const projects = useStore((state) => state.adminProjects)
    const total = useStore((state) => state.adminProjectsTotal)
    const loading = useStore((state) => state.adminProjectsLoading)
    const filters = useStore((state) => state.adminProjectFilters)
    const fetchAdminProjects = useStore((state) => state.fetchAdminProjects)
    const realms = useStore((state) => state.realms)
    const fetchRealms = useStore((state) => state.fetchRealms)

    const canReadRealms = useCan('realm.read')
    const canMove = useCan('admin.project.move')

    const openMove = useModalOpen<boolean, string>(MODAL.MOVE_PROJECT, (moved) => {
        if (moved) void fetchAdminProjects({})
    })

    const filterState = useRef<Record<string, string>>({ state: 'active' })
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
    const typing = useRef(false)

    useEffect(() => {
        void fetchAdminProjects({ limit: PAGE_SIZE, offset: 0 })
        return () => {
            if (debounce.current) clearTimeout(debounce.current)
        }
    }, [fetchAdminProjects])

    useEffect(() => {
        if (canReadRealms) void fetchRealms()
    }, [canReadRealms, fetchRealms])

    const stateLabels: Record<AdminProjectState, string> = {
        active: p.stateActive,
        archived: p.stateArchived,
        all: p.stateAll,
    }

    const rows = useMemo(
        () =>
            projects
                .map((project: AdminProject) => {
                    const flags = [
                        project.archivedAt
                            ? `<tc-badge variant="secondary">${escapeHtml(p.archivedBadge)}</tc-badge>`
                            : '',
                        project.locked ? `<tc-badge variant="warning">${escapeHtml(p.lockedBadge)}</tc-badge>` : '',
                    ].join(' ')
                    const move = canMove
                        ? `<tc-icon-button icon="Server" variant="secondary" size="small" outline data-action="move" data-id="${escapeHtml(project.id)}" label="${escapeHtml(p.move)}" title="${escapeHtml(p.move)}"></tc-icon-button>`
                        : ''
                    return [
                        '<tr>',
                        `<td><strong>${escapeHtml(project.name)}</strong> ${flags}</td>`,
                        `<td>${escapeHtml(project.ownerName || project.ownerEmail)}<br><small>${escapeHtml(project.ownerEmail)}</small></td>`,
                        `<td><tc-badge variant="${TYPE_VARIANTS[project.appType] ?? 'secondary'}">${escapeHtml(project.appType)}</tc-badge></td>`,
                        `<td>${escapeHtml(project.realmName || p.noRealm)}</td>`,
                        `<td style="text-align:right">${project.memberCount}</td>`,
                        `<td style="text-align:right">${project.assetCount}</td>`,
                        `<td style="text-align:right">${escapeHtml(formatBytes(project.storageBytes))}</td>`,
                        `<td>${escapeHtml(formatDate(project.createdAt))}</td>`,
                        '<td style="text-align:right"><span class="table-actions">',
                        move,
                        `<tc-icon-button icon="ArrowRight" variant="primary" size="small" outline data-action="open" data-id="${escapeHtml(project.id)}" label="${escapeHtml(p.open)}" title="${escapeHtml(p.open)}"></tc-icon-button>`,
                        '</span></td>',
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [projects, p, canMove]
    )

    const table = useTc<FilterableTable>({
        columns: [
            { key: 'name', label: p.colName, minWidth: '14rem' },
            { key: 'owner', label: p.colOwner, minWidth: '14rem' },
            { key: 'type', label: p.colType },
            { key: 'realm', label: p.colRealm, hideBelow: 'lg' },
            { key: 'members', label: p.colMembers, align: 'right', hideBelow: 'md' },
            { key: 'assets', label: p.colAssets, align: 'right', hideBelow: 'md' },
            { key: 'storage', label: p.colStorage, align: 'right', hideBelow: 'sm' },
            { key: 'created', label: p.colCreated, hideBelow: 'sm' },
            { key: 'actions', label: '', align: 'right', minWidth: '6rem' },
        ],
        filters: [
            { key: 'q', label: p.filterSearch, type: 'text', placeholder: p.searchPlaceholder },
            {
                key: 'appType',
                label: p.filterType,
                type: 'select',
                placeholder: p.allTypes,
                options: APP_TYPES.map((appType) => ({ value: appType, label: appType })),
            },
            {
                key: 'state',
                label: p.filterState,
                type: 'select',
                options: ADMIN_PROJECT_STATES.map((state) => ({ value: state, label: stateLabels[state] })),
            },
            ...(canReadRealms
                ? [{
                    key: 'realmId',
                    label: p.filterRealm,
                    type: 'select' as const,
                    placeholder: p.allRealms,
                    options: realms.map((realm) => ({ value: realm.id, label: realm.name })),
                }]
                : []),
        ],
        sortableColumns: ['name', 'owner', 'members', 'assets', 'storage', 'created'],
        sort: { column: filters.sort ?? 'created', direction: filters.direction ?? 'desc' },
        onFilterChange: (key: string, value: unknown) => {
            const next = { ...filterState.current, [key]: String(value ?? '') }
            filterState.current = next

            const element = table.current
            if (element) element.filterValues = next

            if (debounce.current) clearTimeout(debounce.current)
            const run = () => fetchAdminProjects({ [key]: (value as string) || undefined, offset: 0 })
            if (key === 'q') {
                typing.current = true
                debounce.current = setTimeout(() => void run(), SEARCH_DEBOUNCE_MS)
                return
            }
            typing.current = false
            void run()
        },
        onSortChange: (next: { column: string; direction: 'asc' | 'desc' } | null) => {
            void fetchAdminProjects({
                sort: (next?.column ?? 'created') as never,
                direction: next?.direction ?? 'desc',
                offset: 0,
            })
        },
        onPageChange: (offset: number) => {
            void fetchAdminProjects({ offset })
        },
    })

    useEffect(() => {
        const element = table.current
        if (!element) return

        element.filterValues = filterState.current
        element.rows = rows
        element.total = total
        element.limit = PAGE_SIZE
        element.offset = filters.offset ?? 0
        element.loading = loading

        if (!typing.current) return
        const input = searchInput(element)
        if (!input) return
        const caret = input.value.length
        input.focus()
        input.setSelectionRange(caret, caret)
    }, [table, rows, total, loading, filters.offset])

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')
        if (!trigger) return
        const id = trigger.dataset.id ?? ''
        if (!id) return
        if (trigger.dataset.action === 'open') navigate(`/platform/projects/${id}`)
        if (trigger.dataset.action === 'move' && canMove) openMove(id)
    }

    return (
        <div className="module module-project-directory" role="presentation" onClick={onClick}>
            <tc-section-card title={p.title}>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{p.subtitle}</tc-text>

                    <tc-advanced-table ref={table} sticky-last-column></tc-advanced-table>

                    {!loading && projects.length === 0 && (
                        <tc-empty-state icon="folder">{p.empty}</tc-empty-state>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default ProjectDirectory
