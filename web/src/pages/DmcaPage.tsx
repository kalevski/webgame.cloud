import React, { useEffect } from 'react'
import { wrapInBaseLayout } from 'layouts/BaseLayout'
import { usePageContext } from 'contexts/PageContext'
import LegalDmca from 'modules/LegalDmca'

const DmcaPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()

    useEffect(() => {
        setPageTitle('Copyright and takedown policy')
        setPageDescription('')
    }, [setPageTitle, setPageDescription])

    return <LegalDmca />
}

export default wrapInBaseLayout(DmcaPage)
