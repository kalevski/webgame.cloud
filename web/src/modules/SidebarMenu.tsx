import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTc } from '@toolcase/web-components/react'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useStore } from 'state'
import useFeature from 'hooks/useFeature'

const SidebarMenu: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useStrings()
    const billingEnabled = useFeature('billing')
    const canReadInvoices = useCan('invoice.read')
    const canReadEnquiries = useCan('enquiry.read')
    const emailEnabled = useFeature('email')
    const canReadEmail = useCan('email.outbox.read')
    const canReadRealms = useCan('realm.read')
    const canReadAdminProjects = useCan('admin.project.read')
    const canReadUsers = useCan('admin.user.read')
    const ticketsEnabled = useFeature('tickets')
    const canReadTicketQueue = useCan('ticket.queue.read')
    const activeProjectId = useStore((state) => state.activeProjectId)

    const sections = useMemo(() => {
        const dashboardItem = {
            key: 'dashboard',
            label: t.nav.dashboard,
            icon: 'house',
            active: location.pathname.startsWith('/dashboard'),
        }

        const project = {
            key: 'project',
            title: t.nav.sectionProject,
            items: [
                dashboardItem,
                ...(activeProjectId
                    ? [
                        {
                            key: `projects/${activeProjectId}/settings`,
                            label: t.projects.tabSettings,
                            icon: 'settings',
                            active: location.pathname.startsWith(`/projects/${activeProjectId}/settings`),
                        },
                        {
                            key: `projects/${activeProjectId}/members`,
                            label: t.members.title,
                            icon: 'users',
                            active: location.pathname.startsWith(`/projects/${activeProjectId}/members`),
                        },
                    ]
                    : []),
            ],
        }

        const workspaceItems = [
            ...(activeProjectId
                ? [
                    {
                        key: `projects/${activeProjectId}/assets`,
                        label: t.assets.title,
                        icon: 'image',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/assets`),
                    },
                    {
                        key: `projects/${activeProjectId}/bundles`,
                        label: t.bundles.title,
                        icon: 'package',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/bundles`),
                    },
                    {
                        key: `projects/${activeProjectId}/builds`,
                        label: t.builds.title,
                        icon: 'hammer',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/builds`),
                    },
                ]
                : []),
        ]

        const workspace = { key: 'workspace', title: t.nav.sectionMain, items: workspaceItems }

        const toolItems = [
            ...(activeProjectId
                ? [
                    {
                        key: `projects/${activeProjectId}/tools/fonts`,
                        label: t.nav.toolFonts,
                        icon: 'type',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/tools/fonts`),
                    },
                    {
                        key: `projects/${activeProjectId}/tools/normal-maps`,
                        label: t.nav.toolNormalMaps,
                        icon: 'mountain',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/tools/normal-maps`),
                    },
                    {
                        key: `projects/${activeProjectId}/tools/physics`,
                        label: t.nav.toolPhysics,
                        icon: 'shapes',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/tools/physics`),
                    },
                    {
                        key: `projects/${activeProjectId}/tools/translations`,
                        label: t.nav.toolTranslations,
                        icon: 'languages',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/tools/translations`),
                    },
                    {
                        key: `projects/${activeProjectId}/tools/live-config`,
                        label: t.nav.toolLiveConfig,
                        icon: 'sliders',
                        active: location.pathname.startsWith(`/projects/${activeProjectId}/tools/live-config`),
                    },
                ]
                : []),
        ]

        const tools = { key: 'tools', title: t.nav.sectionTools, items: toolItems }

        const invoiceItem = {
            key: 'platform/invoices',
            label: t.nav.invoices,
            icon: 'receipt',
            active: location.pathname.startsWith('/platform/invoices'),
        }

        const enquiryItem = {
            key: 'platform/enquiries',
            label: t.nav.enquiries,
            icon: 'inbox',
            active: location.pathname.startsWith('/platform/enquiries'),
        }

        const items = [
            ...(canReadAdminProjects
                ? [{
                    key: 'platform/projects',
                    label: t.nav.platformProjects,
                    icon: 'folder-kanban',
                    active: location.pathname.startsWith('/platform/projects'),
                }]
                : []),
            ...(canReadUsers
                ? [{
                    key: 'platform/users',
                    label: t.nav.platformUsers,
                    icon: 'users',
                    active: location.pathname.startsWith('/platform/users'),
                }]
                : []),
            ...(canReadRealms
                ? [{
                    key: 'platform/realms',
                    label: t.nav.realms,
                    icon: 'server',
                    active: location.pathname.startsWith('/platform/realms'),
                }]
                : []),
            ...(ticketsEnabled && canReadTicketQueue
                ? [{
                    key: 'platform/tickets',
                    label: t.nav.ticketQueue,
                    icon: 'life-buoy',
                    active: location.pathname.startsWith('/platform/tickets'),
                }]
                : []),
            ...(billingEnabled && canReadInvoices ? [invoiceItem] : []),
            ...(billingEnabled && canReadEnquiries ? [enquiryItem] : []),
            ...(emailEnabled && canReadEmail
                ? [{
                    key: 'platform/email',
                    label: t.nav.email,
                    icon: 'mail',
                    active: location.pathname.startsWith('/platform/email'),
                }]
                : []),
        ]

        const platform = { key: 'platform', title: t.nav.sectionPlatform, items }

        return [
            project,
            ...(workspaceItems.length > 0 ? [workspace] : []),
            ...(toolItems.length > 0 ? [tools] : []),
            ...(items.length > 0 ? [platform] : []),
        ]
    }, [
        t,
        location.pathname,
        activeProjectId,
        canReadRealms,
        canReadAdminProjects,
        canReadUsers,
        billingEnabled,
        canReadInvoices,
        canReadEnquiries,
        emailEnabled,
        canReadEmail,
        ticketsEnabled,
        canReadTicketQueue,
    ])

    const nav = useTc<HTMLElement>({
        sections,
        onItemClick: (_event: Event, item: { key?: string }) => {
            if (item.key) navigate(`/${item.key}`)
        },
    })

    return <tc-side-nav ref={nav}></tc-side-nav>
}

export default SidebarMenu
