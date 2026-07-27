import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeature from 'hooks/useFeature'
import AuthGuard from 'modules/AuthGuard'
import EnquiriesAdmin from 'modules/EnquiriesAdmin'

const EnquiriesPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeature('billing')

    useEffect(() => {
        setPageTitle(t.pages.enquiriesTitle)
        setPageDescription(t.pages.enquiriesDescription)
    }, [setPageTitle, setPageDescription, t.pages.enquiriesTitle, t.pages.enquiriesDescription])

    if (!billingEnabled) return <Navigate to="/dashboard" replace />

    return (
        <AuthGuard secured permission="enquiry.read">
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <EnquiriesAdmin />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(EnquiriesPage)
