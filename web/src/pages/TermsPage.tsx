import React, { useEffect } from 'react'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import LegalTerms from 'modules/LegalTerms'

const TermsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.termsTitle)
        setPageDescription('')
    }, [setPageTitle, setPageDescription, t.pages.termsTitle])

    return <LegalTerms />
}

export default TermsPage
