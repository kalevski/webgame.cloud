import React, { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import AuthGuard from 'modules/AuthGuard'
import TicketThread from 'modules/TicketThread'

const TicketDetailPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const ticketsEnabled = useFeatureGate('tickets')
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        setPageTitle(t.pages.ticketDetailTitle)
        setPageDescription(t.pages.ticketDetailDescription)
    }, [setPageTitle, setPageDescription, t.pages.ticketDetailTitle, t.pages.ticketDetailDescription])

    if (ticketsEnabled === null) return null
    if (!ticketsEnabled) return <Navigate to="/" replace />

    return (
        <AuthGuard secured>
            {id && <TicketThread id={id} />}
        </AuthGuard>
    )
}

export default TicketDetailPage
