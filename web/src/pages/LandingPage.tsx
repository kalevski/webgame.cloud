import React, { useEffect } from 'react'
import { wrapInBaseLayout } from 'layouts/BaseLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import useAuth from 'hooks/useAuth'
import Landing from 'modules/Landing'

const LandingPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { authLoaded } = useAuth()

    useEffect(() => {
        setPageTitle(t.pages.landingTitle)
        setPageDescription(t.pages.landingDescription)
    }, [setPageTitle, setPageDescription, t.pages.landingTitle, t.pages.landingDescription])

    if (!authLoaded) return null

    return <Landing />
}

export default wrapInBaseLayout(LandingPage)
