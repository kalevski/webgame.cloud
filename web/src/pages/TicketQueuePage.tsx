import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import TicketQueue from 'modules/TicketQueue'

const TicketQueuePage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.ticketQueueTitle)
        setPageDescription(t.pages.ticketQueueDescription)
    }, [setPageTitle, setPageDescription, t.pages.ticketQueueTitle, t.pages.ticketQueueDescription])

    return (
        <AuthGuard secured permission="ticket.queue.read">
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <TicketQueue />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(TicketQueuePage)
