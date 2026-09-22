import React, { useEffect } from 'react'
import { Navigate } from 'react-router'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useFeatureGate from 'hooks/useFeatureGate'
import AuthGuard from 'modules/AuthGuard'
import EnquiriesAdmin from 'modules/EnquiriesAdmin'

const EnquiriesPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const billingEnabled = useFeatureGate('billing')

    useEffect(() => {
        setPageTitle(t.pages.enquiriesTitle)
        setPageDescription(t.pages.enquiriesDescription)
    }, [setPageTitle, setPageDescription, t.pages.enquiriesTitle, t.pages.enquiriesDescription])

    if (billingEnabled === null) return null
    if (!billingEnabled) return <Navigate to="/" replace />

    return (
        <AuthGuard secured permission="enquiry.read">
            <EnquiriesAdmin />
        </AuthGuard>
    )
}

export default EnquiriesPage
