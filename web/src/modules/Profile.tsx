import React from 'react'
import { useParams } from 'react-router'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import RouteTabs from 'components/RouteTabs'
import AccountSettings from 'modules/AccountSettings'
import DeviceSessions from 'modules/DeviceSessions'
import TicketList from 'modules/TicketList'

type ProfileTab = 'account' | 'devices' | 'tickets'

const Profile: React.FC = () => {
    const { t } = useStrings()
    const p = t.profile
    const ticketsEnabled = useFeature('tickets')

    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'account', label: p.tabAccount, icon: 'user', path: '/profile' },
        { id: 'devices', label: p.tabDevices, icon: 'monitor-smartphone', path: '/profile/devices' },
        ...(ticketsEnabled
            ? [{ id: 'tickets', label: p.tabTickets, icon: 'life-buoy', path: '/profile/tickets' }]
            : []),
    ]

    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'account') as ProfileTab

    return (
        <div className="module module-profile">
            <tc-rich-page-header
                className="module-profile__header"
                title-text={p.title}
                description={p.intro}
                icon-name="UserCircle"
                icon-color="violet"
            ></tc-rich-page-header>

            <RouteTabs tabs={tabs} activeId={tab} />

            <div className="module-profile__content">
                {tab === 'account' && <AccountSettings />}
                {tab === 'devices' && <DeviceSessions />}
                {tab === 'tickets' && <TicketList />}
            </div>
        </div>
    )
}

export default Profile
