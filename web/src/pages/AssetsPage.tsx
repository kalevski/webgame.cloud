import React, { useEffect } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import FileList from 'modules/FileList'
import { useStore } from 'state'
import { formatBytes } from 'helpers/format'

const AssetsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const assets = useStore((state) => state.assets)
    const storedBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0)

    useEffect(() => {
        setPageTitle(t.assets.title)
        setPageDescription(t.assets.pageDescription)
    }, [setPageTitle, setPageDescription, t.assets.title, t.assets.pageDescription])

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.assets.title}
                description={t.assets.pageDescription}
                iconName="Image"
                iconColor="violet"
                subline={() => (
                    <>
                        <strong>{assets.length}</strong>
                        {` ${assets.length === 1 ? t.assets.fileWord : t.assets.filesWord} · `}
                        <strong>{formatBytes(storedBytes)}</strong>
                        {` ${t.assets.stored}`}
                    </>
                )}
            >
                {(project) => <FileList project={project} />}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(AssetsPage)
