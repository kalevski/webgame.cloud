import React, { useEffect, useState } from 'react'
import { wrapInMainLayout } from 'layouts/MainLayout'
import { usePageContext } from 'contexts/PageContext'
import useStrings from 'hooks/useStrings'
import AuthGuard from 'modules/AuthGuard'
import ProjectPageShell from 'components/ProjectPageShell'
import { TcTabItem, TcTabSections } from 'lib/tc'
import ConfigEditor from 'modules/ConfigEditor'
import SchemaEditor from 'modules/SchemaEditor'
import { useStore } from 'state'
import { MODAL, useModalOpen } from 'modals'

const ConfigsPage: React.FC = () => {
    const { setPageTitle, setPageDescription } = usePageContext()
    const { t } = useStrings()
    const [activeTab, setActiveTab] = useState('configs')
    const configs = useStore((state) => state.configs)
    const schemas = useStore((state) => state.schemas)

    const activeProjectId = useStore((state) => state.activeProjectId)
    const fetchConfigs = useStore((state) => state.fetchConfigs)
    const fetchSchemas = useStore((state) => state.fetchSchemas)

    const openCreate = useModalOpen<boolean, string>(MODAL.CREATE_CONFIG, () => {
        if (activeProjectId) void fetchConfigs(activeProjectId)
    })
    const createSchema = useStore((state) => state.createSchema)

    useEffect(() => {
        setPageTitle(t.configs.title)
        setPageDescription(t.configs.pageDescription)
    }, [setPageTitle, setPageDescription, t.configs.title, t.configs.pageDescription])

    const tabItems: TcTabItem[] = [
        { key: 'configs', label: t.configs.tabConfigs },
        { key: 'schemas', label: t.configs.tabSchemas },
    ]

    return (
        <AuthGuard secured>
            <ProjectPageShell
                title={t.configs.title}
                description={t.configs.pageDescription}
                iconName="Sliders"
                iconColor="pink"
                subline={() => (
                    <>
                        <strong>{configs.length}</strong>
                        {` ${configs.length === 1 ? t.configs.configWord : t.configs.configsWord} · `}
                        <strong>{schemas.length}</strong>
                        {` ${schemas.length === 1 ? t.configs.schemaWord : t.configs.schemasWord}`}
                    </>
                )}
                action={(project) =>
                    project.permissions.includes('config.write') ? (
                        <tc-button
                            variant="primary"
                            disabled={activeTab === 'configs' && schemas.length === 0 ? true : undefined}
                            onClick={() => {
                                if (activeTab === 'configs') openCreate(project.id)
                                else void createSchema(project.id)
                            }}
                        >
                            {activeTab === 'configs' ? t.configs.createConfig : t.configs.createSchema}
                        </tc-button>
                    ) : null
                }
            >
                {(project) => (
                    <>
                        <TcTabSections activeKey={activeTab} items={tabItems} onChange={setActiveTab} />
                        {activeTab === 'configs' ? (
                            <ConfigEditor project={project} />
                        ) : (
                            <SchemaEditor project={project} />
                        )}
                    </>
                )}
            </ProjectPageShell>
        </AuthGuard>
    )
}

export default wrapInMainLayout(ConfigsPage)
