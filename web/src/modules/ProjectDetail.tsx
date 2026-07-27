import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import Loading from 'components/Loading'
import RouteTabs from 'components/RouteTabs'
import ProjectRoadmap from 'modules/ProjectRoadmap'
import ProjectSettings from 'modules/ProjectSettings'

type ProjectTab = 'roadmap' | 'settings'

const ProjectDetail: React.FC = () => {
    const { id, tab: tabParam } = useParams()
    const { t } = useStrings()
    const p = t.projects
    const projects = useStore((state) => state.projects)
    const fetchProjects = useStore((state) => state.fetchProjects)
    const tasksByProject = useStore((state) => state.tasksByProject)
    const fetchTasks = useStore((state) => state.fetchTasks)

    useEffect(() => {
        if (!projects.length) fetchProjects()
    }, [projects.length, fetchProjects])

    useEffect(() => {
        if (id) fetchTasks(id)
    }, [id, fetchTasks])

    const project = projects.find((entry) => entry.id === id)
    if (!id || !project) return <Loading />

    const tasks = tasksByProject[id] ?? []

    const tabs = [
        { id: 'roadmap', label: p.tabRoadmap, icon: 'ListChecks', path: `/projects/${id}/roadmap` },
        { id: 'settings', label: p.tabSettings, icon: 'Settings', path: `/projects/${id}/settings` },
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : available[0]) as ProjectTab

    return (
        <div className="module module-project-detail">
            <tc-rich-page-header
                className="module-project-detail__header"
                title-text={project.name}
                description={project.description || undefined}
                icon-name="ListChecks"
                icon-color="cyan"
            >
                <div slot="chips">
                    <tc-badge
                        variant={project.visibility === 'shared' ? 'success' : 'secondary'}
                        text={project.visibility === 'shared' ? p.sharedBadge : p.privateBadge}
                        pill
                    ></tc-badge>
                    <tc-badge variant="secondary" text={p.taskCount(tasks.length)} pill></tc-badge>
                </div>
            </tc-rich-page-header>

            <RouteTabs tabs={tabs} activeId={tab} replace />

            {tab === 'roadmap' && <ProjectRoadmap key={project.id} project={project} />}
            {tab === 'settings' && <ProjectSettings key={project.id} project={project} />}
        </div>
    )
}

export default ProjectDetail
