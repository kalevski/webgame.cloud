import React, { useEffect } from 'react'
import { useParams } from 'react-router'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import RouteTabs from 'components/RouteTabs'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import ProjectSettingsGeneral from 'modules/ProjectSettingsGeneral'
import ProjectSettingsCategoriesAndTags from 'modules/ProjectSettingsCategoriesAndTags'
import ProjectSettingsDanger from 'modules/ProjectSettingsDanger'

type SettingsTab = 'general' | 'categories-and-tags'

const ProjectSettingsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const p = t.projects
    const { id, tab: tabParam } = useParams()

    const tabs = [
        {
            id: 'general',
            label: p.settingsTabGeneral,
            icon: 'sliders-horizontal',
            path: `/projects/${id}/settings`,
        },
        {
            id: 'categories-and-tags',
            label: p.settingsTabCategoriesAndTags,
            icon: 'tags',
            path: `/projects/${id}/settings/categories-and-tags`,
        },
    ]
    const available = tabs.map((entry) => entry.id)
    const tab = (available.includes(tabParam ?? '') ? tabParam : 'general') as SettingsTab

    const descriptions: Record<SettingsTab, string> = {
        general: p.generalDescription,
        'categories-and-tags': p.categoriesAndTagsDescription,
    }
    const description = descriptions[tab]

    useEffect(() => {
        setPageTitle(p.tabSettings)
        setPageDescription(description)
    }, [setPageTitle, setPageDescription, p.tabSettings, description])

    return (
        <AuthGuard secured>
            <ProjectPageShell title={p.tabSettings} pipeline={false} subline={() => description}>
                {(project) => (
                    <>
                        <RouteTabs tabs={tabs} activeId={tab} />

                        {tab === 'general' && (
                            <>
                                <ProjectSettingsGeneral project={project} />
                                <ProjectSettingsDanger project={project} />
                            </>
                        )}
                        {tab === 'categories-and-tags' && <ProjectSettingsCategoriesAndTags project={project} />}
                    </>
                )}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ProjectSettingsPage)
