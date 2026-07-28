import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import Loading from 'components/Loading'
import ProjectOnboarding from 'modules/ProjectOnboarding'

const ActiveProjectRedirect: React.FC = () => {
    const navigate = useNavigate()
    const projects = useStore((state) => state.projects)
    const projectsLoaded = useStore((state) => state.projectsLoaded)
    const activeProjectId = useStore((state) => state.activeProjectId)
    const fetchProjects = useStore((state) => state.fetchProjects)

    useEffect(() => {
        if (!projectsLoaded) void fetchProjects()
    }, [projectsLoaded, fetchProjects])

    useEffect(() => {
        if (!projectsLoaded) return
        const target = activeProjectId ?? projects[0]?.id
        if (target) navigate(`/projects/${target}/assets`, { replace: true })
    }, [projectsLoaded, activeProjectId, projects, navigate])

    if (!projectsLoaded) return <Loading />
    if (projects.length === 0) return <ProjectOnboarding />
    return <Loading />
}

export default ActiveProjectRedirect
