import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import BuildList from 'modules/BuildList'
import { useStore } from 'state'

const BuildsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const builds = useStore((state) => state.builds)
    const passed = builds.filter((build) => build.status === 'pass').length
    const tagged = builds.filter((build) => build.buildTag).length
    const purgeBuilds = useStore((state) => state.purgeBuilds)
    const untagged = builds.filter((build) => !build.buildTag).length

    useEffect(() => {
        setPageTitle(t.builds.title)
        setPageDescription(t.builds.pageDescription)
    }, [setPageTitle, setPageDescription, t.builds.title, t.builds.pageDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.builds.title}
                subline={() => (
                    <>
                        <strong>{passed}</strong>
                        {` ${t.builds.passedOf} `}
                        <strong>{builds.length}</strong>
                        {` ${builds.length === 1 ? t.builds.buildWord : t.builds.buildsWord}`}
                        {tagged > 0 && ` · ${t.builds.taggedCount(tagged)}`}
                    </>
                )}
                action={(project) =>
                    project.permissions.includes('build.run') && untagged > 0 ? (
                        <tc-button
                            variant="danger"
                            outline
                            onClick={() => void purgeBuilds(project.id)}
                        >
                            {t.builds.purgeCount(untagged)}
                        </tc-button>
                    ) : null
                }
            >
                {(project) => <BuildList project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(BuildsPage)
