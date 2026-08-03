import React, { useEffect, useMemo, useRef, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'
import { useProjectCan } from 'hooks/useProjectCan'
import AdvancedTable from 'components/AdvancedTable'
import FloatingActionBar from 'components/FloatingActionBar'
import { escapeHtml } from 'helpers/html'
import { formatDate } from 'helpers/dates'
import {
    PROJECT_PERMISSIONS,
    PROJECT_PERMISSION_HINTS,
    PROJECT_PERMISSION_LABELS,
    Project,
    ProjectMember,
    ProjectPermission,
} from 'types'

type Props = {
    project: Project
}

type SelectElement = HTMLElement & {
    items?: { key: string; label: string; description?: string }[]
    values?: string[]
    dataset: DOMStringMap
}

const PERMISSION_ITEMS = PROJECT_PERMISSIONS.map((permission) => ({
    key: permission,
    label: PROJECT_PERMISSION_LABELS[permission],
    description: PROJECT_PERMISSION_HINTS[permission],
}))

type PermissionSummaryStrings = {
    readOnlyLabel: string
    allPermissions: string
    morePermissions: (count: number) => string
}

const permissionSummary = (permissions: readonly string[], strings: PermissionSummaryStrings): string => {
    const total = PROJECT_PERMISSIONS.length
    if (permissions.length === 0)
        return `<span class="member-table__muted">${escapeHtml(strings.readOnlyLabel)}</span>`

    const names = permissions.map(
        (permission) => PROJECT_PERMISSION_LABELS[permission as ProjectPermission] ?? permission
    )
    const full = escapeHtml(names.join(', '))
    const count = `<span class="member-table__perm-count">${permissions.length}/${total}</span>`

    if (permissions.length === total)
        return `<span class="member-table__perm-summary" title="${full}">${count}${escapeHtml(strings.allPermissions)}</span>`

    const shown = names.slice(0, 2).join(', ')
    const rest = names.length - 2
    const tail = rest > 0 ? ` <span class="member-table__muted">${escapeHtml(strings.morePermissions(rest))}</span>` : ''
    return `<span class="member-table__perm-summary" title="${full}">${count}${escapeHtml(shown)}${tail}</span>`
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
    a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

const wireSelect = (element: SelectElement, selection: readonly string[]): void => {
    if (element.dataset.wired !== 'true') {
        element.items = PERMISSION_ITEMS
        element.dataset.wired = 'true'
    }
    if (!sameSet(element.values ?? [], selection)) element.values = [...selection]
}

const ProjectMembers: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const m = t.members

    const members = useStore((state) => state.members)
    const invites = useStore((state) => state.invites)
    const fetchMembers = useStore((state) => state.fetchMembers)
    const fetchInvites = useStore((state) => state.fetchInvites)
    const updateMemberPermissions = useStore((state) => state.updateMemberPermissions)
    const updateInvitePermissions = useStore((state) => state.updateInvitePermissions)
    const removeMember = useStore((state) => state.removeMember)
    const revokeInvite = useStore((state) => state.revokeInvite)

    const canManage = useProjectCan('member.manage')
    const [tab, setTab] = useState<'members' | 'invites'>('members')
    const [pending, setPending] = useState<Record<string, ProjectPermission[]>>({})
    const [pendingInvites, setPendingInvites] = useState<Record<string, ProjectPermission[]>>({})
    const [seed, setSeed] = useState(0)
    const [saving, setSaving] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        void fetchMembers(project.id)
        void fetchInvites(project.id)
    }, [project.id, fetchMembers, fetchInvites])

    const openRemove = useModalOpen<ProjectMember, ProjectMember>(MODAL.REMOVE_MEMBER, (member) => {
        if (member) void removeMember(project.id, member.id)
    })

    const tabBar = useTc<HTMLElement>({
        tabs: [
            { id: 'members', label: m.tabMembers(members.length), icon: 'users' },
            { id: 'invites', label: m.tabInvites(invites.length), icon: 'mail' },
        ],
        onChange: (id: string) => setTab(id === 'invites' ? 'invites' : 'members'),
    })

    const memberRows = useMemo(
        () =>
            members
                .map((member) => {
                    const role = member.isOwner
                        ? `<tc-badge variant="primary">${escapeHtml(m.owner)}</tc-badge>`
                        : `<tc-badge variant="secondary">${escapeHtml(m.memberWord)}</tc-badge>`
                    const permissionCell =
                        member.isOwner || !canManage
                            ? permissionSummary(member.isOwner ? PROJECT_PERMISSIONS : member.permissions, m)
                            : `<tc-extended-select multiple data-member="${escapeHtml(member.id)}" placeholder="${escapeHtml(
                                  m.readOnlyLabel
                              )}" search-placeholder="${escapeHtml(m.permissionSearch)}" max-height="220"></tc-extended-select>`
                    const remove =
                        member.isOwner || !canManage
                            ? ''
                            : `<tc-icon-button icon="UserMinus" variant="danger" size="small" outline data-action="remove" data-id="${escapeHtml(
                                  member.id
                              )}" label="${escapeHtml(m.remove)}" title="${escapeHtml(m.remove)}"></tc-icon-button>`
                    return [
                        '<tr>',
                        `<td><strong>${escapeHtml(member.name || member.email)}</strong></td>`,
                        `<td>${escapeHtml(member.email)}</td>`,
                        `<td>${role}</td>`,
                        `<td class="member-table__permissions">${permissionCell}</td>`,
                        `<td>${escapeHtml(formatDate(member.createdAt))}</td>`,
                        `<td style="text-align:right"><span class="table-actions">${remove}</span></td>`,
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [members, canManage, m]
    )

    const inviteRows = useMemo(
        () =>
            invites
                .map((invite) => {
                    const revoke = canManage
                        ? `<tc-icon-button icon="Trash2" variant="danger" size="small" outline data-action="revoke" data-id="${escapeHtml(
                              invite.id
                          )}" label="${escapeHtml(m.revoke)}" title="${escapeHtml(m.revoke)}"></tc-icon-button>`
                        : ''
                    return [
                        '<tr>',
                        `<td><strong>${escapeHtml(invite.email)}</strong></td>`,
                        `<td>${escapeHtml(invite.invitedBy || '—')}</td>`,
                        `<td class="member-table__permissions">${
                            canManage
                                ? `<tc-extended-select multiple data-invite="${escapeHtml(invite.id)}" placeholder="${escapeHtml(
                                      m.readOnlyLabel
                                  )}" search-placeholder="${escapeHtml(m.permissionSearch)}" max-height="220"></tc-extended-select>`
                                : permissionSummary(invite.permissions, m)
                        }</td>`,
                        `<td>${escapeHtml(formatDate(invite.createdAt))}</td>`,
                        `<td>${escapeHtml(formatDate(invite.expiresAt))}</td>`,
                        `<td style="text-align:right"><span class="table-actions">${revoke}</span></td>`,
                        '</tr>',
                    ].join('')
                })
                .join(''),
        [invites, canManage, m]
    )

    useEffect(() => {
        if (tab !== 'members') return
        const frame = requestAnimationFrame(() => {
            for (const member of members) {
                const element = document.querySelector<SelectElement>(
                    `tc-extended-select[data-member="${member.id}"]`
                )
                if (!element) continue
                wireSelect(element, pending[member.id] ?? member.permissions)
            }
        })
        return () => cancelAnimationFrame(frame)
    }, [tab, members, memberRows, seed, pending])

    useEffect(() => {
        if (tab !== 'invites') return
        const frame = requestAnimationFrame(() => {
            for (const invite of invites) {
                const element = document.querySelector<SelectElement>(
                    `tc-extended-select[data-invite="${invite.id}"]`
                )
                if (!element) continue
                wireSelect(element, pendingInvites[invite.id] ?? invite.permissions)
            }
        })
        return () => cancelAnimationFrame(frame)
    }, [tab, invites, inviteRows, seed, pendingInvites])

    const onRowAction = (action: string, id: string) => {
        if (action === 'remove') {
            const member = members.find((entry) => entry.id === id)
            if (member) openRemove(member)
            return
        }
        if (action === 'revoke') void revokeInvite(project.id, id)
    }

    const applyPermissionChange = (event: Event) => {
        const target = event.target as HTMLElement | null
        const memberId = target?.dataset?.member
        const inviteId = target?.dataset?.invite
        if (!memberId && !inviteId) return
        const detail = (event as CustomEvent<{ value: string[] }>).detail
        if (!detail || !Array.isArray(detail.value)) return
        const next = detail.value as ProjectPermission[]

        if (memberId) {
            const member = members.find((entry) => entry.id === memberId)
            setPending((current) => {
                const draft = { ...current }
                if (member && sameSet(member.permissions, next)) delete draft[memberId]
                else draft[memberId] = next
                return draft
            })
            return
        }

        const invite = invites.find((entry) => entry.id === inviteId)
        setPendingInvites((current) => {
            const draft = { ...current }
            if (invite && sameSet(invite.permissions, next)) delete draft[inviteId!]
            else draft[inviteId!] = next
            return draft
        })
    }

    useEffect(() => {
        const node = rootRef.current
        if (!node) return
        node.addEventListener('tc-change', applyPermissionChange)
        return () => node.removeEventListener('tc-change', applyPermissionChange)
    })

    const pendingIds = Object.keys(pending)
    const pendingInviteIds = Object.keys(pendingInvites)
    const dirtyCount = pendingIds.length + pendingInviteIds.length

    const saveChanges = async () => {
        if (saving || dirtyCount === 0) return
        setSaving(true)
        try {
            const [memberResults, inviteResults] = await Promise.all([
                Promise.all(
                    pendingIds.map(async (memberId) => ({
                        id: memberId,
                        ok: await updateMemberPermissions(project.id, memberId, pending[memberId]),
                    }))
                ),
                Promise.all(
                    pendingInviteIds.map(async (inviteId) => ({
                        id: inviteId,
                        ok: await updateInvitePermissions(project.id, inviteId, pendingInvites[inviteId]),
                    }))
                ),
            ])
            const failedMembers = memberResults.flatMap((result) => (result.ok ? [] : [result.id]))
            const failedInvites = inviteResults.flatMap((result) => (result.ok ? [] : [result.id]))
            setPending((current) =>
                Object.fromEntries(failedMembers.map((memberId) => [memberId, current[memberId]]))
            )
            setPendingInvites((current) =>
                Object.fromEntries(failedInvites.map((inviteId) => [inviteId, current[inviteId]]))
            )
        } finally {
            setSaving(false)
        }
    }

    const discardChanges = () => {
        setPending({})
        setPendingInvites({})
        setSeed((value) => value + 1)
    }

    return (
        <div className="module module-project-members" ref={rootRef}>
            <tc-tab-bar ref={tabBar} active-id={tab}></tc-tab-bar>

            {tab === 'members' && (
                <tc-panel bordered className="module-project-members__panel">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-text variant="muted">{m.rosterIntro}</tc-text>
                        <div>
                            <tc-empty-state icon="users" hidden={members.length > 0 || undefined}>
                                {m.emptyRoster}
                            </tc-empty-state>
                            <AdvancedTable
                                columns={[
                                    { key: 'name', label: m.colName, minWidth: '12rem' },
                                    { key: 'email', label: m.colEmail, minWidth: '14rem' },
                                    { key: 'role', label: m.colRole },
                                    { key: 'permissions', label: m.colPermissions, minWidth: '20rem' },
                                    { key: 'joined', label: m.colJoined, hideBelow: 'md' },
                                    { key: 'actions', label: '', align: 'right', minWidth: '4rem' },
                                ]}
                                rows={memberRows}
                                total={members.length}
                                offset={0}
                                limit={Math.max(members.length, 1)}
                                stickyLastColumn
                                onRowAction={onRowAction}
                            />
                        </div>
                    </tc-stack>
                </tc-panel>
            )}

            {tab === 'invites' && (
                <tc-panel bordered className="module-project-members__panel">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-text variant="muted">{m.invitesIntro}</tc-text>
                        <div>
                            <AdvancedTable
                                columns={[
                                    { key: 'email', label: m.colEmail, minWidth: '14rem' },
                                    { key: 'invitedBy', label: m.colInvitedBy, hideBelow: 'md' },
                                    { key: 'permissions', label: m.colPermissions, minWidth: '16rem' },
                                    { key: 'sent', label: m.colSent, hideBelow: 'md' },
                                    { key: 'expires', label: m.colExpires },
                                    { key: 'actions', label: '', align: 'right', minWidth: '4rem' },
                                ]}
                                rows={inviteRows}
                                total={invites.length}
                                offset={0}
                                limit={Math.max(invites.length, 1)}
                                stickyLastColumn
                                onRowAction={onRowAction}
                            />
                            <tc-empty-state icon="mail" hidden={invites.length > 0 || undefined}>
                                {m.emptyInvites}
                            </tc-empty-state>
                        </div>
                    </tc-stack>
                </tc-panel>
            )}

            <tc-section-card title={m.permissionsGuideTitle}>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{m.permissionsGuideIntro}</tc-text>

                    <dl className="member-permissions-guide">
                        {PROJECT_PERMISSIONS.map((permission) => (
                            <div key={permission} className="member-permissions-guide__row">
                                <dt>
                                    <tc-badge variant="secondary">{PROJECT_PERMISSION_LABELS[permission]}</tc-badge>
                                </dt>
                                <dd>{PROJECT_PERMISSION_HINTS[permission]}</dd>
                            </div>
                        ))}
                    </dl>

                    <tc-alert variant="info">{m.permissionsRecommendation}</tc-alert>
                    <tc-helper-text icon="ShieldCheck">{m.permissionsLeastPrivilege}</tc-helper-text>
                </tc-stack>
            </tc-section-card>

            <FloatingActionBar label={m.pendingChanges(dirtyCount)} visible={dirtyCount > 0}>
                <tc-button key="discard" variant="secondary" outline onClick={discardChanges}>
                    {m.discardChanges}
                </tc-button>
                <tc-button key="save" variant="primary" disabled={saving || undefined} onClick={saveChanges}>
                    {m.saveChanges}
                </tc-button>
            </FloatingActionBar>
        </div>
    )
}

export default ProjectMembers
