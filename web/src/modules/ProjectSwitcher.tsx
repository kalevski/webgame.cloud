import React, { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { useStore } from 'state'
import useCan, { useResourceLimits } from 'hooks/useCan'
import { MODAL, useModalOpen } from 'modals'
import { Project } from 'types'

const CREATE_KEY = '__create__'

type SelectElement = HTMLElement & { value?: string }

const ProjectSwitcher: React.FC = () => {
    const { t } = useStrings()
    const p = t.projects

    const navigate = useNavigate()
    const { pathname } = useLocation()

    const projects = useStore((state) => state.projects)
    const projectsLoaded = useStore((state) => state.projectsLoaded)
    const activeProjectId = useStore((state) => state.activeProjectId)
    const fetchProjects = useStore((state) => state.fetchProjects)
    const setActiveProject = useStore((state) => state.setActiveProject)

    const canCreate = useCan('project.create')
    const limits = useResourceLimits()
    const reached = limits.projects !== null && projects.length >= limits.projects
    const showCreate = canCreate && !reached

    useEffect(() => {
        if (!projectsLoaded) void fetchProjects()
    }, [projectsLoaded, fetchProjects])

    const openWizard = useModalOpen<Project>(MODAL.CREATE_PROJECT, (created) => {
        if (created) navigate(`/projects/${created.id}/assets`)
    })

    const active = useMemo(
        () => projects.find((project) => project.id === activeProjectId) ?? null,
        [projects, activeProjectId]
    )

    const select = useTc<SelectElement>({
        items: [
            ...projects.map((project) => ({
                key: project.id,
                label: project.name,
                description: project.description || p.noDescription,
            })),
            ...(showCreate ? [{ key: CREATE_KEY, label: p.createNew, description: p.createNewHint }] : []),
        ],
        onChange: (value: string) => {
            if (value === CREATE_KEY) {
                if (select.current) select.current.value = activeProjectId ?? ''
                openWizard()
                return
            }
            if (!value || value === activeProjectId) return
            setActiveProject(value)
            const tab = /^\/projects\/[^/]+\/([^/]+)/.exec(pathname)?.[1] ?? 'assets'
            navigate(`/projects/${value}/${tab}`)
        },
    })

    useEffect(() => {
        if (select.current && activeProjectId) select.current.value = activeProjectId
    }, [activeProjectId, projects.length, select])

    if (!projectsLoaded && projects.length === 0) return null

    if (projects.length === 0 && !showCreate) return null

    return (
        <div
            className="module module-project-switcher"
            style={active?.color ? ({ '--project-accent': active.color } as React.CSSProperties) : undefined}
        >
            <tc-extended-select
                ref={select}
                className="module-project-switcher__select"
                placeholder={p.switcherPlaceholder}
                search-placeholder={p.switcherSearch}
                max-height="320"
            ></tc-extended-select>
        </div>
    )
}

export default ProjectSwitcher
