import React, { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useAuth from 'hooks/useAuth'
import { useTc } from '@toolcase/web-components/react'
import Icon from 'components/icons'
import { Project } from 'types'
import { formatDate } from 'helpers/dates'
import { MODAL, useModalOpen } from 'modals'

const DUE_SOON_DAYS = 7

const Dashboard: React.FC = () => {
    const { t } = useStrings()
    const d = t.dashboard
    const navigate = useNavigate()
    const { user } = useAuth()

    const projects = useStore((state) => state.projects)
    const projectsLoaded = useStore((state) => state.projectsLoaded)
    const fetchProjects = useStore((state) => state.fetchProjects)
    const notifications = useStore((state) => state.notifications)
    const unread = useStore((state) => state.notificationsUnread)
    const fetchNotifications = useStore((state) => state.fetchNotifications)
    const readNotification = useStore((state) => state.readNotification)

    useEffect(() => {
        fetchProjects()
        fetchNotifications()
    }, [fetchProjects, fetchNotifications])

    const openProjectWizard = useModalOpen<Project>(MODAL.CREATE_PROJECT, (created) => {
        if (created) navigate(`/projects/${created.id}/assets`)
    })

    const name = user?.name || user?.email || ''
    const hour = new Date().getHours()
    const greeting = hour < 12 ? d.greetingMorning : hour < 18 ? d.greetingAfternoon : d.greetingEvening
    const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    })

    const assetTotal = projects.reduce((sum, project) => sum + project.assetCount, 0)

    const steps = useMemo(
        () => [
            { key: 'signin', label: d.stepSignIn, completed: true },
            { key: 'profile', label: d.stepProfile, completed: !!user?.name },
            { key: 'project', label: d.stepProject, completed: projects.length > 0 },
            { key: 'task', label: d.stepTask, completed: assetTotal > 0 },
        ],
        [d, user?.name, projects.length, assetTotal]
    )
    const onboarded = projectsLoaded && steps.every((step) => step.completed)
    const welcome = useTc<HTMLElement>({
        messages: [d.welcomeMessage],
        steps,
        onstepclick: (_event: CustomEvent, key: string) => {
            if (key === 'profile') navigate('/profile')
            else if (key === 'project') openProjectWizard()
            else if (key === 'task') navigate('/projects')
        },
    })
    const memberTotal = useMemo(
        () => projects.reduce((sum, project) => sum + project.memberCount, 0),
        [projects]
    )

    const metrics = useMemo(
        () => [
            { key: 'projects', label: d.statProjects, value: String(projects.length), icon: 'FolderKanban' },
            { key: 'assets', label: d.statTasks, value: String(assetTotal), icon: 'Image' },
            { key: 'members', label: d.statDueSoon, value: String(memberTotal), icon: 'Users', hint: d.statDueSoonHint },
            { key: 'unread', label: d.statUnread, value: String(unread), icon: 'Bell' },
        ],
        [d, projects.length, assetTotal, memberTotal, unread]
    )
    const metricGrid = useTc<HTMLElement>({ items: metrics })

    const recent = useMemo(
        () =>
            [...projects]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 4),
        [projects]
    )

    const timeLabel = (iso: string): string => {
        const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
        if (minutes < 1) return t.notifications.justNow
        if (minutes < 60) return t.notifications.minutesAgo(minutes)
        if (minutes < 24 * 60) return t.notifications.hoursAgo(Math.round(minutes / 60))
        return formatDate(iso)
    }

    const openEntry = (id: string, link: string) => {
        void readNotification(id)
        if (link) navigate(link)
    }

    const projectRow = (project: Project) => (
        <Link key={project.id} to={`/projects/${project.id}`} className="module-dashboard__row">
            <span
                className="module-dashboard__row-icon"
                style={project.color ? { color: project.color } : undefined}
            >
                <Icon name="folder" size={16} />
            </span>
            <span className="module-dashboard__row-text">
                <span className="module-dashboard__row-title">{project.name}</span>
                <span className="module-dashboard__row-meta">
                    {d.assetCount(project.assetCount)}
                </span>
            </span>
            <span className="module-dashboard__row-side">{timeLabel(project.updatedAt)}</span>
        </Link>
    )

    return (
        <div className="module module-dashboard">
            {onboarded ? (
                <header className="module-dashboard__head">
                    <div>
                        <h2 className="module-dashboard__greeting">{name ? `${greeting}, ${name}` : greeting}</h2>
                        <p className="module-dashboard__date">{today}</p>
                    </div>
                    <tc-button variant="primary" onClick={() => navigate('/projects')}>
                        {d.goToProjects}
                    </tc-button>
                </header>
            ) : (
                <tc-welcome-guide
                    ref={welcome}
                    title={name ? `${greeting}, ${name}` : greeting}
                ></tc-welcome-guide>
            )}

            <tc-metric-grid ref={metricGrid} columns="4"></tc-metric-grid>

            <div className="module-dashboard__columns">
                <tc-panel bordered className="module-dashboard__panel">
                    <div className="module-dashboard__panel-head">
                        <h3 className="module-dashboard__panel-title">{d.recentProjects}</h3>
                        <Link to="/projects" className="module-dashboard__panel-link">{d.viewAll}</Link>
                    </div>
                    <div className="module-dashboard__panel-body">
                        {projectsLoaded && recent.length === 0 ? (
                            <tc-empty-state icon="folder-plus">{d.noProjects}</tc-empty-state>
                        ) : (
                            <div className="module-dashboard__rows">{recent.map(projectRow)}</div>
                        )}
                    </div>
                </tc-panel>

                <tc-panel bordered className="module-dashboard__panel">
                    <div className="module-dashboard__panel-head">
                        <h3 className="module-dashboard__panel-title">{d.recentActivity}</h3>
                    </div>
                    <div className="module-dashboard__panel-body">
                        {notifications.length === 0 ? (
                            <tc-empty-state icon="bell">{d.noActivity}</tc-empty-state>
                        ) : (
                            <div className="module-dashboard__rows">
                                {notifications.slice(0, 6).map((entry) => (
                                    <button
                                        key={entry.id}
                                        type="button"
                                        className={`module-dashboard__row${entry.readAt === null ? ' module-dashboard__row--unread' : ''}`}
                                        onClick={() => openEntry(entry.id, entry.link)}
                                    >
                                        <span className="module-dashboard__row-text">
                                            <span className="module-dashboard__row-title">{entry.title}</span>
                                        </span>
                                        <span className="module-dashboard__row-side">{timeLabel(entry.createdAt)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </tc-panel>
            </div>
        </div>
    )
}

export default Dashboard
