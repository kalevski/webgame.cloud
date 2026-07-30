import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { formatBytes } from 'helpers/format'
import { formatDateTime } from 'helpers/dates'

type Fact = {
    label: string
    value: string
}

const ProjectAdminDetail: React.FC = () => {
    const { t } = useStrings()
    const p = t.projectsAdmin
    const { id } = useParams()
    const navigate = useNavigate()

    const project = useStore((state) => state.adminProject)
    const fetchAdminProject = useStore((state) => state.fetchAdminProject)
    const clearAdminProject = useStore((state) => state.clearAdminProject)

    const canMove = useCan('admin.project.move')
    const canReadUsers = useCan('admin.user.read')

    const openMove = useModalOpen<boolean, string>(MODAL.MOVE_PROJECT, (moved) => {
        if (moved && id) void fetchAdminProject(id)
    })

    useEffect(() => {
        if (!id) return
        void fetchAdminProject(id)
        return () => clearAdminProject()
    }, [id, fetchAdminProject, clearAdminProject])

    if (!project) {
        return (
            <div className="module module-project-admin-detail">
                <tc-empty-state icon="folder">{p.loading}</tc-empty-state>
            </div>
        )
    }

    const facts: Fact[] = [
        { label: p.detailId, value: project.id },
        { label: p.detailOwner, value: `${project.ownerName || project.ownerEmail} · ${project.ownerEmail}` },
        { label: p.detailRealm, value: project.realmName || p.noRealm },
        { label: p.detailCreated, value: formatDateTime(project.createdAt) },
        { label: p.detailUpdated, value: formatDateTime(project.updatedAt) },
    ]

    return (
        <div className="module module-project-admin-detail">
            <div className="module-project-admin-detail__actions">
                <tc-button variant="secondary" outline onClick={() => navigate('/platform/projects')}>
                    {p.backToList}
                </tc-button>
                {canMove && (
                    <tc-button variant="secondary" outline onClick={() => openMove(project.id)}>
                        {p.move}
                    </tc-button>
                )}
                {canReadUsers && (
                    <tc-button
                        variant="secondary"
                        outline
                        onClick={() => navigate(`/platform/users/${project.ownerId}`)}
                    >
                        {p.viewOwner}
                    </tc-button>
                )}
            </div>

            <tc-section-card title={project.name}>
                <tc-stack direction="column" gap="0.85rem">
                    <div className="module-project-admin-detail__badges">
                        <tc-badge variant="primary">{project.appType}</tc-badge>
                        {project.archivedAt && <tc-badge variant="secondary">{p.archivedBadge}</tc-badge>}
                        {project.locked && <tc-badge variant="warning">{p.lockedBadge}</tc-badge>}
                    </div>

                    <tc-text variant="muted">{project.description || p.noDescription}</tc-text>

                    <tc-metric-grid columns="4">
                        <tc-metric-tile label={p.detailMembers} value={String(project.memberCount)}></tc-metric-tile>
                        <tc-metric-tile label={p.detailAssets} value={String(project.assetCount)}></tc-metric-tile>
                        <tc-metric-tile label={p.detailBuilds} value={String(project.buildCount)}></tc-metric-tile>
                        <tc-metric-tile
                            label={p.detailStorage}
                            value={formatBytes(project.storageBytes)}
                        ></tc-metric-tile>
                    </tc-metric-grid>

                    <dl className="module-project-admin-detail__facts">
                        {facts.map((fact) => (
                            <div key={fact.label} className="module-project-admin-detail__fact">
                                <dt>{fact.label}</dt>
                                <dd>{fact.value}</dd>
                            </div>
                        ))}
                    </dl>
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default ProjectAdminDetail
