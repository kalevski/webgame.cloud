import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { UserSession } from 'types'
import { formatDateTime } from 'helpers/dates'

const DeviceSessions: React.FC = () => {
    const { t } = useStrings()
    const d = t.devices
    const sessions = useStore((state) => state.sessions)
    const sessionsLoaded = useStore((state) => state.sessionsLoaded)
    const fetchSessions = useStore((state) => state.fetchSessions)
    const revokeSession = useStore((state) => state.revokeSession)

    useEffect(() => {
        void fetchSessions()
    }, [fetchSessions])

    const label = (session: UserSession): string =>
        session.browser === 'Unknown' && session.os === 'Unknown'
            ? d.unknownDevice
            : d.deviceLabel(session.browser, session.os)

    const current = useMemo(() => sessions.find((session) => session.current), [sessions])
    const others = useMemo(() => sessions.filter((session) => !session.current), [sessions])

    const currentBadges = useTc<HTMLElement>({
        badges: current ? [{ label: d.currentBadge, variant: 'success' }] : [],
    })

    const currentCard = useTc<HTMLElement>({
        meta: current
            ? [
                  { label: d.lastSeenLabel, value: formatDateTime(current.lastSeenAt) },
                  { label: d.signedInLabel, value: formatDateTime(current.createdAt) },
                  ...(current.ip ? [{ label: d.ipLabel, value: current.ip }] : []),
              ]
            : [],
    })

    const otherList = useTc<HTMLElement>({
        actions: others.map((session) => ({
            key: session.id,
            title: label(session),
            description: [
                d.lastSeen(formatDateTime(session.lastSeenAt)),
                session.ip ? d.ip(session.ip) : '',
            ].filter(Boolean).join(' · '),
            label: d.signOut,
            variant: 'danger',
            icon: 'LogOut',
        })),
        onActionClick: (key: string) => {
            trackEvent(EVENT.SESSION_REVOKE, {})
            void revokeSession(key)
        },
    })

    return (
        <div className="module-devices">
            <tc-text variant="muted">{d.intro}</tc-text>

            {current && (
                <tc-section-card title={d.currentTitle} className="module-devices__current">
                    <tc-stack direction="column" gap="0.85rem">
                        <tc-entity-profile-card ref={currentCard} title={label(current)}>
                            <tc-badge-row slot="chips" ref={currentBadges} size="sm"></tc-badge-row>
                        </tc-entity-profile-card>
                    </tc-stack>
                </tc-section-card>
            )}

            <tc-section-card title={d.otherTitle} className="module-devices__others">
                <tc-stack direction="column" gap="0.85rem">
                    {others.length > 0
                        ? <tc-action-row-list ref={otherList} outline trailing-icon="none"></tc-action-row-list>
                        : sessionsLoaded && (
                            <tc-empty-state icon="monitor-smartphone" heading={d.emptyTitle} description={d.emptyMessage}></tc-empty-state>
                        )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default DeviceSessions
