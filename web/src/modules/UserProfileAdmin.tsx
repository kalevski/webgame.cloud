import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { ManageAccessInput, ManageAccessResult } from 'modals/ManageAccessModal'
import AdvancedTable from 'components/AdvancedTable'
import usePageTabs from 'hooks/usePageTabs'
import { ProjectColumnKey, projectColumns, projectRow } from 'helpers/platformTables'
import { formatBytes } from 'helpers/format'
import { formatDate, formatDateTime } from 'helpers/dates'
import { OAUTH_PROVIDER_LABELS, OWNER_ROLE_ID, RESOURCE_LABELS, User } from 'types'

const TABS = ['profile', 'projects', 'activity'] as const

type ProfileTab = (typeof TABS)[number]

const PROJECT_COLUMN_KEYS: ProjectColumnKey[] = [
    'name',
    'standing',
    'type',
    'realm',
    'members',
    'assets',
    'builds',
    'storage',
    'created',
    'actions',
]

const UserProfileAdmin: React.FC = () => {
    const { t } = useStrings()
    const u = t.userProfilesAdmin
    const { id, tab } = useParams()
    const navigate = useNavigate()

    const activeTab: ProfileTab = TABS.includes(tab as ProfileTab) ? (tab as ProfileTab) : 'profile'

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

    const tabs = profile
        ? [
            { id: 'profile', label: u.tabProfile, href: `/platform/users/${profile.user.id}` },
            {
                id: 'projects',
                label: u.tabProjects(profile.projects.length),
                href: `/platform/users/${profile.user.id}/projects`,
            },
            {
                id: 'activity',
                label: u.tabActivity(profile.activity.length),
                href: `/platform/users/${profile.user.id}/activity`,
            },
        ]
        : []

    usePageTabs(tabs)

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
        { label: u.labelEmail, value: user.email, mono: true },
        { label: u.labelJoined, value: formatDate(user.createdAt), mono: true },
        { label: u.labelVerified, value: user.verified ? u.yes : u.no },
        { label: u.labelConsent, value: user.consentedAt ? formatDate(user.consentedAt) : u.never, mono: true },
        { label: u.labelSessions, value: String(profile.sessionCount), mono: true },
        {
            label: u.labelLastSeen,
            value: profile.lastSeenAt ? formatDateTime(profile.lastSeenAt) : u.never,
            mono: true,
        },
        { label: u.labelStorage, value: formatBytes(profile.storageBytes), mono: true },
        {
            label: u.labelProviders,
            value: profile.identities.length
                ? profile.identities.map((identity) => OAUTH_PROVIDER_LABELS[identity.provider]).join(', ')
                : u.noProviders,
        },
    ]

    const owned = profile.projects.filter((project) => project.ownerId === user.id)
    const assetTotal = profile.projects.reduce((sum, project) => sum + project.assetCount, 0)

    const projectTableColumns = projectColumns(t.projectsAdmin, PROJECT_COLUMN_KEYS)
    const projectRows = profile.projects
        .map((project) => projectRow(project, t.projectsAdmin, PROJECT_COLUMN_KEYS, { viewerId: user.id }))
        .join('')

    return (
        <div className="module module-user-profile-admin">
            <tc-rich-page-header
                title-text={user.name || user.email}
                sub={user.name ? user.email : undefined}
                icon-name="UserRound"
                icon-color="blue"
            >
                <span slot="chips">
                    <tc-badge variant="primary" text={profile.roleName}></tc-badge>
                    <tc-badge
                        variant={user.active ? 'success' : 'danger'}
                        text={user.active ? u.active : u.inactive}
                    ></tc-badge>
                    <tc-badge
                        variant="secondary"
                        text={u.permissionCount(profile.permissions.length)}
                    ></tc-badge>
                </span>

                <span slot="actions" className="platform-detail__actions">
                    <tc-button variant="secondary" outline onClick={() => navigate('/platform/users')}>
                        <span>{u.backToList}</span>
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
                            <span>{t.usersAdmin.manageAccess}</span>
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
                            <span>{user.active ? t.usersAdmin.deactivate : t.usersAdmin.activate}</span>
                        </tc-button>
                    )}
                    {canImpersonate && !self && user.active && (
                        <tc-button variant="secondary" outline onClick={() => openImpersonate(user)}>
                            <span>{t.usersAdmin.loginAs}</span>
                        </tc-button>
                    )}
                    {canReadAudit && (
                        <tc-button
                            variant="secondary"
                            outline
                            onClick={() => navigate(`/moderation/audit?actor=${encodeURIComponent(user.id)}`)}
                        >
                            <span>{u.viewAudit}</span>
                        </tc-button>
                    )}
                </span>
            </tc-rich-page-header>

            {activeTab === 'profile' && (
                <div className="console-section">
                    <tc-metric-grid columns="4">
                        <tc-metric-tile label={u.metricOwned} value={String(owned.length)}></tc-metric-tile>
                        <tc-metric-tile
                            label={u.metricJoined}
                            value={String(profile.projects.length - owned.length)}
                        ></tc-metric-tile>
                        <tc-metric-tile label={u.metricAssets} value={String(assetTotal)}></tc-metric-tile>
                        <tc-metric-tile
                            label={u.metricStorage}
                            value={formatBytes(profile.storageBytes)}
                        ></tc-metric-tile>
                    </tc-metric-grid>

                    <tc-section-card title={u.sectionIdentity} icon="IdCard">
                        <dl className="platform-facts">
                            {facts.map((fact) => (
                                <div key={fact.label} className="platform-facts__fact">
                                    <dt>{fact.label}</dt>
                                    <dd className={fact.mono ? 'platform-mono' : undefined}>{fact.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </tc-section-card>

                    <tc-section-card title={u.sectionUsage} icon="Gauge">
                        <ul className="platform-meters">
                            {profile.usage.map((entry) => {
                                const ratio =
                                    entry.limit === null || entry.limit === 0
                                        ? 0
                                        : Math.min(1, entry.used / entry.limit)
                                const level =
                                    entry.limit === null
                                        ? 'none'
                                        : entry.reached
                                          ? 'full'
                                          : ratio >= 0.6
                                            ? 'high'
                                            : 'ok'

                                return (
                                    <li key={entry.resource} className="platform-meters__row" data-level={level}>
                                        <span className="platform-meters__label">
                                            {RESOURCE_LABELS[entry.resource]}
                                        </span>
                                        <span className="platform-meters__value">
                                            {entry.limit === null
                                                ? `${entry.used} · ${u.unlimited}`
                                                : `${entry.used} / ${entry.limit}`}
                                        </span>
                                        <span className="platform-meters__track" aria-hidden="true">
                                            <span
                                                className="platform-meters__fill"
                                                style={{ width: `${Math.round(ratio * 100)}%` }}
                                            />
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </tc-section-card>
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="module-user-profile-admin__table">
                    <AdvancedTable
                        columns={projectTableColumns}
                        rows={projectRows}
                        total={profile.projects.length}
                        offset={0}
                        limit={profile.projects.length || 1}
                        stickyLastColumn
                        onRowAction={(action, projectId) => {
                            if (action === 'open' && canReadProjects) {
                                navigate(`/platform/projects/${projectId}`)
                            }
                        }}
                    />

                    {profile.projects.length === 0 && (
                        <tc-empty-state icon="folder">{u.noProjects}</tc-empty-state>
                    )}
                </div>
            )}

            {activeTab === 'activity' && (
                <tc-section-card title={u.sectionActivity} icon="History">
                    <div className="platform-log">
                        {profile.activity.length === 0 ? (
                            <tc-empty-state icon="history">{u.noActivity}</tc-empty-state>
                        ) : (
                            profile.activity.map((entry) => (
                                <div key={entry.id} className="platform-log__row">
                                    <time className="platform-log__when">{formatDateTime(entry.createdAt)}</time>
                                    <span className="platform-log__action">{entry.action}</span>
                                    {entry.detail && <span className="platform-log__detail">{entry.detail}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </tc-section-card>
            )}
        </div>
    )
}

export default UserProfileAdmin
