import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import BundleList from 'modules/BundleList'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'
import { Bundle } from 'types'

const BundlesPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const bundles = useStore((state) => state.bundles)
    const fetchBundles = useStore((state) => state.fetchBundles)

    const openWizard = useModalOpen<boolean, { projectId: string; bundle: Bundle | null }>(
        MODAL.BUNDLE_WIZARD
    )

    useEffect(() => {
        setPageTitle(t.bundles.title)
        setPageDescription(t.bundles.pageDescription)
    }, [setPageTitle, setPageDescription, t.bundles.title, t.bundles.pageDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.bundles.title}
                subline={() => (
                    <>
                        <strong>{bundles.length}</strong>
                        {` ${bundles.length === 1 ? t.bundles.ruleWord : t.bundles.rulesWord} ${t.bundles.subline}`}
                    </>
                )}
                action={(project) =>
                    project.permissions.includes('bundle.write') ? (
                        <tc-button
                            variant="primary"
                            onClick={() => {
                                openWizard({ projectId: project.id, bundle: null })
                                void fetchBundles(project.id)
                            }}
                        >
                            {t.bundles.create}
                        </tc-button>
                    ) : null
                }
            >
                {(project) => <BundleList project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(BundlesPage)
