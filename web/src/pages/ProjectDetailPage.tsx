import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectDetail from 'modules/ProjectDetail'

const ProjectDetailPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.projectDetailTitle)
        setPageDescription(t.pages.projectDetailDescription)
    }, [setPageTitle, setPageDescription, t.pages.projectDetailTitle, t.pages.projectDetailDescription])

    return (
        <AuthGuard secured>
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <ProjectDetail />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ProjectDetailPage)
