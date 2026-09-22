import React, { useEffect } from 'react'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import CreateProject from 'modules/CreateProject'

const CreateProjectPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.pages.createProjectTitle)
        setPageDescription(t.pages.createProjectDescription)
    }, [setPageTitle, setPageDescription, t.pages.createProjectTitle, t.pages.createProjectDescription])

    return (
        <AuthGuard secured permission="project.create">
            <section className="console-page">
                <tc-rich-page-header
                    title-text={t.pages.createProjectTitle}
                    description={t.pages.createProjectDescription}
                    icon-name="FolderPlus"
                    icon-color="violet"
                ></tc-rich-page-header>

                <CreateProject />
            </section>
        </AuthGuard>
    )
}

export default CreateProjectPage
