import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectDirectory from 'modules/ProjectDirectory'
import ProjectAdminDetail from 'modules/ProjectAdminDetail'

const PlatformProjectsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { id } = useParams()

    useEffect(() => {
        setPageTitle(t.pages.platformProjectsTitle)
        setPageDescription(t.pages.platformProjectsDescription)
    }, [
        setPageTitle,
        setPageDescription,
        t.pages.platformProjectsTitle,
        t.pages.platformProjectsDescription,
    ])

    return (
        <AuthGuard secured permission="admin.project.read">
            <section className="console-page">
                {!id && (
                    <tc-rich-page-header
                        title-text={t.pages.platformProjectsTitle}
                        description={t.pages.platformProjectsDescription}
                        icon-name="FolderKanban"
                        icon-color="violet"
                    ></tc-rich-page-header>
                )}

                {id ? <ProjectAdminDetail /> : <ProjectDirectory />}
            </section>
        </AuthGuard>
    )
}

export default wrapInMainLayout(PlatformProjectsPage)
