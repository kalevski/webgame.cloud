import React, { useEffect } from 'react'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import Loading from 'components/Loading'
import { SalesEnquiry } from 'types'
import { MODAL } from './keys'
import { useModalInput, useModalIsOpen } from './registry'
import { formatDateTime } from 'helpers/dates'

const EnquiryTrailModal: React.FC = () => {
    const isOpen = useModalIsOpen(MODAL.ENQUIRY_TRAIL)
    const enquiry = useModalInput<SalesEnquiry>(MODAL.ENQUIRY_TRAIL)
    const { t } = useStrings()
    const e = t.enquiries

    const events = useStore((state) => state.enquiryEvents)
    const loading = useStore((state) => state.enquiryEventsLoading)
    const fetchEnquiryEvents = useStore((state) => state.fetchEnquiryEvents)

    useEffect(() => {
        if (!isOpen || !enquiry) return
        void fetchEnquiryEvents(enquiry.id)
    }, [isOpen, enquiry, fetchEnquiryEvents])

    return (
        <div className="modal-trail">
            <tc-stack direction="column" gap="0.75rem">
                {enquiry && (
                    <tc-text variant="muted">
                        {`${enquiry.userName || enquiry.userEmail} · ${enquiry.planName ?? '—'}`}
                    </tc-text>
                )}

                {loading && <Loading />}

                {!loading && events.length === 0 && <tc-text variant="muted">{e.trailEmpty}</tc-text>}

                {!loading && events.map((event) => (
                    <div key={event.id} className="modal-trail__entry">
                        <div className="modal-trail__head">
                            <strong>{e.trailKinds[event.kind]}</strong>
                            <span className="modal-trail__time">
                                {formatDateTime(event.createdAt)}
                            </span>
                        </div>
                        <div className="modal-trail__meta">
                            {event.actorName}
                            {event.status ? ` · ${e.statusLabels[event.status]}` : ''}
                            {event.invoiceNumber ? ` · ${event.invoiceNumber}` : ''}
                        </div>
                        {event.note && <div className="modal-trail__note">{event.note}</div>}
                    </div>
                ))}
            </tc-stack>
        </div>
    )
}

export default EnquiryTrailModal
