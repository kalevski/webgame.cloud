import React from 'react'
import { useParams } from 'react-router'
import useStrings from 'hooks/useStrings'
import RouteTabs from 'components/RouteTabs'
import AccountSettings from 'modules/AccountSettings'
import DeviceSessions from 'modules/DeviceSessions'

type ProfileTab = 'account' | 'devices'

const Profile: React.FC = () => {
    const { t } = useStrings()
    const p = t.profile

    const { tab: tabParam } = useParams()

    const tabs = [
        { id: 'account', label: p.tabAccount, icon: 'user', path: '/profile' },
        { id: 'devices', label: p.tabDevices, icon: 'monitor-smartphone', path: '/profile/devices' },
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
            </div>
        </div>
    )
}

export default Profile
