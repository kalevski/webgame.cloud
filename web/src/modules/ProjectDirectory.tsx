import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import useStableValue from 'hooks/useStableValue'
import { PROJECT_SORTABLE, ProjectColumnKey, projectColumns, projectRow } from 'helpers/platformTables'
import { ADMIN_PROJECT_STATES, APP_TYPES, AdminProject, AdminProjectState } from 'types'

const PAGE_SIZE = 20

const SEARCH_DEBOUNCE_MS = 300

const COLUMN_KEYS: ProjectColumnKey[] = [
    'name',
    'owner',
    'type',
    'realm',
    'members',
    'assets',
    'builds',
    'storage',
    'created',
    'actions',
]

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
        () => projects.map((project: AdminProject) => projectRow(project, p, COLUMN_KEYS, { canMove })).join(''),
        [projects, p, canMove]
    )

    const table = useTc<FilterableTable>({
        columns: useStableValue(projectColumns(p, COLUMN_KEYS)),
        filters: useStableValue([
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
        ]),
        sortableColumns: PROJECT_SORTABLE,
        sort: useStableValue({ column: filters.sort ?? 'created', direction: filters.direction ?? 'desc' }),
        filterValues: useStableValue(filterState.current),
        rows,
        total,
        limit: PAGE_SIZE,
        offset: filters.offset ?? 0,
        loading,
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
            <tc-advanced-table ref={table} sticky-last-column></tc-advanced-table>

            {!loading && projects.length === 0 && <tc-empty-state icon="folder">{p.empty}</tc-empty-state>}
        </div>
    )
}

export default ProjectDirectory
