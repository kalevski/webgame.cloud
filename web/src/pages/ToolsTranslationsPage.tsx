import React, { useEffect } from 'react'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import TranslationsTool from 'modules/TranslationsTool'

const ToolsTranslationsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.tools.translationsTitle)
        setPageDescription(t.tools.translationsDescription)
    }, [setPageTitle, setPageDescription, t.tools.translationsTitle, t.tools.translationsDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.tools.translationsTitle}
                description={t.tools.translationsDescription}
                iconName="Languages"
                iconColor="violet"
                pipeline={false}
            >
                {(project) => <TranslationsTool project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default ToolsTranslationsPage
