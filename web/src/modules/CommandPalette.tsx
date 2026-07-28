import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import useFeature from 'hooks/useFeature'
import { useResourceLimits } from 'hooks/useCan'
import { useLimitLock } from 'hooks/useLock'
import { PROJECT_LIMIT_ENTITLEMENT } from 'configs/entitlements'
import { MODAL, useModalOpen } from 'modals'
import { useTc } from '@toolcase/web-components/react'
import { Project } from 'types'

type PaletteItem = {
    id: string
    label: string
    group?: string
    icon?: string
    shortcut?: string
    keywords?: string[]
}

type PaletteElement = HTMLElement & { items?: PaletteItem[] }

const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

const MODIFIER = IS_MAC ? '⌘' : 'Ctrl'

const projectIdFromPath = (pathname: string): string | null =>
    /^\/projects\/([^/]+)/.exec(pathname)?.[1] ?? null

const CommandPalette: React.FC = () => {
    const { t } = useStrings()
    const c = t.commandPalette

    const navigate = useNavigate()
    const { pathname } = useLocation()

    const projects = useStore((state) => state.projects)
    const fetchProjects = useStore((state) => state.fetchProjects)
    const setActiveProject = useStore((state) => state.setActiveProject)

    const [open, setOpen] = useState(false)

    const [overlayHost] = useState<HTMLElement>(
        () => document.querySelector<HTMLElement>('tc-theme') ?? document.body
    )

    const canCreateProject = useCan('project.create')
    const canReadAdmin = useCan('admin.overview.read')
    const canModerate = useCan('moderation.queue.read')
    const canReadInvoices = useCan('invoice.read')
    const canReadEnquiries = useCan('enquiry.read')
    const canReadEmail = useCan('email.outbox.read')
    const billingEnabled = useFeature('billing')
    const emailEnabled = useFeature('email')

    const limits = useResourceLimits()
    const reached = limits.projects !== null && projects.length >= limits.projects
    const lock = useLimitLock(reached, PROJECT_LIMIT_ENTITLEMENT)

    const currentProjectId = projectIdFromPath(pathname)
    const currentProject = projects.find((project) => project.id === currentProjectId) ?? null

    const openCreateProject = useModalOpen<Project>(MODAL.CREATE_PROJECT)

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
            event.preventDefault()
            setOpen((current) => !current)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    useEffect(() => {
        if (open) void fetchProjects()
    }, [open, fetchProjects])

    const items = useMemo<PaletteItem[]>(() => {
        const entries: PaletteItem[] = [
            { id: 'nav:/dashboard', label: c.openDashboard, group: c.groupGo, icon: 'layout-dashboard' },
            { id: 'nav:/projects', label: c.openProjects, group: c.groupGo, icon: 'folder' },
            { id: 'nav:/profile', label: c.openProfile, group: c.groupGo, icon: 'user' },
        ]

        if (billingEnabled) {
            entries.push({ id: 'nav:/billing', label: c.openBilling, group: c.groupGo, icon: 'credit-card' })
        }

        if (billingEnabled && canReadInvoices) {
            entries.push({ id: 'nav:/platform/invoices', label: c.openInvoices, group: c.groupGo, icon: 'receipt' })
        }

        if (billingEnabled && canReadEnquiries) {
            entries.push({ id: 'nav:/platform/enquiries', label: c.openEnquiries, group: c.groupGo, icon: 'inbox' })
        }

        if (emailEnabled && canReadEmail) {
            entries.push({ id: 'nav:/platform/email', label: c.openEmail, group: c.groupGo, icon: 'mail' })
        }

        if (canReadAdmin) {
            entries.push({ id: 'nav:/admin', label: c.openAdmin, group: c.groupGo, icon: 'shield' })
        }

        if (canModerate) {
            entries.push({ id: 'nav:/moderation', label: c.openModeration, group: c.groupGo, icon: 'flag' })
        }

        if (canCreateProject) {
            entries.push({
                id: 'action:new-project',
                label: c.newProject,
                group: c.groupActions,
                icon: 'plus',
                keywords: ['create', 'add'],
            })
        }

        if (currentProject) {
            entries.push({
                id: 'nav:/projects/' + currentProject.id + '/members',
                label: c.openMembers(currentProject.name),
                group: c.groupActions,
                icon: 'users',
            })
            entries.push({
                id: 'nav:/projects/' + currentProject.id + '/settings',
                label: c.openProjectSettings(currentProject.name),
                group: c.groupActions,
                icon: 'settings',
            })
        }

        for (const project of projects) {
            entries.push({
                id: `project:${project.id}`,
                label: project.name,
                group: c.groupProjects,
                icon: 'folder-open',
                shortcut: c.assetCount(project.assetCount),
                keywords: [project.description].filter(Boolean) as string[],
            })
        }

        return entries
    }, [
        projects,
        currentProject,
        canReadAdmin,
        canModerate,
        canReadInvoices,
        canReadEnquiries,
        canReadEmail,
        billingEnabled,
        emailEnabled,
        canCreateProject,
        c,
    ])

    const runCommand = (item: PaletteItem) => {
        setOpen(false)

        if (item.id.startsWith('nav:')) {
            navigate(item.id.slice(4))
            return
        }
        if (item.id.startsWith('project:')) {
            const id = item.id.slice(8)
            setActiveProject(id)
            navigate(`/projects/${id}`)
            return
        }
        if (item.id === 'action:new-project') {
            if (lock.locked || reached) lock.open()
            else openCreateProject()
        }
    }

    const palette = useTc<PaletteElement>({
        items,
        onSelect: (item: PaletteItem) => runCommand(item),
        onClose: () => setOpen(false),
    })

    useEffect(() => {
        if (!open) return
        const input = palette.current?.querySelector<HTMLInputElement>('.tc-command-palette-input')
        if (input && document.activeElement !== input) input.focus()
    }, [open, items, palette])

    return (
        <>
            <button
                type="button"
                className="module-command__hint"
                title={`${c.hintTitle} (${MODIFIER}K)`}
                onClick={() => setOpen(true)}
            >
                <span className="module-command__hint-label">{c.hint}</span>
                <span className="module-command__hint-keys">
                    <tc-kbd>{MODIFIER}</tc-kbd>
                    <tc-kbd>K</tc-kbd>
                </span>
            </button>

            {createPortal(
                <tc-command-palette
                    ref={palette}
                    open={open || undefined}
                    placeholder={c.placeholder}
                ></tc-command-palette>,
                overlayHost
            )}
        </>
    )
}

export default CommandPalette
