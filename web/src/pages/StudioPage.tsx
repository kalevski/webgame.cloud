import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import DesignStudio from 'modules/DesignStudio'

const StudioPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.studioTitle)
        setPageDescription(t.pages.studioDescription)
    }, [setPageTitle, setPageDescription, t.pages.studioTitle, t.pages.studioDescription])

    return (
        <AuthGuard secured permission="design.template.read">
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <DesignStudio />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(StudioPage)
