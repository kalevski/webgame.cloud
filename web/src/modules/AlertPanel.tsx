import React from 'react'
import { useTcEvents } from '@toolcase/web-components/react'
import { useStore } from 'state'
import { AppAlert } from 'types'

const AlertItem: React.FC<{ alert: AppAlert; onDismiss: (key: string) => void }> = ({ alert, onDismiss }) => {
    const ref = useTcEvents({ 'tc-closed': () => onDismiss(alert.key) })
    return (
        <tc-alert ref={ref} variant={alert.variant} dismissible={alert.dismissible || undefined}>
            {alert.message}
        </tc-alert>
    )
}

const AlertPanel: React.FC = () => {
    const alerts = useStore((state) => state.alerts)
    const dismissAlert = useStore((state) => state.dismissAlert)

    if (alerts.length === 0) return null

    return (
        <div className="module module-alert-panel" role="status" aria-live="polite">
            {alerts.map((alert) => (
                <AlertItem key={alert.key} alert={alert} onDismiss={dismissAlert} />
            ))}
        </div>
    )
}

export default AlertPanel
