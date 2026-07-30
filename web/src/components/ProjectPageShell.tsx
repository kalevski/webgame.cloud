import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { useStore } from 'state'
import Loading from 'components/Loading'
import ProjectLockBanner from 'modules/ProjectLockBanner'
import ProjectHeader from 'modules/ProjectHeader'
import ProjectPipeline from 'modules/ProjectPipeline'
import { Project } from 'types'

type Props = {
    title: string
    subline?: (project: Project) => React.ReactNode
    description?: string
    iconName?: string
    iconColor?: string
    action?: (project: Project) => React.ReactNode
    pipeline?: boolean
    children: (project: Project) => React.ReactNode
}

const ProjectPageShell: React.FC<Props> = ({
    title,
    subline,
    description,
    iconName,
    iconColor,
    action,
    pipeline = true,
    children,
}) => {
    const { id } = useParams()
    const projects = useStore((state) => state.projects)
    const projectsLoaded = useStore((state) => state.projectsLoaded)
    const fetchProjects = useStore((state) => state.fetchProjects)
    const setActiveProject = useStore((state) => state.setActiveProject)
    const activeProjectId = useStore((state) => state.activeProjectId)

    useEffect(() => {
        if (!projectsLoaded) void fetchProjects()
    }, [projectsLoaded, fetchProjects])

    useEffect(() => {
        if (id && id !== activeProjectId) setActiveProject(id)
    }, [id, activeProjectId, setActiveProject])

    const project = projects.find((entry) => entry.id === id)
    if (!id || !project) return <Loading />

    return (
        <section className="project-page">
            <ProjectLockBanner projectId={project.id} />

            <ProjectHeader
                title={title}
                subline={subline?.(project)}
                description={description}
                action={action?.(project)}
                project={project}
                iconName={iconName}
                iconColor={iconColor}
            />

            {pipeline && <ProjectPipeline project={project} />}

            <div className="console-section">{children(project)}</div>
        </section>
    )
}

export default ProjectPageShell
