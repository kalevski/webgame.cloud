import React, { useEffect } from 'react'
import { wrapInBaseLayout } from 'layouts/BaseLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import LegalPrivacy from 'modules/LegalPrivacy'

const PrivacyPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.privacyTitle)
        setPageDescription('')
    }, [setPageTitle, setPageDescription, t.pages.privacyTitle])

    return <LegalPrivacy />
}

export default wrapInBaseLayout(PrivacyPage)
