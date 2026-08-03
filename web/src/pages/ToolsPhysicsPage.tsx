import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import PhysicsShapesTool from 'modules/PhysicsShapesTool'

const ToolsPhysicsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()

    useEffect(() => {
        setPageTitle(t.tools.physicsTitle)
        setPageDescription(t.tools.physicsDescription)
    }, [setPageTitle, setPageDescription, t.tools.physicsTitle, t.tools.physicsDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.tools.physicsTitle}
                description={t.tools.physicsDescription}
                iconName="Shapes"
                iconColor="violet"
                pipeline={false}
            >
                {(project) => <PhysicsShapesTool project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ToolsPhysicsPage)
