import React, { useEffect } from 'react'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import FontGeneratorTool from 'modules/FontGeneratorTool'

const ToolsFontsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.tools.fontsTitle)
        setPageDescription(t.tools.fontsDescription)
    }, [setPageTitle, setPageDescription, t.tools.fontsTitle, t.tools.fontsDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.tools.fontsTitle}
                description={t.tools.fontsDescription}
                iconName="Type"
                iconColor="violet"
                pipeline={false}
            >
                {(project) => <FontGeneratorTool project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default ToolsFontsPage
