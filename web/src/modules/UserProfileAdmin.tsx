import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { ManageAccessInput, ManageAccessResult } from 'modals/ManageAccessModal'
import { formatBytes } from 'helpers/format'
import { formatDate, formatDateTime } from 'helpers/dates'
import { OAUTH_PROVIDER_LABELS, OWNER_ROLE_ID, RESOURCE_LABELS, User } from 'types'

const UserProfileAdmin: React.FC = () => {
    const { t } = useStrings()
    const u = t.userProfilesAdmin
    const { id } = useParams()
    const navigate = useNavigate()

    const me = useStore((state) => state.me)
    const profile = useStore((state) => state.userProfile)
    const loading = useStore((state) => state.userProfileLoading)
    const fetchUserProfile = useStore((state) => state.fetchUserProfile)
    const clearUserProfile = useStore((state) => state.clearUserProfile)
    const updateUser = useStore((state) => state.updateUser)
    const saveUserAccess = useStore((state) => state.saveUserAccess)
    const impersonateUser = useStore((state) => state.impersonateUser)
    const users = useStore((state) => state.users)
    const fetchUsers = useStore((state) => state.fetchUsers)

    const canWriteAccess = useCan('admin.user.role.write')
    const canImpersonate = useCan('admin.user.impersonate')
    const canReadAudit = useCan('audit.read')
    const canReadProjects = useCan('admin.project.read')

    const pending = useRef<string | null>(null)

    const openAccessModal = useModalOpen<ManageAccessResult, ManageAccessInput>(
        MODAL.MANAGE_ACCESS,
        async (result) => {
            if (!result || !pending.current) return
            const userId = pending.current
            const { overrides, ...account } = result
            const saved = await updateUser(userId, account)
            if (saved) await saveUserAccess(userId, overrides)
            pending.current = null
            void fetchUserProfile(userId)
        }
    )

    const openImpersonate = useModalOpen<User, User>(MODAL.IMPERSONATE_USER, async (confirmed) => {
        if (confirmed) await impersonateUser(confirmed.id)
    })

    useEffect(() => {
        if (!id) return
        void fetchUserProfile(id)
        return () => clearUserProfile()
    }, [id, fetchUserProfile, clearUserProfile])

    useEffect(() => {
        void fetchUsers()
    }, [fetchUsers])

    if (!profile) {
        return (
            <div className="module module-user-profile-admin">
                <tc-empty-state icon="user">{loading ? u.loading : u.empty}</tc-empty-state>
            </div>
        )
    }

    const user = profile.user
    const self = user.id === me?.id
    const activeOwners = users.filter((entry) => entry.role === OWNER_ROLE_ID && entry.active).length

    const facts = [
        { label: u.labelEmail, value: user.email },
        { label: u.labelRole, value: profile.roleName },
        { label: u.labelStatus, value: user.active ? u.active : u.inactive },
        { label: u.labelVerified, value: user.verified ? u.yes : u.no },
        { label: u.labelJoined, value: formatDate(user.createdAt) },
        { label: u.labelConsent, value: user.consentedAt ? formatDate(user.consentedAt) : u.never },
        { label: u.labelSessions, value: String(profile.sessionCount) },
        { label: u.labelLastSeen, value: profile.lastSeenAt ? formatDateTime(profile.lastSeenAt) : u.never },
        { label: u.labelStorage, value: formatBytes(profile.storageBytes) },
        {
            label: u.labelProviders,
            value: profile.identities.length
                ? profile.identities.map((identity) => OAUTH_PROVIDER_LABELS[identity.provider]).join(', ')
                : u.noProviders,
        },
    ]

    return (
        <div className="module module-user-profile-admin">
            <div className="module-user-profile-admin__actions">
                <tc-button variant="secondary" outline onClick={() => navigate('/platform/users')}>
                    {u.backToList}
                </tc-button>
                {canWriteAccess && !self && (
                    <tc-button
                        variant="primary"
                        outline
                        onClick={() => {
                            pending.current = user.id
                            openAccessModal({ user, activeOwners, clientCount: 0 })
                        }}
                    >
                        {t.usersAdmin.manageAccess}
                    </tc-button>
                )}
                {canWriteAccess && !self && (
                    <tc-button
                        variant={user.active ? 'danger' : 'success'}
                        outline
                        onClick={async () => {
                            const saved = await updateUser(user.id, { active: !user.active })
                            if (saved) void fetchUserProfile(user.id)
                        }}
                    >
                        {user.active ? t.usersAdmin.deactivate : t.usersAdmin.activate}
                    </tc-button>
                )}
                {canImpersonate && !self && user.active && (
                    <tc-button variant="secondary" outline onClick={() => openImpersonate(user)}>
                        {t.usersAdmin.loginAs}
                    </tc-button>
                )}
                {canReadAudit && (
                    <tc-button
                        variant="secondary"
                        outline
                        onClick={() => navigate(`/moderation/audit?actor=${encodeURIComponent(user.id)}`)}
                    >
                        {u.viewAudit}
                    </tc-button>
                )}
            </div>

            <tc-section-card title={user.name || user.email}>
                <tc-stack direction="column" gap="0.85rem">
                    <div className="module-user-profile-admin__badges">
                        <tc-badge variant="primary">{profile.roleName}</tc-badge>
                        <tc-badge variant={user.active ? 'success' : 'danger'}>
                            {user.active ? u.active : u.inactive}
                        </tc-badge>
                        <tc-badge variant="secondary">{u.permissionCount(profile.permissions.length)}</tc-badge>
                    </div>

                    <dl className="module-user-profile-admin__facts">
                        {facts.map((fact) => (
                            <div key={fact.label} className="module-user-profile-admin__fact">
                                <dt>{fact.label}</dt>
                                <dd>{fact.value}</dd>
                            </div>
                        ))}
                    </dl>
                </tc-stack>
            </tc-section-card>

            <tc-section-card title={u.sectionUsage}>
                <tc-metric-grid columns="3">
                    {profile.usage.map((entry) => (
                        <tc-metric-tile
                            key={entry.resource}
                            label={RESOURCE_LABELS[entry.resource]}
                            value={entry.limit === null ? String(entry.used) : `${entry.used} / ${entry.limit}`}
                            hint={entry.limit === null ? u.unlimited : undefined}
                        ></tc-metric-tile>
                    ))}
                </tc-metric-grid>
            </tc-section-card>

            <tc-section-card title={u.sectionProjects}>
                <tc-stack direction="column" gap="0.5rem">
                    {profile.projects.length === 0 && (
                        <tc-empty-state icon="folder">{u.noProjects}</tc-empty-state>
                    )}
                    {profile.projects.map((project) => (
                        <div key={project.id} className="module-user-profile-admin__row">
                            <tc-badge variant={project.owner ? 'primary' : 'secondary'}>
                                {project.owner ? u.ownerBadge : u.memberBadge}
                            </tc-badge>
                            <tc-text>{project.name}</tc-text>
                            {project.archived && <tc-badge variant="secondary">{u.archivedBadge}</tc-badge>}
                            {canReadProjects && (
                                <tc-button
                                    variant="secondary"
                                    size="small"
                                    outline
                                    onClick={() => navigate(`/platform/projects/${project.id}`)}
                                >
                                    {u.openProject}
                                </tc-button>
                            )}
                        </div>
                    ))}
                </tc-stack>
            </tc-section-card>

            <tc-section-card title={u.sectionActivity}>
                <tc-stack direction="column" gap="0.35rem">
                    {profile.activity.length === 0 && (
                        <tc-empty-state icon="history">{u.noActivity}</tc-empty-state>
                    )}
                    {profile.activity.map((entry) => (
                        <div key={entry.id} className="module-user-profile-admin__row">
                            <tc-badge variant="secondary">{entry.action}</tc-badge>
                            <tc-text variant="muted">{formatDateTime(entry.createdAt)}</tc-text>
                            {entry.detail && <tc-text variant="muted">{entry.detail}</tc-text>}
                        </div>
                    ))}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default UserProfileAdmin
