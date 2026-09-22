import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { notificationBadge } from 'types'
import Icon from 'components/icons'
import { EVENT } from 'configs/analytics'
import { trackEvent } from 'helpers/analytics'
import { useVisiblePoll } from '@toolcase/web-components/react'

const POLL_MS = 60_000

const NotificationsBell: React.FC = () => {
    const { t } = useStrings()
    const n = t.notifications
    const navigate = useNavigate()
    const notifications = useStore((state) => state.notifications)
    const unread = useStore((state) => state.notificationsUnread)
    const fetchNotifications = useStore((state) => state.fetchNotifications)
    const readNotification = useStore((state) => state.readNotification)
    const readAllNotifications = useStore((state) => state.readAllNotifications)
    const pushEnabled = useStore((state) => state.pushEnabled)
    const probePush = useStore((state) => state.probePush)
    const enablePush = useStore((state) => state.enablePush)
    const disablePush = useStore((state) => state.disablePush)

    const [open, setOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchNotifications()
        probePush()
    }, [fetchNotifications, probePush])

    useVisiblePoll(fetchNotifications, POLL_MS)

    useEffect(() => {
        if (!open) return
        const onPointer = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onPointer)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onPointer)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const openEntry = (id: string, link: string) => {
        void readNotification(id)
        setOpen(false)
        if (link) navigate(link)
    }

    const timeLabel = (iso: string): string => {
        const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
        if (minutes < 1) return n.justNow
        if (minutes < 60) return n.minutesAgo(minutes)
        if (minutes < 24 * 60) return n.hoursAgo(Math.round(minutes / 60))
        return new Date(iso).toLocaleDateString('mk-MK')
    }

    return (
        <div className="module-notifications" ref={rootRef}>
            <button
                type="button"
                className="module-notifications__button"
                aria-label={unread > 0 ? n.titleWithUnread(unread) : n.title}
                title={n.title}
                onClick={() => {
                    setOpen((value) => !value)
                    if (!open) fetchNotifications()
                }}
            >
                <Icon name="bell" size={18} />
                {unread > 0 && <span className="module-notifications__badge">{notificationBadge(unread)}</span>}
            </button>
            {open && (
                <div className="module-notifications__panel">
                    <div className="module-notifications__head">
                        <strong>{n.title}</strong>
                        {unread > 0 && (
                            <button
                                type="button"
                                className="module-notifications__mark-all"
                                onClick={() => readAllNotifications()}
                            >
                                {n.markAllRead}
                            </button>
                        )}
                    </div>

                    <tc-scroll-area max-height="320" axis="y">
                    <ul className="module-notifications__list">
                        {notifications.length === 0 && (
                            <li className="module-notifications__empty">{n.empty}</li>
                        )}
                        {notifications.map((entry) => (
                            <li key={entry.id}>
                                <button
                                    type="button"
                                    className={
                                        entry.readAt === null
                                            ? 'module-notifications__entry module-notifications__entry--unread'
                                            : 'module-notifications__entry'
                                    }
                                    onClick={() => openEntry(entry.id, entry.link)}
                                >
                                    <span className="module-notifications__entry-title">{entry.title}</span>
                                    <span className="module-notifications__entry-time">{timeLabel(entry.createdAt)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    </tc-scroll-area>
                    {pushEnabled !== null && (
                        <div className="module-notifications__push">
                            {pushEnabled ? (
                                <button type="button" onClick={() => disablePush()}>{n.pushDisable}</button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const granted = await enablePush()
                                        trackEvent(EVENT.PUSH_ENABLE, {
                                            outcome: granted ? 'granted' : 'denied',
                                        })
                                    }}
                                >
                                    {n.pushEnable}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationsBell
