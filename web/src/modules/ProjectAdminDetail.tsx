import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import AdvancedTable from 'components/AdvancedTable'
import RouteTabs from 'components/RouteTabs'
import { PersonColumnKey, personColumns, personRow } from 'helpers/platformTables'
import { toIconName } from 'helpers/icons'
import { formatBytes } from 'helpers/format'
import { formatDateTime } from 'helpers/dates'

type Fact = {
    label: string
    value: string
    mono?: boolean
}

type AccentStyle = React.CSSProperties & { '--project-accent': string }

const TABS = ['overview', 'members'] as const

type ProjectTab = (typeof TABS)[number]

const MEMBER_COLUMN_KEYS: PersonColumnKey[] = [
    'name',
    'email',
    'standing',
    'role',
    'status',
    'joined',
    'actions',
]

const ProjectAdminDetail: React.FC = () => {
    const { t } = useStrings()
    const p = t.projectsAdmin
    const { id, tab } = useParams()
    const navigate = useNavigate()

    const activeTab: ProjectTab = TABS.includes(tab as ProjectTab) ? (tab as ProjectTab) : 'overview'

    const project = useStore((state) => state.adminProject)
    const members = useStore((state) => state.adminProjectMembers)
    const membersLoading = useStore((state) => state.adminProjectMembersLoading)
    const fetchAdminProject = useStore((state) => state.fetchAdminProject)
    const fetchAdminProjectMembers = useStore((state) => state.fetchAdminProjectMembers)
    const clearAdminProject = useStore((state) => state.clearAdminProject)

    const canMove = useCan('admin.project.move')
    const canReadUsers = useCan('admin.user.read')

    const openMove = useModalOpen<boolean, string>(MODAL.MOVE_PROJECT, (moved) => {
        if (moved && id) void fetchAdminProject(id)
    })

    useEffect(() => {
        if (!id) return
        void fetchAdminProject(id)
        void fetchAdminProjectMembers(id)
        return () => clearAdminProject()
    }, [id, fetchAdminProject, fetchAdminProjectMembers, clearAdminProject])

    if (!project) {
        return (
            <div className="module module-project-admin-detail">
                <tc-empty-state icon="folder">{p.loading}</tc-empty-state>
            </div>
        )
    }

    const placement: Fact[] = [
        { label: p.detailRealm, value: project.realmName || p.noRealm, mono: Boolean(project.realmName) },
        { label: p.detailState, value: project.locked ? p.stateMigrating : p.stateSettled },
        { label: p.detailOwner, value: project.ownerName || project.ownerEmail },
        { label: p.detailOwnerEmail, value: project.ownerEmail, mono: true },
    ]

    const record: Fact[] = [
        { label: p.detailId, value: project.id, mono: true },
        { label: p.detailCreated, value: formatDateTime(project.createdAt), mono: true },
        { label: p.detailUpdated, value: formatDateTime(project.updatedAt), mono: true },
        ...(project.archivedAt
            ? [{ label: p.detailArchived, value: formatDateTime(project.archivedAt), mono: true }]
            : []),
    ]

    const tabs = [
        { id: 'overview', label: p.tabOverview, icon: 'gauge', path: `/platform/projects/${project.id}` },
        {
            id: 'members',
            label: p.tabMembers(project.memberCount),
            icon: 'users',
            path: `/platform/projects/${project.id}/members`,
        },
    ]

    const memberColumns = personColumns(t.usersAdmin, p, MEMBER_COLUMN_KEYS)
    const memberRows = members
        .map((member) =>
            personRow(
                {
                    id: member.userId,
                    name: member.name,
                    email: member.email,
                    verified: member.verified,
                    active: member.active,
                    roleName: member.roleName,
                    joinedAt: member.joinedAt,
                    isOwner: member.isOwner,
                    permissionCount: member.permissions.length,
                },
                t.usersAdmin,
                p,
                MEMBER_COLUMN_KEYS,
                t.userProfilesAdmin.open
            )
        )
        .join('')

    return (
        <div
            className="module module-project-admin-detail"
            style={{ '--project-accent': project.color || '#7c3aed' } as AccentStyle}
        >
            <tc-rich-page-header
                title-text={project.name}
                sub={project.ownerName || project.ownerEmail}
                description={project.description || p.noDescription}
                icon-name={toIconName(project.icon || 'folder')}
                icon-color="violet"
            >
                <span slot="chips">
                    <tc-badge variant="primary" text={project.appType}></tc-badge>
                    {project.archivedAt && <tc-badge variant="secondary" text={p.archivedBadge}></tc-badge>}
                    {project.locked && <tc-badge variant="warning" text={p.lockedBadge}></tc-badge>}
                </span>

                <span slot="actions" className="platform-detail__actions">
                    <tc-button variant="secondary" outline onClick={() => navigate('/platform/projects')}>
                        <span>{p.backToList}</span>
                    </tc-button>
                    {canMove && (
                        <tc-button variant="primary" outline onClick={() => openMove(project.id)}>
                            <span>{p.move}</span>
                        </tc-button>
                    )}
                    {canReadUsers && (
                        <tc-button
                            variant="secondary"
                            outline
                            onClick={() => navigate(`/platform/users/${project.ownerId}`)}
                        >
                            <span>{p.viewOwner}</span>
                        </tc-button>
                    )}
                </span>
            </tc-rich-page-header>

            <RouteTabs tabs={tabs} activeId={activeTab} />

            {activeTab === 'overview' && (
                <div className="console-section">
                    <tc-metric-grid columns="4">
                        <tc-metric-tile
                            label={p.detailMembers}
                            value={String(project.memberCount)}
                        ></tc-metric-tile>
                        <tc-metric-tile label={p.detailAssets} value={String(project.assetCount)}></tc-metric-tile>
                        <tc-metric-tile label={p.detailBuilds} value={String(project.buildCount)}></tc-metric-tile>
                        <tc-metric-tile
                            label={p.detailStorage}
                            value={formatBytes(project.storageBytes)}
                        ></tc-metric-tile>
                    </tc-metric-grid>

                    <div className="module-project-admin-detail__panels">
                        <tc-section-card title={p.sectionPlacement} icon="Server">
                            <dl className="platform-facts platform-facts--single">
                                {placement.map((fact) => (
                                    <div key={fact.label} className="platform-facts__fact">
                                        <dt>{fact.label}</dt>
                                        <dd className={fact.mono ? 'platform-mono' : undefined}>{fact.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </tc-section-card>

                        <tc-section-card title={p.sectionRecord} icon="FileText">
                            <dl className="platform-facts platform-facts--single">
                                {record.map((fact) => (
                                    <div key={fact.label} className="platform-facts__fact">
                                        <dt>{fact.label}</dt>
                                        <dd className={fact.mono ? 'platform-mono' : undefined}>{fact.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </tc-section-card>
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="module-project-admin-detail__table">
                    <AdvancedTable
                        columns={memberColumns}
                        rows={memberRows}
                        total={members.length}
                        offset={0}
                        limit={members.length || 1}
                        loading={membersLoading}
                        stickyLastColumn
                        onRowAction={(action, userId) => {
                            if (action === 'open' && canReadUsers) navigate(`/platform/users/${userId}`)
                        }}
                    />

                    {!membersLoading && members.length === 0 && (
                        <tc-empty-state icon="users">{p.noMembers}</tc-empty-state>
                    )}
                </div>
            )}
        </div>
    )
}

export default ProjectAdminDetail
