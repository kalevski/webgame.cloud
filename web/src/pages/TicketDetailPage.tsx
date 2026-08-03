import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import TicketThread from 'modules/TicketThread'

const TicketDetailPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        setPageTitle(t.pages.ticketDetailTitle)
        setPageDescription(t.pages.ticketDetailDescription)
    }, [setPageTitle, setPageDescription, t.pages.ticketDetailTitle, t.pages.ticketDetailDescription])

    return (
        <AuthGuard secured>
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        {id && <TicketThread id={id} />}
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(TicketDetailPage)
