import React from 'react'
import { useParams } from 'react-router'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import usePageTabs from 'hooks/usePageTabs'
import AccountSettings from 'modules/AccountSettings'
import DeviceSessions from 'modules/DeviceSessions'
import TicketList from 'modules/TicketList'
import RoleApplications from 'modules/RoleApplications'

type ProfileTab = 'account' | 'devices' | 'roles' | 'tickets'

const Profile: React.FC = () => {
    const { t } = useStrings()
    const p = t.profile
    const ticketsEnabled = useFeature('tickets')

    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'account', label: p.tabAccount, href: '/profile' },
        { id: 'devices', label: p.tabDevices, href: '/profile/devices' },
        { id: 'roles', label: p.tabRoles, href: '/profile/roles' },
        ...(ticketsEnabled
            ? [{ id: 'tickets', label: p.tabTickets, href: '/profile/tickets' }]
            : []),
    ]

    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'account') as ProfileTab

    usePageTabs(tabs)

    return (
        <div className="module module-profile">
            <div className="module-profile__content">
                {tab === 'account' && <AccountSettings />}
                {tab === 'devices' && <DeviceSessions />}
                {tab === 'roles' && <RoleApplications />}
                {tab === 'tickets' && <TicketList />}
            </div>
        </div>
    )
}

export default Profile
