import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import LiveBuilds from 'modules/LiveBuilds'
import LiveBuildDetail from 'modules/LiveBuildDetail'
import { useStore } from 'state'

const LiveBuildsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const { buildId } = useParams()
    const builds = useStore((state) => state.builds)

    useEffect(() => {
        setPageTitle(t.live.title)
        setPageDescription(t.live.pageDescription)
    }, [setPageTitle, setPageDescription, t.live.title, t.live.pageDescription])

    const live = builds.filter((build) => build.status === 'pass').length

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={buildId ? t.live.detailTitle : t.live.title}
                description={buildId ? t.live.detailDescription : t.live.pageDescription}
                iconName="Rocket"
                iconColor="emerald"
                subline={() => (
                    <>
                        <strong>{live}</strong>
                        {` ${t.live.subline}`}
                    </>
                )}
            >
                {(project) => (buildId ? <LiveBuildDetail project={project} /> : <LiveBuilds project={project} />)}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(LiveBuildsPage)
