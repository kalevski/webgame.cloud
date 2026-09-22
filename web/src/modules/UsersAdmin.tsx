import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import AdvancedTable, { AdvancedTableSort } from 'components/AdvancedTable'
import ModuleActions from 'components/ModuleActions'
import { escapeHtml, rowIconButton } from 'helpers/html'
import { MODAL, useModalOpen } from 'modals'
import { FiltersInput, FiltersResult } from 'modals/FiltersModal'
import useCan from 'hooks/useCan'
import { ManageAccessInput, ManageAccessResult } from 'modals/ManageAccessModal'
import { CreateUserResult } from 'modals/CreateUserModal'
import { User, OWNER_ROLE_ID } from 'types'
import { clampOffset } from 'helpers/paging'

const PAGE_SIZE = 10

const UsersAdmin: React.FC = () => {
    const { t } = useStrings()
    const me = useStore((state) => state.me)
    const canWriteAccess = useCan('admin.user.role.write')
    const navigate = useNavigate()
    const canImpersonate = useCan('admin.user.impersonate')
    const canReadAudit = useCan('audit.read')
    const users = useStore((state) => state.users)
    const usersLoaded = useStore((state) => state.usersLoaded)
    const fetchUsers = useStore((state) => state.fetchUsers)
    const createUser = useStore((state) => state.createUser)
    const updateUser = useStore((state) => state.updateUser)
    const impersonateUser = useStore((state) => state.impersonateUser)
    const saveUserAccess = useStore((state) => state.saveUserAccess)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)

    useEffect(() => {
        fetchUsers()

        fetchAccessPolicy()
    }, [fetchUsers, fetchAccessPolicy])

    const [filterValues, setFilterValues] = useState<Record<string, string>>({})
    const [sort, setSort] = useState<AdvancedTableSort | null>(null)
    const [offset, setOffset] = useState(0)

    const roles = useStore((state) => state.roles)
    const roleName = (roleId: string) => roles.find((role) => role.id === roleId)?.name ?? roleId

    const activeOwners = useMemo(
        () => users.filter((user) => user.role === OWNER_ROLE_ID && user.active).length,
        [users]
    )
    const openAccessModal = useModalOpen<ManageAccessResult, ManageAccessInput>(
        MODAL.MANAGE_ACCESS,
        async (result) => {
            if (!result || !pendingUser.current) return
            const userId = pendingUser.current
            const { overrides, ...account } = result

            const saved = await updateUser(userId, account)
            if (saved) await saveUserAccess(userId, overrides)
            pendingUser.current = null
        }
    )
    const pendingUser = React.useRef<string | null>(null)

    const openCreateUserModal = useModalOpen<CreateUserResult>(MODAL.CREATE_USER, async (result) => {
        if (result) await createUser(result)
    })

    const openImpersonateModal = useModalOpen<User, User>(MODAL.IMPERSONATE_USER, async (confirmed) => {
        if (confirmed) await impersonateUser(confirmed.id)
    })

    const filters = useMemo(
        () => [
            { key: 'search', label: t.usersAdmin.filterSearch, type: 'text' as const, placeholder: t.usersAdmin.searchPlaceholder },
        ],
        [t]
    )

    const openFiltersModal = useModalOpen<FiltersResult, FiltersInput>(MODAL.FILTERS, (result) => {
        if (!result) return
        setFilterValues((current) => ({
            ...current,
            role: result.role === 'all' ? '' : String(result.role),
            status: result.status === 'all' ? '' : String(result.status),
        }))
        setOffset(0)
    })
    const activeFilterCount = (filterValues.role ? 1 : 0) + (filterValues.status ? 1 : 0)
    const filterFields = (): FiltersInput => ({
        fields: [
            {
                key: 'role',
                label: t.usersAdmin.filterRole,
                kind: 'select',
                options: [
                    { key: 'all', label: t.usersAdmin.allRoles },
                    ...roles.map((role) => ({ key: role.id, label: role.name })),
                ],
                value: filterValues.role || 'all',
            },
            {
                key: 'status',
                label: t.usersAdmin.filterStatus,
                kind: 'select',
                options: [
                    { key: 'all', label: t.usersAdmin.allStatuses },
                    { key: 'active', label: t.usersAdmin.active },
                    { key: 'inactive', label: t.usersAdmin.inactive },
                ],
                value: filterValues.status || 'all',
            },
        ],
    })

    const columns = useMemo(
        () => [
            { key: 'name', label: t.usersAdmin.colName, minWidth: '140px' },
            { key: 'email', label: t.usersAdmin.colEmail, minWidth: '200px' },
            { key: 'role', label: t.usersAdmin.colAccess, minWidth: '180px' },
            { key: 'joined', label: t.usersAdmin.colJoined, hideBelow: 'sm' as const },
            { key: 'status', label: t.usersAdmin.colStatus, minWidth: '110px' },
            { key: 'actions', label: '', align: 'right' as const, width: '1%' },
        ],
        [t]
    )

    const visible = useMemo(() => {
        const needle = (filterValues.search ?? '').trim().toLowerCase()
        const role = filterValues.role ?? ''
        const status = filterValues.status ?? ''
        const matched = users.filter((user) => {
            if (needle && ![user.name, user.email].some((field) => field && field.toLowerCase().includes(needle))) return false
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

    const renderAccess = (user: User): string => {
        const parts = [`<tc-badge variant="primary" text="${escapeHtml(roleName(user.role))}"></tc-badge>`]
        if (user.verified) {
            parts.push(`<tc-badge variant="success" text="${escapeHtml(t.usersAdmin.verifiedBadge)}"></tc-badge>`)
        }
        return parts.join(' ')
    }

    const rows = page
        .map((user) => {
            const self = user.id === me?.id
            const joined = new Date(user.createdAt).toLocaleDateString('mk-MK')
            const status = `<tc-badge variant="${user.active ? 'success' : 'danger'}" text="${escapeHtml(user.active ? t.usersAdmin.active : t.usersAdmin.inactive)}"></tc-badge>`
            const accessLabel = t.usersAdmin.manageAccess
            const access = self || !canWriteAccess
                ? ''
                : rowIconButton('Settings', 'secondary', 'access', user.id, accessLabel)
            const toggleLabel = user.active ? t.usersAdmin.deactivate : t.usersAdmin.activate
            const toggle = self || !canWriteAccess
                ? ''
                : rowIconButton(user.active ? 'UserX' : 'UserCheck', user.active ? 'danger' : 'success', 'toggle-active', user.id, toggleLabel)

            const canLoginAs = canImpersonate && !self && user.active &&
                (user.role !== OWNER_ROLE_ID || me?.role === OWNER_ROLE_ID)
            const loginAs = !canLoginAs
                ? ''
                : rowIconButton('LogIn', 'secondary', 'impersonate', user.id, t.usersAdmin.loginAs)
            const activity = !canReadAudit
                ? ''
                : rowIconButton('History', 'secondary', 'activity', user.id, t.usersAdmin.activity)

            return `<tr${user.active ? '' : ' class="module-users__row--inactive"'}>
                <td>${escapeHtml(user.name || '—')}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${renderAccess(user)}</td>
                <td>${escapeHtml(joined)}</td>
                <td>${status}</td>
                <td style="text-align:right"><span class="table-actions">${activity}${access}${loginAs}${toggle}</span></td>
            </tr>`
        })
        .join('')

    const handleRowAction = async (action: string, id: string) => {
        const user = users.find((entry) => entry.id === id)
        if (!user) return
        if (action === 'activity') {
            navigate(`/moderation/audit?actor=${encodeURIComponent(user.id)}`)
            return
        }
        if (user.id === me?.id) return
        if (action === 'impersonate') {
            if (!canImpersonate) return

            openImpersonateModal(user)
            return
        }

        if (!canWriteAccess) return
        if (action === 'toggle-active') updateUser(user.id, { active: !user.active })
        if (action === 'access') {
            pendingUser.current = user.id
            openAccessModal({ user, activeOwners, clientCount: 0 })
        }
    }

    return (
        <div className="module module-users">
            <ModuleActions>
                <tc-button variant="secondary" outline onClick={() => openFiltersModal(filterFields())}>
                    {activeFilterCount > 0 ? t.filters.buttonWithCount(activeFilterCount) : t.filters.button}
                </tc-button>
                {canWriteAccess && (
                    <tc-button variant="primary" onClick={() => openCreateUserModal()}>
                        {t.usersAdmin.addUser}
                    </tc-button>
                )}
            </ModuleActions>

            <tc-section-card title={t.usersAdmin.title} icon="UsersRound">
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
                    stickyFirstColumn
                    stickyLastColumn
                    onFilterChange={(key, value) => {
                        setFilterValues((current) => ({ ...current, [key]: value }))
                        setOffset(0)
                    }}
                    onSortChange={setSort}
                    onPageChange={setOffset}
                    onRowAction={handleRowAction}
                />
            </tc-section-card>
        </div>
    )
}

export default UsersAdmin
