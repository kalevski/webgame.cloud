import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'

const OfflineBanner: React.FC = () => {
    const { t } = useStrings()
    const n = t.network

    const [online, setOnline] = useState(() => navigator.onLine)

    useEffect(() => {
        const goOnline = () => setOnline(true)
        const goOffline = () => setOnline(false)

        window.addEventListener('online', goOnline)
        window.addEventListener('offline', goOffline)
        setOnline(navigator.onLine)

        return () => {
            window.removeEventListener('online', goOnline)
            window.removeEventListener('offline', goOffline)
        }
    }, [])

    if (online) return null

    return (
        <tc-banner variant="warning" icon="wifi-off" className="module-offline-banner">
            <strong>{n.offlineTitle}</strong> {n.offlineBody}
        </tc-banner>
    )
}

export default OfflineBanner
