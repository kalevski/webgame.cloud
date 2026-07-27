import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan, { useResourceLimits } from 'hooks/useCan'
import { useLimitLock } from 'hooks/useLock'
import { useTc } from '@toolcase/web-components/react'
import { PROJECT_LIMIT_ENTITLEMENT } from 'configs/entitlements'
import LimitMeter from 'components/LimitMeter'
import LockedAction from 'components/LockedAction'
import { MODAL, useModalOpen } from 'modals'
import { CreateProjectResult } from 'modals/CreateProjectModal'
import { Project } from 'types'
import { formatDate } from 'helpers/dates'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const PAGE_SIZE = 6

const ProjectCard: React.FC<{ project: Project; onOpen: () => void; onDelete: () => void }> = ({
    project,
    onOpen,
    onDelete,
}) => {
    const { t } = useStrings()
    const p = t.projects

    const ageDays = useMemo(
        () => Math.max(0, Math.floor((Date.now() - new Date(project.createdAt).getTime()) / MS_PER_DAY)),
        [project.createdAt]
    )
    const shared = project.visibility === 'shared'

    const scoring = useTc<HTMLElement>({
        rules: [
            {
                icon: 'ListTodo',
                title: p.statTasksTitle,
                description: p.statTasksDesc,
                points: String(project.taskCount),
                accent: 'cyan',
            },
            {
                icon: 'Calendar',
                title: p.statAgeTitle,
                description: p.statAgeDesc,
                points: String(ageDays),
                suffix: 'd',
                accent: 'yellow',
            },
            {
                icon: shared ? 'Users' : 'Lock',
                title: p.statVisibilityTitle,
                description: shared ? p.statVisibilitySharedDesc : p.statVisibilityPrivateDesc,
                points: shared ? p.sharedBadge : p.privateBadge,
                accent: shared ? 'green' : 'pink',
            },
        ],
    })

    return (
        <tc-card className="project-card" onClick={onOpen}>
            <div slot="header" className="project-card__header">
                <tc-icon-badge glyph="FolderKanban"></tc-icon-badge>
                <span className="project-card__name">{project.name}</span>
                <tc-badge
                    className="project-card__visibility"
                    variant={shared ? 'success' : 'secondary'}
                    text={shared ? p.sharedBadge : p.privateBadge}
                    pill
                ></tc-badge>
            </div>

            {project.description ? (
                <tc-text variant="muted" size="sm">{project.description}</tc-text>
            ) : (
                <tc-text variant="muted" size="sm" className="project-card__no-description">{p.noDescription}</tc-text>
            )}

            <tc-scoring-rules ref={scoring} className="project-card__stats"></tc-scoring-rules>

            <div slot="footer" className="project-card__footer">
                <tc-text variant="muted" size="sm">{p.updatedAt(formatDate(project.updatedAt))}</tc-text>
                <tc-button
                    size="sm"
                    variant="danger"
                    outline
                    onClick={(event: React.MouseEvent) => {
                        event.stopPropagation()
                        onDelete()
                    }}
                >
                    {p.delete}
                </tc-button>
            </div>
        </tc-card>
    )
}

const ProjectList: React.FC = () => {
    const navigate = useNavigate()
    const { t } = useStrings()
    const p = t.projects
    const projects = useStore((state) => state.projects)
    const fetchProjects = useStore((state) => state.fetchProjects)
    const createProject = useStore((state) => state.createProject)
    const deleteProject = useStore((state) => state.deleteProject)
    const canWrite = useCan('project.write')

    useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    const limits = useResourceLimits()
    const used = projects.length
    const reached = limits.projects !== null && used >= limits.projects
    const lock = useLimitLock(reached, PROJECT_LIMIT_ENTITLEMENT)

    const openCreate = useModalOpen<CreateProjectResult>(MODAL.CREATE_PROJECT, async (result) => {
        if (result) await createProject(result)
    })

    const openConfirmDelete = useModalOpen<Project, Project>(MODAL.CONFIRM_DELETE_PROJECT, async (confirmed) => {
        if (confirmed) await deleteProject(confirmed.id)
    })

    const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE))
    const [page, setPage] = useState(1)

    const currentPage = Math.min(page, totalPages)
    const pageProjects = projects.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    const pagination = useTc<HTMLElement>(
        {},
        { 'tc-page-change': (event: Event) => setPage((event as CustomEvent<{ page: number }>).detail.page) }
    )

    return (
        <div className="module module-projects">
            <tc-rich-page-header
                className="module-projects__header"
                title-text={p.title}
                description={t.pages.projectsDescription}
                icon-name="FolderKanban"
                icon-color="violet"
            >
                <div slot="chips">
                    <LimitMeter used={used} limit={limits.projects} noun="projects" resource="projects" onUpgrade={lock.open} />
                </div>
                {canWrite && (
                    <div slot="actions">
                        <LockedAction lock={lock} onClick={() => openCreate()}>
                            <tc-button variant="primary">{p.newProject}</tc-button>
                        </LockedAction>
                    </div>
                )}
            </tc-rich-page-header>

            {projects.length === 0 ? (
                <tc-empty-state heading={p.empty} icon="folder-kanban">
                    {canWrite && (
                        <tc-button slot="action" variant="primary" onClick={() => openCreate()}>{p.newProject}</tc-button>
                    )}
                </tc-empty-state>
            ) : (
                <>
                    <tc-grid columns={1} columns-md={2} columns-lg={3} gap="1.5rem">
                        {pageProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onOpen={() => navigate(`/projects/${project.id}`)}
                                onDelete={() => openConfirmDelete(project)}
                            />
                        ))}
                    </tc-grid>

                    {totalPages > 1 && (
                        <div className="module-projects__pager">
                            <tc-pagination
                                ref={pagination}
                                total={totalPages}
                                current={currentPage}
                                align="center"
                            ></tc-pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default ProjectList
