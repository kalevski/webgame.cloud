import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import AdvancedTable, { AdvancedTableSort } from 'components/AdvancedTable'
import { PersonColumnKey, personColumns, personRow } from 'helpers/platformTables'
import { clampOffset } from 'helpers/paging'
import { User } from 'types'

const PAGE_SIZE = 20

const COLUMN_KEYS: PersonColumnKey[] = ['name', 'email', 'role', 'status', 'joined', 'actions']

const UserDirectory: React.FC = () => {
    const { t } = useStrings()
    const u = t.userProfilesAdmin
    const navigate = useNavigate()

    const users = useStore((state) => state.users)
    const usersLoaded = useStore((state) => state.usersLoaded)
    const fetchUsers = useStore((state) => state.fetchUsers)
    const roles = useStore((state) => state.roles)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)

    const [filterValues, setFilterValues] = useState<Record<string, string>>({})
    const [sort, setSort] = useState<AdvancedTableSort | null>(null)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        void fetchUsers()
        void fetchAccessPolicy()
    }, [fetchUsers, fetchAccessPolicy])

    const roleName = useMemo(() => {
        const byId = new Map(roles.map((role) => [role.id, role.name]))
        return (id: string) => byId.get(id) ?? id
    }, [roles])

    const visible = useMemo(() => {
        const needle = (filterValues.search ?? '').trim().toLowerCase()
        const status = filterValues.status ?? ''
        const role = filterValues.role ?? ''
        const matched = users.filter((user: User) => {
            if (needle && ![user.name, user.email].some((field) => field && field.toLowerCase().includes(needle))) {
                return false
            }
            if (role && user.role !== role) return false
            if (status && (status === 'active') !== user.active) return false
            return true
        })
        if (!sort) return matched
        const dir = sort.direction === 'asc' ? 1 : -1
        return [...matched].sort((a, b) => {
            if (sort.column === 'joined') return a.createdAt.localeCompare(b.createdAt) * dir
            const left = sort.column === 'email' ? a.email : a.name
            const right = sort.column === 'email' ? b.email : b.name
            return left.localeCompare(right) * dir
        })
    }, [users, filterValues, sort])

    const pageOffset = clampOffset(offset, visible.length, PAGE_SIZE)
    const page = visible.slice(pageOffset, pageOffset + PAGE_SIZE)

    const rows = page
        .map((user) =>
            personRow(
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    verified: user.verified,
                    active: user.active,
                    roleName: roleName(user.role),
                    joinedAt: user.createdAt,
                },
                t.usersAdmin,
                t.projectsAdmin,
                COLUMN_KEYS,
                u.open
            )
        )
        .join('')

    const columns = useMemo(
        () => personColumns(t.usersAdmin, t.projectsAdmin, COLUMN_KEYS),
        [t]
    )

    const filters = useMemo(
        () => [
            {
                key: 'search',
                label: t.usersAdmin.filterSearch,
                type: 'text' as const,
                placeholder: t.usersAdmin.searchPlaceholder,
            },
            {
                key: 'role',
                label: t.usersAdmin.filterRole,
                type: 'select' as const,
                placeholder: t.usersAdmin.allRoles,
                options: roles.map((role) => ({ value: role.id, label: role.name })),
            },
            {
                key: 'status',
                label: t.usersAdmin.filterStatus,
                type: 'select' as const,
                placeholder: t.usersAdmin.allStatuses,
                options: [
                    { value: 'active', label: u.active },
                    { value: 'inactive', label: u.inactive },
                ],
            },
        ],
        [t, roles, u]
    )

    return (
        <div className="module module-user-directory">
            <AdvancedTable
                columns={columns}
                rows={rows}
                total={visible.length}
                offset={pageOffset}
                limit={PAGE_SIZE}
                loading={!usersLoaded}
                filters={filters}
                filterValues={filterValues}
                sortableColumns={['name', 'email', 'joined']}
                sort={sort}
                stickyLastColumn
                onFilterChange={(key, value) => {
                    setFilterValues((current) => ({ ...current, [key]: value }))
                    setOffset(0)
                }}
                onSortChange={setSort}
                onPageChange={setOffset}
                onRowAction={(action, id) => {
                    if (action === 'open') navigate(`/platform/users/${id}`)
                }}
            />

            {usersLoaded && visible.length === 0 && <tc-empty-state icon="users">{u.empty}</tc-empty-state>}
        </div>
    )
}

export default UserDirectory
