import React, { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import useFeature from 'hooks/useFeature'
import { useTc } from '@toolcase/web-components/react'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'

const UserPanel: React.FC = () => {
    const { t } = useStrings()
    const navigate = useNavigate()
    const me = useStore((state) => state.me)
    const logout = useStore((state) => state.logout)

    const canReadAdmin = useCan('admin.overview.read')
    const canModerate = useCan('moderation.queue.read')
    const billingEnabled = useFeature('billing')

    const roleLabel = useStore((state) => state.roleName) ?? ''

    const menuItems = useMemo(
        () => [
            { key: 'profile', label: t.nav.profile, icon: 'id-card' },
            ...(billingEnabled ? [{ key: 'billing', label: t.nav.billing, icon: 'credit-card' }] : []),
            ...(canReadAdmin ? [{ key: 'admin', label: t.nav.admin, icon: 'shield' }] : []),
            ...(canModerate ? [{ key: 'moderation', label: t.nav.moderation, icon: 'flag' }] : []),
        ],
        [t, canReadAdmin, canModerate, billingEnabled]
    )

    const panel = useTc<HTMLElement>({
        menuItems,
        onMenuClick: (key: string) => navigate(`/${key}`),
        avatarSrc: me?.picture || null,
        username: me?.name || me?.email || '',
        initials: (me?.name || me?.email || '?').slice(0, 1).toUpperCase(),
        plan: roleLabel,
        icon: 'log-out',
        iconLabel: t.auth.signOut,
        onIconClick: () => {
            trackEvent(EVENT.LOGOUT, {})
            logout()
        },
    })

    if (!me) return null

    return <tc-user-panel ref={panel}></tc-user-panel>
}

export default UserPanel
