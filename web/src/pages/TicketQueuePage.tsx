import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import AuthGuard from 'modules/AuthGuard'
import TicketQueue from 'modules/TicketQueue'

const TicketQueuePage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const ticketsEnabled = useFeatureGate('tickets')

    useEffect(() => {
        setPageTitle(t.pages.ticketQueueTitle)
        setPageDescription(t.pages.ticketQueueDescription)
    }, [setPageTitle, setPageDescription, t.pages.ticketQueueTitle, t.pages.ticketQueueDescription])

    if (ticketsEnabled === null) return null
    if (!ticketsEnabled) return <Navigate to="/" replace />

    return (
        <AuthGuard secured permission="ticket.queue.read">
            <TicketQueue />
        </AuthGuard>
    )
}

export default TicketQueuePage
