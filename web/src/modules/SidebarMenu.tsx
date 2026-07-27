import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTc } from '@toolcase/web-components/react'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
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

    const sections = useMemo(() => {
        const main = {
            key: 'main',
            title: t.nav.sectionMain,
            items: [
                {
                    key: 'dashboard',
                    label: t.nav.dashboard,
                    icon: 'house',
                    active: location.pathname.startsWith('/dashboard'),
                },
                {
                    key: 'projects',
                    label: t.nav.projects,
                    icon: 'folder',
                    active: location.pathname.startsWith('/projects'),
                },
            ],
        }

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
            main,
            ...(items.length > 0 ? [platform] : []),
        ]
    }, [
        t,
        location.pathname,
        billingEnabled,
        canReadInvoices,
        canReadEnquiries,
        emailEnabled,
        canReadEmail,
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
