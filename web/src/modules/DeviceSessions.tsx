import React, { useEffect, useMemo } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { UserSession } from 'types'
import { formatDateTime } from 'helpers/dates'

const MOBILE_OS = ['ios', 'android', 'ipados']

const glyphFor = (session: UserSession): string => {
    if (session.os === 'Unknown' || session.browser === 'Unknown') return 'Terminal'
    if (MOBILE_OS.some((os) => session.os.toLowerCase().includes(os))) return 'Smartphone'
    return 'Monitor'
}

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

    const ordered = useMemo(
        () => [...sessions].sort((a, b) => Number(b.current) - Number(a.current)),
        [sessions]
    )

    const alone = sessionsLoaded && ordered.length <= 1

    return (
        <div className="module-devices">
            <tc-section-card title={d.title} className="module-devices__card">
                <tc-text variant="muted" className="module-devices__intro">{d.intro}</tc-text>

                <ul className="module-devices__list">
                    {ordered.map((session) => (
                        <li
                            key={session.id}
                            className={session.current ? 'module-devices__row module-devices__row--current' : 'module-devices__row'}
                        >
                            <tc-icon className="module-devices__glyph" name={glyphFor(session)} size="18" decorative></tc-icon>

                            <span className="module-devices__who">
                                <span className="module-devices__name">{label(session)}</span>
                                <span className="module-devices__origin">
                                    {session.ip || d.signedIn(formatDateTime(session.createdAt))}
                                </span>
                            </span>

                            <span className="module-devices__when">
                                {session.current ? d.activeNow : formatDateTime(session.lastSeenAt)}
                            </span>

                            <span className="module-devices__act">
                                {session.current ? (
                                    <tc-badge variant="light" size="xs">{d.currentBadge}</tc-badge>
                                ) : (
                                    <tc-button
                                        variant="danger"
                                        outline
                                        size="sm"
                                        title={d.signOutOf(label(session))}
                                        onClick={() => {
                                            trackEvent(EVENT.SESSION_REVOKE, {})
                                            void revokeSession(session.id)
                                        }}
                                    >
                                        {d.signOut}
                                    </tc-button>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>

                {alone && <tc-text variant="muted" className="module-devices__alone">{d.onlyThisDevice}</tc-text>}
            </tc-section-card>
        </div>
    )
}

export default DeviceSessions
