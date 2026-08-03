import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import NormalMapTool from 'modules/NormalMapTool'

const ToolsNormalMapsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.tools.normalMapsTitle)
        setPageDescription(t.tools.normalMapsDescription)
    }, [setPageTitle, setPageDescription, t.tools.normalMapsTitle, t.tools.normalMapsDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.tools.normalMapsTitle}
                description={t.tools.normalMapsDescription}
                iconName="Mountain"
                iconColor="violet"
                pipeline={false}
            >
                {(project) => <NormalMapTool project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ToolsNormalMapsPage)
