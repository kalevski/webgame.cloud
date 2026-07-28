import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import ProjectSettings from 'modules/ProjectSettings'

const ProjectSettingsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.projects.tabSettings)
        setPageDescription(t.projects.settingsDescription)
    }, [setPageTitle, setPageDescription, t.projects.tabSettings, t.projects.settingsDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.projects.tabSettings}
                pipeline={false}
                subline={() => t.projects.settingsDescription}
            >
                {(project) => <ProjectSettings project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ProjectSettingsPage)
