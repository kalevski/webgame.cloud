import React, { useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
    TcActionItem,
    TcAssetBundle,
    TcSkeleton,
} from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import { MODAL, useModalOpen } from 'modals'
import { Bundle, Project } from 'types'

type Props = {
    project: Project
}

const BundleList: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const b = t.bundles

    const bundles = useStore((state) => state.bundles)
    const bundlesLoaded = useStore((state) => state.bundlesLoaded)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const fetchBundles = useStore((state) => state.fetchBundles)
    const fetchCategoriesAndTags = useStore((state) => state.fetchCategoriesAndTags)
    const deleteBundle = useStore((state) => state.deleteBundle)
    const runBuild = useStore((state) => state.runBuild)

    const canWrite = useProjectCan('bundle.write')
    const canBuild = useProjectCan('build.run')
    const navigate = useNavigate()

    useEffect(() => {
        void fetchBundles(project.id)
        void fetchCategoriesAndTags(project.id)
    }, [project.id, fetchBundles, fetchCategoriesAndTags])

    const openWizard = useModalOpen<boolean, { projectId: string; bundle: Bundle | null }>(
        MODAL.BUNDLE_WIZARD,
        () => {
            void fetchBundles(project.id)
        }
    )

    const menuItems: TcActionItem[] = [
        ...(canBuild ? [{ key: 'build', label: b.runBuild, icon: 'play-fill' }] : []),
        ...(canWrite
            ? [
                { key: 'edit', label: b.edit, icon: 'pencil' },
                { key: 'delete', label: t.assets.delete, icon: 'trash' },
            ]
            : []),
    ]

    const handleMenuItemClick = async (bundle: Bundle, key: string) => {
        if (key === 'build') {
            const started = await runBuild(project.id, bundle.id)
            if (started) navigate(`/projects/${project.id}/builds`)
            return
        }
        if (key === 'edit') openWizard({ projectId: project.id, bundle })
        if (key === 'delete') void deleteBundle(project.id, bundle.id)
    }

    const categoryName = (categoryId: string | null): string | undefined =>
        categoriesAndTags?.categories.find((category) => category.id === categoryId)?.name

    if (!bundlesLoaded) {
        return (
            <div className="console-stack">
                <TcSkeleton variant="rect" height={140} />
                <TcSkeleton variant="rect" height={140} />
            </div>
        )
    }

    return (
        <>
            <tc-alert variant="info" className="bundle-list__intro">{b.pageIntro}</tc-alert>
            <tc-text variant="muted" className="bundle-list__guide">{b.pageGuide}</tc-text>

            {bundles.length === 0 ? (
                <div className="console-empty">
                    <p className="console-empty__title">{b.emptyTitle}</p>
                    <p className="console-empty__body">{b.empty}</p>
                    {canWrite && (
                        <tc-button
                            variant="primary"
                            onClick={() => openWizard({ projectId: project.id, bundle: null })}
                        >
                            {b.create}
                        </tc-button>
                    )}
                </div>
            ) : (
                <div className="module bundle-list bundle-list--grid">
                    {bundles.map((bundle) => (
                        <TcAssetBundle
                            key={bundle.id}
                            className="bundle-card"
                            name={bundle.name}
                            target={bundle.engine}
                            targetIcon="box-seam"
                            category={categoryName(bundle.categoryId)}
                            includedTags={bundle.includedTags}
                            excludedTags={bundle.excludedTags}
                            counts={{ files: bundle.assetCount, builds: bundle.buildCount }}
                            buildTag={bundle.buildTag || undefined}
                            advanced={{
                                scale: bundle.downscale,
                                rotationEnabled: bundle.rotationEnabled,
                                algorithm: bundle.algorithm,
                            }}
                            menuItems={menuItems}
                            onMenuItemClick={(key) => void handleMenuItemClick(bundle, key)}
                        />
                    ))}
                </div>
            )}
        </>
    )
}

export default BundleList
