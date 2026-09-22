import React from 'react'
import { useNavigate } from 'react-router'
import useAuth from 'hooks/useAuth'
import useNavigation from 'hooks/useNavigation'
import useSheetHistory, { consume } from 'hooks/useSheetHistory'
import useStrings from 'hooks/useStrings'
import ProjectSwitcher from 'modules/ProjectSwitcher'
import { useStore } from 'state'
import type { NavSection } from 'configs/navigation'

type MoreSheetProps = {
    open: boolean
    onClose: () => void
}

type MoreRowProps = {
    icon: string
    label: string
    badge?: number
    danger?: boolean
    onPick: () => void
}

const MoreRow: React.FC<MoreRowProps> = ({ icon, label, badge, danger, onPick }) => (
    <button type="button" className={danger ? 'app-more__row app-more__row--danger' : 'app-more__row'} onClick={onPick}>
        <tc-icon name={icon} size="18" decorative></tc-icon>
        <span className="app-more__row-label">{label}</span>
        {badge !== undefined && badge > 0 && <span className="app-more__row-badge">{badge}</span>}
        <tc-icon name="ChevronRight" size="15" decorative></tc-icon>
    </button>
)

const MoreSheet: React.FC<MoreSheetProps> = ({ open, onClose }) => {
    const { t } = useStrings()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { moreSections } = useNavigation()
    const roleName = useStore((state) => state.roleName)
    const unread = useStore((state) => state.notificationsUnread)
    const logout = useStore((state) => state.logout)

    useSheetHistory(open, onClose)

    const go = (path: string) => {
        consume()
        onClose()
        navigate(path)
    }

    const headings: Record<NavSection, string> = {
        workspace: t.nav.sectionWorkspace,
        platform: t.nav.sectionPlatform,
        admin: t.nav.sectionAdmin,
    }

    return (
        <tc-bottom-sheet ontc-sheet-close={() => onClose()} open={open === true} heading={t.nav.more} snap="auto">
            <div className="app-more">
                <button type="button" className="app-more__identity" onClick={() => go('/profile')}>
                    <tc-avatar
                        className="app-more__avatar"
                        name={user?.name || user?.email || ''}
                        src={user?.picture || undefined}
                        size="default"
                    ></tc-avatar>
                    <span className="app-more__who">
                        <span className="app-more__name">{user?.name || user?.email || t.nav.account}</span>
                        <span className="app-more__standing">{roleName ?? user?.email ?? ''}</span>
                    </span>
                    {unread > 0 && <span className="app-more__row-badge">{unread}</span>}
                    <tc-icon name="ChevronRight" size="16" decorative></tc-icon>
                </button>

                <div className="app-more__switcher">
                    <ProjectSwitcher />
                </div>

                {moreSections.map((group) => (
                    <div className="app-more__group" key={group.section}>
                        <p className="app-more__heading">{headings[group.section]}</p>
                        <div className="app-more__rows">
                            {group.items.map((item) => (
                                <MoreRow
                                    key={item.id}
                                    icon={item.icon}
                                    label={t.nav[item.labelKey]}
                                    onPick={() => go(item.path)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                <div className="app-more__group">
                    <p className="app-more__heading">{t.nav.sectionAccount}</p>
                    <div className="app-more__rows">
                        <MoreRow icon="User" label={t.nav.profile} onPick={() => go('/profile')} />
                        <MoreRow icon="FileText" label={t.pages.termsTitle} onPick={() => go('/terms')} />
                        <MoreRow icon="ShieldCheck" label={t.pages.privacyTitle} onPick={() => go('/privacy')} />
                        <MoreRow
                            icon="LogOut"
                            label={t.nav.signOut}
                            danger
                            onPick={() => {
                                onClose()
                                void logout()
                            }}
                        />
                    </div>
                </div>
            </div>
        </tc-bottom-sheet>
    )
}

export default MoreSheet
