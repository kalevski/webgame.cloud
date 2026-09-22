import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import AdvancedTable from 'components/AdvancedTable'
import ModuleActions from 'components/ModuleActions'
import { escapeHtml, rowIconButton } from 'helpers/html'
import { formatDate, formatDateTime } from 'helpers/dates'
import { clampOffset } from 'helpers/paging'
import { MODAL, useModalOpen } from 'modals'
import { ApiKeyModalInput } from 'modals/ApiKeyModal'
import { CreateServiceAccountResult } from 'modals/CreateServiceAccountModal'
import { ManageAccessInput, ManageAccessResult } from 'modals/ManageAccessModal'
import { ApiKey, ServiceAccount } from 'types'

const PAGE_SIZE = 10

const describeKey = (key: ApiKey, labels: {
    scopeCount: (n: number) => string
    lastUsed: (when: string) => string
    neverUsed: string
    expires: (when: string) => string
    neverExpires: string
}): string => [
    key.prefix,
    labels.scopeCount(key.scopes.length),
    key.lastUsedAt ? labels.lastUsed(formatDateTime(key.lastUsedAt)) : labels.neverUsed,
    key.expiresAt ? labels.expires(formatDate(key.expiresAt)) : labels.neverExpires,
].join(' · ')

const ServiceAccountsAdmin: React.FC = () => {
    const { t } = useStrings()
    const s = t.serviceAccounts
    const k = t.apiKeys
    const canWrite = useCan('admin.service.write')

    const serviceAccounts = useStore((state) => state.serviceAccounts)
    const serviceAccountsLoaded = useStore((state) => state.serviceAccountsLoaded)
    const serviceKeys = useStore((state) => state.serviceKeys)
    const serviceKeysOwnerId = useStore((state) => state.serviceKeysOwnerId)
    const fetchServiceAccounts = useStore((state) => state.fetchServiceAccounts)
    const createServiceAccount = useStore((state) => state.createServiceAccount)
    const updateServiceAccount = useStore((state) => state.updateServiceAccount)
    const deleteServiceAccount = useStore((state) => state.deleteServiceAccount)
    const saveServiceAccountAccess = useStore((state) => state.saveServiceAccountAccess)
    const fetchServiceKeys = useStore((state) => state.fetchServiceKeys)
    const revokeServiceKey = useStore((state) => state.revokeServiceKey)
    const clearServiceKeys = useStore((state) => state.clearServiceKeys)
    const roles = useStore((state) => state.roles)
    const fetchAccessPolicy = useStore((state) => state.fetchAccessPolicy)

    const [offset, setOffset] = useState(0)
    const pendingAccount = useRef<string | null>(null)

    useEffect(() => {
        void fetchServiceAccounts()
        void fetchAccessPolicy()
    }, [fetchServiceAccounts, fetchAccessPolicy])

    const openCreateModal = useModalOpen<CreateServiceAccountResult>(
        MODAL.CREATE_SERVICE_ACCOUNT,
        async (result) => {
            if (result) await createServiceAccount(result)
        }
    )

    const openKeyModal = useModalOpen<{ keyId: string } | null, ApiKeyModalInput>(MODAL.API_KEY)

    const openAccessModal = useModalOpen<ManageAccessResult, ManageAccessInput>(
        MODAL.MANAGE_ACCESS,
        async (result) => {
            if (!result || !pendingAccount.current) return
            const id = pendingAccount.current
            pendingAccount.current = null
            const saved = await updateServiceAccount(id, { role: result.role })
            if (saved) await saveServiceAccountAccess(id, result.overrides)
        }
    )

    const roleName = (roleId: string) => roles.find((role) => role.id === roleId)?.name ?? roleId

    const columns = useMemo(
        () => [
            { key: 'name', label: s.colName, minWidth: '180px' },
            { key: 'role', label: s.colRole, minWidth: '160px' },
            { key: 'keys', label: s.colKeys, minWidth: '90px' },
            { key: 'used', label: s.colUsed, hideBelow: 'sm' as const },
            { key: 'status', label: s.colStatus, minWidth: '110px' },
            { key: 'actions', label: '', align: 'right' as const, width: '1%' },
        ],
        [s]
    )

    const pageOffset = clampOffset(offset, serviceAccounts.length, PAGE_SIZE)
    const page = serviceAccounts.slice(pageOffset, pageOffset + PAGE_SIZE)

    const rows = page
        .map((account: ServiceAccount) => {
            const status = `<tc-badge variant="${account.active ? 'success' : 'danger'}" text="${escapeHtml(account.active ? s.active : s.inactive)}"></tc-badge>`
            const role = `<tc-badge variant="primary" text="${escapeHtml(roleName(account.role))}"></tc-badge>`
            const used = account.lastUsedAt ? formatDateTime(account.lastUsedAt) : s.neverUsed
            const keys = rowIconButton('KeyRound', 'secondary', 'keys', account.id, s.keys)
            const access = !canWrite
                ? ''
                : rowIconButton('Settings', 'secondary', 'access', account.id, s.manageAccess)
            const toggleLabel = account.active ? s.deactivate : s.activate
            const toggle = !canWrite
                ? ''
                : rowIconButton(account.active ? 'PowerOff' : 'Power', account.active ? 'danger' : 'success', 'toggle-active', account.id, toggleLabel)
            const remove = !canWrite
                ? ''
                : rowIconButton('Trash2', 'danger', 'delete', account.id, s.remove)

            return `<tr${account.active ? '' : ' class="module-service-accounts__row--inactive"'}>
                <td>${escapeHtml(account.name)}</td>
                <td>${role}</td>
                <td>${escapeHtml(s.keyCount(account.keyCount))}</td>
                <td>${escapeHtml(used)}</td>
                <td>${status}</td>
                <td style="text-align:right"><span class="table-actions">${keys}${access}${toggle}${remove}</span></td>
            </tr>`
        })
        .join('')

    const handleRowAction = async (action: string, id: string) => {
        const account = serviceAccounts.find((entry) => entry.id === id)
        if (!account) return
        if (action === 'keys') {
            if (serviceKeysOwnerId === id) {
                clearServiceKeys()
                return
            }
            await fetchServiceKeys(id)
            return
        }
        if (!canWrite) return
        if (action === 'toggle-active') {
            await updateServiceAccount(id, { active: !account.active })
            return
        }
        if (action === 'access') {
            pendingAccount.current = id
            openAccessModal({
                user: { id: account.id, name: account.name, email: '', role: account.role, verified: false },
                activeOwners: 0,
                clientCount: 0,
                scope: 'service',
            })
            return
        }
        if (action === 'delete') {
            if (!window.confirm(s.removePrompt(account.name))) return
            await deleteServiceAccount(id)
        }
    }

    const selected = serviceAccounts.find((account) => account.id === serviceKeysOwnerId) ?? null

    const keyList = useTc<HTMLElement>({
        actions: serviceKeys.map((key) => ({
            key: key.id,
            title: key.name,
            description: describeKey(key, k),
            label: canWrite ? k.revoke : '',
            variant: 'danger',
            icon: 'Trash2',
        })),
        onActionClick: (id: string) => {
            if (!canWrite || !selected) return
            const key = serviceKeys.find((entry) => entry.id === id)
            if (!key) return
            if (!window.confirm(k.revokePrompt(key.name))) return
            void revokeServiceKey(selected.id, id)
        },
    })

    return (
        <div className="module module-service-accounts">
            <ModuleActions>
                {canWrite && (
                    <tc-button variant="primary" onClick={() => openCreateModal()}>
                        {s.create}
                    </tc-button>
                )}
            </ModuleActions>

            <tc-section-card title={s.title} icon="Bot">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{s.intro}</tc-text>

                    {serviceAccountsLoaded && serviceAccounts.length === 0 ? (
                        <tc-empty-state icon="bot">{s.empty}</tc-empty-state>
                    ) : (
                        <AdvancedTable
                            columns={columns}
                            rows={rows}
                            total={serviceAccounts.length}
                            offset={pageOffset}
                            limit={PAGE_SIZE}
                            loading={!serviceAccountsLoaded}
                            stickyFirstColumn
                            stickyLastColumn
                            onPageChange={setOffset}
                            onRowAction={handleRowAction}
                        />
                    )}
                </tc-stack>
            </tc-section-card>

            {selected && (
                <>
                <ModuleActions>
                    {canWrite && (
                        <tc-button
                            variant="primary"
                            onClick={() => openKeyModal({ serviceAccountId: selected.id })}
                        >
                            {s.newKey}
                        </tc-button>
                    )}
                </ModuleActions>

                <tc-section-card title={s.keysTitle(selected.name)} icon="Key">
                    <tc-stack direction="vertical" gap="0.85rem">
                        <tc-text variant="muted">{s.keysIntro}</tc-text>

                        {serviceKeys.length === 0 ? (
                            <tc-empty-state icon="key">{s.keysEmpty}</tc-empty-state>
                        ) : (
                            <tc-action-row-list ref={keyList} outline trailing-icon="none"></tc-action-row-list>
                        )}
                    </tc-stack>
                </tc-section-card>
                </>
            )}
        </div>
    )
}

export default ServiceAccountsAdmin
