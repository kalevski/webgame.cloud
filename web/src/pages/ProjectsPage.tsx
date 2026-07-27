import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectList from 'modules/ProjectList'

const ProjectsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.projectsTitle)
        setPageDescription(t.pages.projectsDescription)
    }, [setPageTitle, setPageDescription, t.pages.projectsTitle, t.pages.projectsDescription])

    return (
        <AuthGuard secured>
            <section className="container">
                <div className="row">
                    <div className="col-12">
                        <ProjectList />
                    </div>
                </div>
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ProjectsPage)
